import React, { useContext, useEffect, useState } from "react";
import "./catalog.css";
import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { CartContext } from "../../utilits/CartContext/CartContext";
import { AlertContext } from "../../utilits/AlertContext/AlertContext";
import BotIcon from "../../assents/images/bot.png"
import SortIcon from "../../assents/images/Sort.png"
import StarIcon from "@mui/icons-material/Star";
import CustomCalendarProps from '../../Pages/MyBots/CustomCalendarProps';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Popover from '@mui/material/Popover';
import ChatBot from "../../assents/images/chats-bot.png"
import UsersBot from "../../assents/images/users-bot.png"
import UsersBotActive from "../../assents/images/users-bot-active.png"

const SORT_OPTIONS = [
  { key: "rate", label: <><span>Рейтинг</span> <StarIcon fontSize="small" style={{ color: '#3b5bfd', marginLeft: 2 }} /></> },
  { key: "purchases", label: "Покупки" },
  // { key: "volume", label: "Объем" },
  { key: "price", label: "Цена" },
  { key: "ru", label: "RU" },
  { key: "men", label: "МЦА" },
];

const Catalog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleItems, setVisibleItems] = useState(5);
  const [items, setItems] = useState([]);
  const { addToCart } = useContext(CartContext);
  const { showAlert } = useContext(AlertContext);
  const [categories, setCategories] = useState({});
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sorts, setSorts] = useState([
    { key: "rate", active: false, asc: true },
    { key: "purchases", active: false, asc: true },
    { key: "volume", active: false, asc: true },
    { key: "price", active: false, asc: true },
    { key: "ru", active: false, asc: true },
    { key: "men", active: false, asc: true },
  ]);
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterOpen, setFilterOpen] = useState({
    category: false,
    date: false,
    price: false,
    audience: false,
  });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [audienceRange, setAudienceRange] = useState({ min: '', max: '' });
  const [anchorEl, setAnchorEl] = useState({ category: null, date: null, price: null, audience: null });

  const token = sessionStorage.getItem('access_token');

  useEffect(() => {
    const fetchCategoryBots = async (categoryId) => {
      const response = await fetch(
        `https://flyersendtest.ru/api/bot/catalog/?category=${categoryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Ошибка загрузки категории ${categoryId}`);
      }
      const data = await response.json();
      return data.result;
    };

    const loadBots = async () => {
      try {
        const sortQuery = getSortQuery();
        const url = `https://flyersendtest.ru/api/bot/catalog/?category=1${sortQuery ? "&" + sortQuery : ""}`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Ошибка загрузки");
        const data = await response.json();
        setItems([...data.result]);
      } catch (err) {
        console.error(err);
        showAlert("Ошибка загрузки каталога", "error");
      }
    };

    loadBots();
  }, [token, showAlert, sorts, sortDirection]);

  const fetchBots = async () => {
    const accessToken = sessionStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch('https://flyersendtest.ru/api/user/bots/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBots(data.result || []);
      }
    } catch (error) {
      console.error('Ошибка при получении ботов:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      const accessToken = sessionStorage.getItem('access_token');
      if (!token) return;
      try {
        const response = await fetch('https://flyersendtest.ru/api/bot/category/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setCategories(data.result);
        }
      } catch (error) {
        console.error('Ошибка при получении категорий:', error);
      }
    };
    fetchCategories();
    fetchBots();
  }, []);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleAddToCart = (item) => {
    const isAdded = addToCart(item);
    console.log(item);
    if (isAdded) {
      showAlert("Бот добавлен в корзину!", "success");
    } else {
      showAlert("Этот бот уже добавлен в корзину!", "warning");
    }
  };
  const handleShowMore = () => setVisibleItems((prev) => prev + 5);

  const getSortQuery = () => {
    return sorts
      .filter(s => s.active)
      .map(s => `sort=${s.asc ? "%2B" : "-"}${s.key}`)
      .join("&");
  };

  const handleSortClick = (key) => {
    const currentSort = sorts.find(s => s.key === key);
    const newAsc = currentSort && currentSort.active ? !currentSort.asc : true;
    
    // Обновляем направление сортировки
    setSortDirection(newAsc ? 'asc' : 'desc');
  };

  const handleSortIconClick = () => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
    // Применяем текущую активную сортировку с новым направлением
    const activeSort = sorts.find(s => s.active);
    if (activeSort) {
      setSorts(prev =>
        prev.map(s =>
          s.key === activeSort.key
            ? { ...s, asc: newDirection === 'asc' }
            : s
        )
      );
    }
  };

  // Filtering logic
  const applyFilters = (list) => {
    return list.filter((item) => {
      // Category filter
      if (selectedCategories.length > 0) {
        if (!item.categories || !item.categories.some((catId) => selectedCategories.includes(String(catId)))) {
          return false;
        }
      }
      // Date filter (skipped, as bots don't have date fields in this context)
      // Price filter
      if (priceRange.min && Number(item.price) < Number(priceRange.min)) return false;
      if (priceRange.max && Number(item.price) > Number(priceRange.max)) return false;
      // Audience filter (file?.users)
      if (audienceRange.min && Number(item.file?.users ?? 0) < Number(audienceRange.min)) return false;
      if (audienceRange.max && Number(item.file?.users ?? 0) > Number(audienceRange.max)) return false;
      return true;
    });
  };

  const filteredItems = applyFilters(items).filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Category names array for rendering
  const categoryList = categories && typeof categories === 'object'
    ? Object.entries(categories).map(([id, cat]) => ({ id, name: cat.name }))
    : [];

  // Filter handlers
  const handleCategoryChange = (id) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };
  const handleDateChange = (start, end) => {
    setDateRange({ start, end });
    setFilterOpen((prev) => ({ ...prev, date: false }));
  };
  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setPriceRange((prev) => ({ ...prev, [name]: value.replace(/\D/g, '') }));
  };
  const handleAudienceChange = (e) => {
    const { name, value } = e.target;
    setAudienceRange((prev) => ({ ...prev, [name]: value.replace(/\D/g, '') }));
  };

  return (
    <div className="catalog">
      <h3 className="catalog-title">Каталог</h3>
      <div className="catalog-header">
        <TextField
          variant="outlined"
          placeholder="Поиск..."
          className="search-input"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </div>
      <div className="catalog-filter-box-content">
        <p className="catalog-filter-box-title">Фильтры</p>
        <div className="catalog-filter-box">
          <div>
            <button
              className={`catalog-filter-btn${Boolean(anchorEl.category) ? ' active' : ''}`}
              onClick={e => setAnchorEl(prev => ({ ...prev, category: anchorEl.category ? null : e.currentTarget }))}
            >
              Категории <KeyboardArrowDownIcon fontSize="small" />
            </button>
            <Popover
              open={Boolean(anchorEl.category)}
              anchorEl={anchorEl.category}
              onClose={() => setAnchorEl(prev => ({ ...prev, category: null }))}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              PaperProps={{ style: { borderRadius: 14, minWidth: 180, padding: '16px 18px' } }}
            >
              <div>
                {categoryList.map((cat) => (
                  <label key={cat.id} className="catalog-filter-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={() => handleCategoryChange(cat.id)}
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </Popover>
          </div>
          {/* Даты */}
          <div style={{ position: "relative" }}>
            <button
              className={`catalog-filter-btn${Boolean(anchorEl.date) ? ' active' : ''}`}
              onClick={e => setAnchorEl(prev => ({ ...prev, date: anchorEl.date ? null : e.currentTarget }))}
            >
              Даты <KeyboardArrowDownIcon fontSize="small" />
            </button>
            <Popover
              open={Boolean(anchorEl.date)}
              anchorEl={anchorEl.date}
              onClose={() => setAnchorEl(prev => ({ ...prev, date: null }))}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              PaperProps={{ style: { borderRadius: 14, minWidth: 260, padding: '16px 18px', left: 0, top: 0, } }}
            >
              <div>
                <CustomDatePicker onChange={handleDateChange} onClose={() => setAnchorEl(prev => ({ ...prev, date: null }))} />
              </div>
            </Popover>
          </div>
          {/* Цена */}
          <div>
            <button
              className={`catalog-filter-btn${Boolean(anchorEl.price) ? ' active' : ''}`}
              onClick={e => setAnchorEl(prev => ({ ...prev, price: anchorEl.price ? null : e.currentTarget }))}
            >
              Цена <KeyboardArrowDownIcon fontSize="small" />
            </button>
            <Popover
              open={Boolean(anchorEl.price)}
              anchorEl={anchorEl.price}
              onClose={() => setAnchorEl(prev => ({ ...prev, price: null }))}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              PaperProps={{ style: { borderRadius: 14, minWidth: 180, padding: '16px 18px' } }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  name="min"
                  placeholder="USDT от"
                  value={priceRange.min}
                  onChange={handlePriceChange}
                  className="catalog-filter-input"
                  style={{ width: 80 }}
                />
                <span style={{ alignSelf: 'center' }}>-</span>
                <input
                  type="text"
                  name="max"
                  placeholder="USDT до"
                  value={priceRange.max}
                  onChange={handlePriceChange}
                  className="catalog-filter-input"
                  style={{ width: 80 }}
                />
              </div>
            </Popover>
          </div>
          {/* Аудитория */}
          <div>
            <button
              className={`catalog-filter-btn${Boolean(anchorEl.audience) ? ' active' : ''}`}
              onClick={e => setAnchorEl(prev => ({ ...prev, audience: anchorEl.audience ? null : e.currentTarget }))}
            >
              Аудитория <KeyboardArrowDownIcon fontSize="small" />
            </button>
            <Popover
              open={Boolean(anchorEl.audience)}
              anchorEl={anchorEl.audience}
              onClose={() => setAnchorEl(prev => ({ ...prev, audience: null }))}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              PaperProps={{ style: { borderRadius: 14, minWidth: 180, padding: '16px 18px' } }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  name="min"
                  placeholder="от"
                  value={audienceRange.min}
                  onChange={handleAudienceChange}
                  className="catalog-filter-input"
                  style={{ width: 60 }}
                />
                <span style={{ alignSelf: 'center' }}>-</span>
                <input
                  type="text"
                  name="max"
                  placeholder="до"
                  value={audienceRange.max}
                  onChange={handleAudienceChange}
                  className="catalog-filter-input"
                  style={{ width: 60 }}
                />
              </div>
            </Popover>
          </div>
        </div>
      </div>
      <div style={{ margin: "16px 0" }}>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>Сортировка</div>
        <div className="catalog-sort-btn-box">
          <button
            className={`catalog-sort-btn${sorts.some(s => s.active) ? ' active' : ''}`}
            style={{
              padding: "8px 12px",
              borderRadius: 12,
              background: sorts.some(s => s.active) ? "#fff" : "#f5f6f8",
              border: "none",
              outline: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              fontSize: 18,
              color: sorts.some(s => s.active) ? "#3b5bfd" : "#888",
            }}
            onClick={handleSortIconClick}
          >
            <span 
              className="material-icons" 
              style={{ 
                fontSize: 20,
                transform: sortDirection === 'desc' ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 0.3s ease'
              }}
            >
              <img src={SortIcon} alt="sort" style={{ width: 20, height: 20 }} />
            </span>
          </button>
          {SORT_OPTIONS.map((opt) => {
            const isActive = sorts.some(s => s.key === opt.key && s.active);
            const currentSort = sorts.find(s => s.key === opt.key);
            return (
              <button
                key={opt.key}
                onClick={() => {
                  // Deactivate all other sorts first
                  setSorts(prev => prev.map(s => ({ 
                    ...s, 
                    active: s.key === opt.key ? !s.active : false,
                    asc: s.key === opt.key ? (s.active ? !s.asc : true) : s.asc
                  })));
                  // Обновляем направление сортировки
                  const newAsc = currentSort && currentSort.active ? !currentSort.asc : true;
                  setSortDirection(newAsc ? 'asc' : 'desc');
                }}
                className={`catalog-sort-btn${isActive ? " active" : ""}`}
              >
                {opt.label}
                {isActive && (
                  <span>

                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="catalog-box">
        {filteredItems.slice(0, visibleItems).map((item) => (
          <div key={item.id || item.number} className="catalog-item">
            <div className="item-text">
              <div className="item-details">
                {item.photo !== null ? (
                  <img src={item.photo} alt="Бот" className="item-image" />
                ) : (
                  <img src={BotIcon} alt="Бот" className="item-image" />
                )}
                <div className="item-text__details">
                  <h3 className="item-title">
                    {item.name}
                    <span className="item-rating">
                      <span className="item-rating__star">★</span>{" "}
                      {item.rate_count}
                    </span>
                  </h3>
                  <p className="my-bots__item-title-text-category">
                    {item.categories && categories
                      ? item.categories
                        .map(catId => categories[String(catId)]?.name)
                        .filter(Boolean)
                        .join(', ')
                      : ''}
                  </p>
                </div>
              </div>

              <div className="item-stats">
                <div className="item-stats__box">
                  <span className="item-stats__text">
                    <img src={UsersBot} alt="users-bot" />
                    <span className="item-stats__text-span">
                      <span style={{ color: (item.file?.users === 0 ? '#c5c8d0' : 'inherit') }}>{item.file?.users ?? "-"} тыс</span>
                    </span>
                  </span> 
                  <span className="item-stats__text">
                    Покупок:{" "}
                    <span className="item-stats__text-span">
                      {item.data?.purchases ?? 0} 
                    </span>
                  </span>
                  
                  <span className="item-stats__text">
                    <img src={ChatBot} alt="chats-bot" />
                    <span className="item-stats__text-span">
                      <span style={{ color: (item.file?.chats === 0 ? '#c5c8d0' : 'inherit') }}>{item.file?.chats ?? "-"} тыс</span>
                    </span>
                  </span>
                  <span className="item-stats__text">
                    RU: <span className="item-stats__text-span">{item.data?.ru ?? "-"} </span> %
                  </span>
                  <span className="item-stats__text">
                    <img src={UsersBotActive} alt="users-bot-active" />
                    <span className="item-stats__text-span">
                      <span style={{ color: (item.file?.users_in_chats === 0 ? '#c5c8d0' : 'inherit') }}>{item.file?.users_in_chats ?? "-"} тыс</span>
                    </span>
                  </span>
                 
                 
                  <span className="item-stats__text">
                    МЦА: <span className="item-stats__text-span">{item.data?.men ?? "-"}</span> %
                  </span>
                </div>
               
              </div>
              <div className="item-price-box">
                <button
                  className="item-price"
                  onClick={() => handleAddToCart(item)}
                >
                  USDT {item.price}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {visibleItems < filteredItems.length && (
        <div className="show-more">
          <button className="show-more-button" onClick={handleShowMore}>
            Показать еще
          </button>
        </div>
      )}
    </div>
  );
};

function CustomDatePicker({ onChange, onClose }) {
  const MONTHS = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const [viewYear, setViewYear] = useState(2025);
  const [viewMonth, setViewMonth] = useState(8); // Сентябрь (0-индекс)
  const [range, setRange] = useState({ start: null, end: null });

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }
  function getFirstDayOfWeek(year, month) {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  }
  function getPrevMonthDays(year, month) {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    const firstDay = getFirstDayOfWeek(year, month);
    return Array.from({ length: firstDay }, (_, i) => daysInPrevMonth - firstDay + i + 1);
  }
  function getNextMonthDays(year, month, prevCount, currCount) {
    const total = prevCount + currCount;
    const nextCount = total % 7 === 0 ? 0 : 7 - (total % 7);
    return Array.from({ length: nextCount }, (_, i) => i + 1);
  }
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const prevMonthDays = getPrevMonthDays(viewYear, viewMonth);
  const nextMonthDays = getNextMonthDays(viewYear, viewMonth, prevMonthDays.length, daysInMonth);

  function handlePrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  }
  function handleNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  }
  function handleSelect(day, isCurrent) {
    if (!isCurrent) return;
    const selectedDate = new Date(viewYear, viewMonth, day);
    if (!range.start || (range.start && range.end)) {
      setRange({ start: selectedDate, end: null });
    } else if (range.start && !range.end) {
      if (selectedDate < range.start) {
        setRange({ start: selectedDate, end: range.start });
        if (onChange) onChange(selectedDate, range.start);
        if (onClose) onClose();
      } else {
        setRange({ start: range.start, end: selectedDate });
        if (onChange) onChange(range.start, selectedDate);
        if (onClose) onClose();
      }
    }
  }
  function isInRange(day) {
    if (!range.start || !range.end) return false;
    const d = new Date(viewYear, viewMonth, day);
    return d > range.start && d < range.end;
  }
  function isSelected(day) {
    if (!range.start && !range.end) return false;
    const d = new Date(viewYear, viewMonth, day);
    return (
      (range.start && d.getTime() === range.start.getTime()) ||
      (range.end && d.getTime() === range.end.getTime())
    );
  }
  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button className="calendar-arrow calendar-arrow--left" onClick={handlePrevMonth}>&lt;</button>
        <span className="calendar-title">{MONTHS[viewMonth]} {viewYear}</span>
        <button className="calendar-arrow calendar-arrow--right" onClick={handleNextMonth}>&gt;</button>
      </div>
      <div className="calendar-days-row">
        {DAYS.map(day => (
          <div key={day} className="calendar-day-name">{day}</div>
        ))}
      </div>
      <div className="calendar-grid">
        {prevMonthDays.map((d, i) => (
          <div key={'prev' + i} className="calendar-day calendar-day--other">{d}</div>
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const selected = isSelected(day);
          const inRange = isInRange(day);
          let dayClass = 'calendar-day';
          if (selected) dayClass += ' calendar-day--selected';
          if (inRange) dayClass += ' calendar-day--range';
          return (
            <button
              key={day}
              className={dayClass}
              onClick={() => handleSelect(day, true)}
              type="button"
            >
              {day}
            </button>
          );
        })}
        {nextMonthDays.map((d, i) => (
          <div key={'next' + i} className="calendar-day calendar-day--other">{d}</div>
        ))}
      </div>
    </div>
  );
}

export default Catalog;
