import React, { useEffect, useState, useRef } from "react";
import { formatDate } from "../MyBots/utils.js";
import SearchIcon from '@mui/icons-material/Search';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CalendarPopup from "./CalendarPopup";
import "./history.css";
import UsersBot from "../../assents/images/users-bot.png";
import ChatsBot from "../../assents/images/chats-bot.png";
import UsersInChatsBot from "../../assents/images/users-bot-active.png";
import BotIcon from "../../assents/images/bot.png";
import DateIcon from "../../assents/images/data_icon.png";
import CalendarPc from "./CalendarPc";

function formatInputDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

const DateInput = ({ value, onClick, placeholder, iconPosition = "left", showCalendar, onSelect, onClose, calendarRef, initialMonth, minDate, maxDate }) => (
  <div className={`history__date-input-wrap ${iconPosition}`} onClick={onClick} tabIndex={0} style={{ position: 'relative' }}>
    {iconPosition === "left" && <CalendarTodayIcon className="history__date-icon" />}
    <span className="history__date-placeholder">{placeholder}</span>
    {value && <span className="history__date-value">{formatInputDate(value)}</span>}
    {iconPosition === "right" && <CalendarTodayIcon className="history__date-icon" />}

    {showCalendar && (
      <div className="calendar-popup-outer" ref={calendarRef}>
        <CalendarPopup
          selected={value}
          onSelect={onSelect}
          onClose={onClose}
          initialMonth={initialMonth}
          minDate={minDate}
          maxDate={maxDate}
        />
      </div>
    )}
  </div>
);

// Функция перевода статуса с английского на русский
function translateStatus(status) {
  const statusMap = {
    'confirmed': 'завершено',
    'awaiting confirmation': 'в обработке',
    'cancelled': 'отменено',
    'pending': 'ожидает',
    'processing': 'обрабатывается',
    'completed': 'завершено',
    'failed': 'неудачно',
    'waiting': 'ожиданние',
    'refused': 'отклонено'
  };
  return statusMap[status] || status;
}

// Функция группировки по дате
function groupPurchasesByDate(purchases) {
  const groups = {};
  purchases.flat().forEach(purchase => {
    const date = new Date(purchase.datetime * 1000);
    const dateStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(purchase);
  });
  // Вернуть массив: [{date: '01.09.2025', items: [...]}, ...]
  return Object.entries(groups)
    .sort((a, b) => {
      // Сортировка по дате (новые вниз)
      const [dA, dB] = [a[0].split('.').reverse().join('-'), b[0].split('.').reverse().join('-')];
      return new Date(dA) - new Date(dB);
    })
    .map(([date, items]) => ({ date, items }));
}

const History = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [showCalendar, setShowCalendar] = useState(null); // 'from' | 'to' | null
  const [showCalendarPc, setShowCalendarPc] = useState(false); // для CalendarPc
  const [category, setCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("all");
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const calendarRef = useRef();

  useEffect(() => {
    const fetchPurchases = async () => {
      const accessToken = sessionStorage.getItem('access_token');
      if (!accessToken) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch('https://flyersendtest.ru/api/purchase/list/', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setPurchases(data.result || []);
          setFilteredPurchases(data.result || []);
        }
      } catch (error) {
        console.error('Ошибка при получении списка покупок:', error);
      } finally {
        setLoading(false);
      }
    };
    const fetchCategories = async () => {
      const accessToken = sessionStorage.getItem('access_token');
      if (!accessToken) return;
      try {
        const response = await fetch('https://flyersendtest.ru/api/bot/category/', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setCategories(
            data.result
              ? Object.entries(data.result).map(([id, obj]) => ({ ...obj, id: Number(id) }))
              : []
          );
          setCategoryMap(data.result || {});
        }
      } catch (error) {
        // ignore
      }
    };
    fetchPurchases();
    fetchCategories();
  }, []);

  useEffect(() => {
    let filtered = [...purchases];
    if (searchQuery) {
      filtered = filtered.map(group =>
        group.filter(purchase =>
          purchase.bot.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      ).filter(group => group.length > 0);
    }
    if (status !== "all") {
      filtered = filtered.map(group =>
        group.filter(purchase => {
          if (status === 'confirmed') return purchase.status === 'confirmed' || purchase.status === 'завершено';
          if (status === 'awaiting confirmation') return purchase.status === 'awaiting confirmation' || purchase.status === 'в обработке';
          if (status === 'cancelled') return purchase.status === 'cancelled' || purchase.status === 'отменено';
          return true;
        })
      ).filter(group => group.length > 0);
    }
    // Фильтрация по выбранным датам
    if (dateFrom || dateTo) {
      filtered = filtered.map(group =>
        group.filter(purchase => {
          const purchaseDate = new Date(purchase.datetime * 1000);
          if (dateFrom && purchaseDate < new Date(dateFrom).setHours(0, 0, 0, 0)) return false;
          if (dateTo && purchaseDate > new Date(dateTo).setHours(23, 59, 59, 999)) return false;
          return true;
        })
      ).filter(group => group.length > 0);
    }
    if (category !== "all") {
      console.log('category value:', category);
      console.log('categories in select:', categories);
      filtered = filtered.map(group =>
        group.filter(purchase => {
          console.log('purchase.bot.categories:', purchase.bot.categories);
          if (!purchase.bot.categories) return false;
          return purchase.bot.categories.map(Number).includes(Number(category));
        })
      ).filter(group => group.length > 0);
    }
    setFilteredPurchases(filtered);
  }, [searchQuery, status, dateFrom, dateTo, category, purchases]);

  // Закрытие календаря по клику вне
  useEffect(() => {
    function handleClickOutside(e) {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(null);
      }
    }
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="history">
      <h3 className="history__title">История покупок</h3>
      <div className="history__filters-panel">
        <div className="history__filters-panel-row">
          <div className="history__search">
            <SearchIcon className="history__search-icon" />
            <input
              type="text"
              placeholder="Поиск...."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="history__search-input"
            />
          </div>
          <div className="history__filters-date__mobile">
            <CalendarPc
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              isOpen={showCalendarPc}
              onOpenChange={setShowCalendarPc}
            />
          </div>
        </div>
        <select
          className="history__category-select"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          <option value="all">Все категории <KeyboardArrowDownIcon className="history__category-select-icon" /></option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <div className="history__filters-date__pc">
          <CalendarPc
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            isOpen={showCalendarPc}
            onOpenChange={setShowCalendarPc}
          />
        </div>
      </div>
      <div className="history__status-tabs">
        <button className={status === 'all' ? 'active' : ''} onClick={() => setStatus('all')}>Все</button>
        <button className={status === 'confirmed' ? 'active' : ''} onClick={() => setStatus('confirmed')}>Завершённые</button>
        <button className={status === 'awaiting confirmation' ? 'active' : ''} onClick={() => setStatus('awaiting confirmation')}>В обработке</button>
        <button className={status === 'cancelled' || status === 'refused' ? 'active' : ''} onClick={() => setStatus('refused')}>Отменённые</button>
      </div>

      {/* Индикатор количества записей */}
      <div className="history__results-info">
        <span>Найдено записей: {filteredPurchases.reduce((total, group) => total + group.length, 0)}</span>
        {(dateFrom || dateTo || searchQuery || status !== 'all' || category !== 'all') && (
          <button
            className="history__clear-filters"
            onClick={() => {
              setDateFrom(null);
              setDateTo(null);
              setSearchQuery("");
              setStatus("all");
              setCategory("all");
            }}
          >
            Очистить фильтры
          </button>
        )}
      </div>

      {/* {formatDate(purchase.datetime)} */}
      <div className="history__list">
        {groupPurchasesByDate(filteredPurchases).map((group, groupIndex) => (
          <div key={groupIndex} className="history__group">
            <div className="history__group-date" style={{ fontWeight: 500, margin: '10px 0 8px 0' }}>Дата: {group.date}</div>
            {group.items.map((purchase) => (
              <div key={purchase.post_id} className="history__item">
                <div className="history__item-header">
                  <div className="history__item-date">
                    <div className="history__item-date-icon">
                      <img src={purchase.bot.photo || BotIcon} alt="" />
                    </div>
                    <div className="history__item-date-text">
                      <p className="history__item-date-text-name">{purchase.bot.name} <span className="history__item-date-text-name-status">{translateStatus(purchase.status)}</span></p>
                      <p className="history__item-date-text-categories">{Array.isArray(purchase.bot.categories) && purchase.bot.categories.length > 0
                        ? purchase.bot.categories.map(cid => categoryMap[cid]?.name || cid).join(', ')
                        : ''}</p>
                    </div>
                  </div>
                </div>
                <div className="history__item-content">
                  <div className="history__item-bot">

                    <div className="history__item-bot-stats2col">
                      <div className="history__item-bot-stats2col-col">
                        <div className="history__item-bot-stat">
                          <img src={UsersBot} alt="users" className="history__item-bot-stat-icon" />
                          <span className={purchase.bot.file.users > 0 ? "history__item-bot-stat-value" : "history__item-bot-stat-value zero"}>{purchase.bot.file.users > 0 ? purchase.bot.file.users + ' тыс' : '0 тыс'}</span>
                        </div>
                        <div className="history__item-bot-stat">
                          <img src={ChatsBot} alt="chats" className="history__item-bot-stat-icon" />
                          <span className={purchase.bot.file.chats > 0 ? "history__item-bot-stat-value" : "history__item-bot-stat-value zero"}>{purchase.bot.file.chats > 0 ? purchase.bot.file.chats + ' тыс' : '0 тыс'}</span>
                        </div>
                        <div className="history__item-bot-stat">
                          <img src={UsersInChatsBot} alt="users in chats" className="history__item-bot-stat-icon" />
                          <span className={purchase.bot.file.users_in_chats > 0 ? "history__item-bot-stat-value" : "history__item-bot-stat-value zero"}>{purchase.bot.file.users_in_chats > 0 ? purchase.bot.file.users_in_chats + ' тыс' : '0 тыс'}</span>
                        </div>
                      </div>
                      <div className="history__item-bot-stats2col-col">
                        <div className="history__item-bot-stat">
                          <span className="history__item-bot-stat-label">Покупок:</span>
                          <span className="history__item-bot-stat-value blue">{purchase.bot.data && purchase.bot.data.purchases !== undefined ? purchase.bot.data.purchases : 0}</span>
                        </div>
                        <div className="history__item-bot-stat">
                          <span className="history__item-bot-stat-label">RU:</span>
                          <span className="history__item-bot-stat-value blue">{purchase.bot.data && purchase.bot.data.ru !== undefined ? purchase.bot.data.ru : 0} %</span>
                        </div>
                        <div className="history__item-bot-stat">
                          <span className="history__item-bot-stat-label">МЦА:</span>
                          <span className="history__item-bot-stat-value blue">{purchase.bot.data && purchase.bot.data.men !== undefined ? purchase.bot.data.men : 0} %</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="history__item-amount">
                    {purchase.amount} USDT
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default History; 