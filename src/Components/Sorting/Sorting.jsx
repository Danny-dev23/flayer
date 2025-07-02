import React, { useContext, useState, useEffect } from "react";
import "./sorting.css";
import botImage from "../../assents/images/botImage.png";
import SortingImage from "../../assents/images/sorting-modal__img.png";
import { CartContext } from "../../utilits/CartContext/CartContext";
import { AlertContext } from "../../utilits/AlertContext/AlertContext";
import { StepContext } from "../../utilits/StepContext/StepContext";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import CloseIcon from "@mui/icons-material/Close";
import {
  Dialog,
  DialogContent,
  Button,
  Box,
  MobileStepper,
  Typography,
  TextField,
  InputAdornment,
} from "@mui/material";
import BotIcon from "../../assents/images/bot.png";
import SmartLoader from "../../assents/images/smart-loader.png";
import ArrowLeft from "../../assents/images/arrow-left.png";
import ArrowRight from "../../assents/images/arrow-right.png";
import UsersBot from "../../assents/images/users-bot.png";
import UsersBotActive from "../../assents/images/users-bot-active.png";
import ChatBot from "../../assents/images/chats-bot.png";

const Sorting = () => {
  const [postType, setPostType] = useState("ordinary");
  const [audience, setAudience] = useState("none");
  const [budgetFrom, setBudgetFrom] = useState("");
  const [budgetTo, setBudgetTo] = useState("");
  const [visibleItems, setVisibleItems] = useState(6);
  const { addToCart } = useContext(CartContext);
  const { showAlert } = useContext(AlertContext);
  const { setStep } = useContext(StepContext);
  const [modalOpen, setModalOpen] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [category, setCategory] = useState(1); // 1 - обычное, 2 - гемблинг
  const [budget, setBudget] = useState(""); // только "от"
  const [dateStart, setDateStart] = useState(null);
  const [dateEnd, setDateEnd] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [file, setFile] = useState(null);
  const [apiResults, setApiResults] = useState(null); // Новое состояние для результатов API
  const [isLoading, setIsLoading] = useState(false); // Состояние загрузки
  const [categories, setCategories] = useState({});
  const [bots, setBots] = useState([]);
  const [excludedBotNumbers, setExcludedBotNumbers] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const token = sessionStorage.getItem('access_token');

  const nextId = React.useRef(0);
  const addUniqueId = (bot) => ({
    ...bot,
    _uniqueId: nextId.current++,
  });

  const slides = [
    () => (
      <div className="sorting-modal slide-1">
        <img src={SortingImage} alt="" className="slide-1__image" />
        <strong className="slide-modal__title">Умный подбор</strong>
        <p className="slide-modal__description">
          Наш сервис поможет вам подобрать подходящих ботов под ваш бюджет и
          целевую аудиторию
        </p>
        <button
          className="slide-modal__button"
          variant="contained"
          fullWidth
          onClick={handleNext} // Переход к следующему слайду
        >
          Начать подбор
        </button>
      </div>
    ),
    () => (
      <div className="sorting-modal slide-2">
        <strong className="slide-modal__title">Тип поста</strong>
        <p className="slide-modal__title-2">
          Выберите, какой тип размещения вам нужен
        </p>
        <div className="sorting-modal__button-group">
          <button
            className={`sorting-modal__button-2 ${category === 1 ? "active" : ""}`}
            onClick={() => setCategory(1)}
          >
            <p className="sorting-modal__button-2__text">Обычный</p>
          </button>
          <button
            className={`sorting-modal__button-2 ${category === 2 ? "active" : ""}`}
            onClick={() => setCategory(2)}
          >
            <p className="sorting-modal__button-2__text">Гемблинг</p>
          </button>
        </div>
      </div>
    ),
    () => (
      <div className="sorting-modal slide-3">
        <strong className="slide-modal__title">Бюджет</strong>
        <p className="slide-modal__title-2">
          Выберите, какой тип размещения вам нужен
        </p>
        <div className="slide-modal__group">
          <input
            type="number"
            className="slide-modal__group-input"
            placeholder="Бюджет"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            required
          />
        </div>
      </div>
    ),
    () => (
      <div className="sorting-modal slide-4">
        <strong className="slide-modal__title">Даты</strong>
        <p className="slide-modal__title-2">Выберите период, на который хотите разместить рекламу: от 1 дня до 1 месяца.</p>
        {renderCalendar()}
      </div>
    ),
    () => (
      <div className="sorting-modal slide-5">
        <strong className="slide-modal__title">Целевая аудитория</strong>
        <p className="slide-modal__title-2">Выберите целевую аудиторию</p>
        <div className="sorting-modal__button-group">
          <button
            className={`sorting-modal__button-2 ${audience === "none" ? "active" : ""}`}
            onClick={() => setAudience("none")}
          >
            <p className="sorting-modal__button-2__text">Универсально</p>
          </button>
          <button
            className={`sorting-modal__button-2 ${audience === "men" ? "active" : ""}`}
            onClick={() => setAudience("men")}
          >
            <p className="sorting-modal__button-2__text">Мужчины</p>
          </button>
          <button
            className={`sorting-modal__button-2 ${audience === "women" ? "active" : ""}`}
            onClick={() => setAudience("women")}
          >
            <p className="sorting-modal__button-2__text">Женщины</p>
          </button>
        </div>
      </div>
    ),
    () => (
      <div className="sorting-modal slide-6">
        <strong className="slide-modal__title">Загрузка файла</strong>
        <p className="slide-modal__title-2">Загрузите свою базу пользователей</p>
        <div className="sorting-modal__button-group">
          <label className="custom-file-upload">
            <input type="file" onChange={e => setFile(e.target.files[0])} />
            <span>Загрузка файла</span>
            <FileUploadIcon />
          </label>
        </div>
      </div>
    ),
  ];

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Функция для валидации текущего шага
  const validateCurrentStep = () => {
    switch (activeStep) {
      case 1: // Тип поста
        return true; // Всегда валидно, так как есть значение по умолчанию
      case 2: // Бюджет
        if (!budget || budget.trim() === '') {
          showAlert("Пожалуйста, укажите бюджет", "error");
          return false;
        }
        if (isNaN(budget) || parseFloat(budget) <= 0) {
          showAlert("Пожалуйста, укажите корректный бюджет (число больше 0)", "error");
          return false;
        }
        return true;
      case 3: // Даты
        if (!dateStart) {
          showAlert("Пожалуйста, выберите дату начала", "error");
          return false;
        }
        if (!dateEnd) {
          showAlert("Пожалуйста, выберите дату окончания", "error");
          return false;
        }
        return true;
      case 4: // Целевая аудитория
        return true; // Всегда валидно, так как есть значение по умолчанию
      case 5: // Загрузка файла
        return true; // Файл не обязателен
      default:
        return true;
    }
  };

  const handleNext = () => {
    // Проверяем валидацию перед переходом к следующему шагу
    if (!validateCurrentStep()) {
      return;
    }

    if (activeStep === slides.length - 1) {
      setModalOpen(false);
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleAddToCart = (item) => {
    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) {
      showAlert("Для добавления ботов в корзину необходимо войти в аккаунт", "error");
      return;
    }

    // Если у нас есть оригинальные данные API, используем их
    const cartItem = item.originalData ? {
      ...item.originalData,
      displayName: item.title,
      displayPrice: item.price
    } : item;

    const isAdded = addToCart(cartItem);
    if (isAdded) {
      showAlert("Бот добавлен в корзину!", "success");
    } else {
      showAlert("Этот бот уже добавлен в корзину!", "warning");
    }
  };

  const handleRefreshBots = async (uniqueIdToReplace) => {
    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) {
      showAlert("Для использования умного подбора необходимо войти в аккаунт", "error");
      return;
    }

    setIsLoading(true);

    const currentList = apiResults || bots;
    const botToReplace = currentList.find(b => b._uniqueId === uniqueIdToReplace);

    if (!botToReplace) {
      setIsLoading(false);
      showAlert("Не удалось найти бота для замены.", "error");
      return;
    }

    const newExcludedNumbers = [...excludedBotNumbers, botToReplace.number];
    setExcludedBotNumbers(newExcludedNumbers);

    const formData = new FormData();
    formData.append("category", category);
    formData.append("budget", budget);
    formData.append("date_start", dateStart ? Math.floor(dateStart.getTime() / 1000) : "");
    formData.append("date_end", dateEnd ? Math.floor(dateEnd.getTime() / 1000) : "");
    formData.append("men", audience === "men" ? "true" : audience === "women" ? "false" : "none");
    if (file) formData.append("file", file);

    formData.append("bots_hide", JSON.stringify(newExcludedNumbers));

    console.log("Отправляемые данные (handleRefreshBots):");
    for (let pair of formData.entries()) {
      console.log(pair[0] + ':', pair[1]);
    }

    try {
      const response = await fetch("https://flyersendtest.ru/api/bot/smart-bot/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Полученный результат (handleRefreshBots):", data);
        if (data.result && data.result.bots && data.result.bots.length > 0) {
          const newBot = addUniqueId(data.result.bots[0]);
          const listToUpdate = apiResults ? [...apiResults] : [...bots];
          const botIndex = listToUpdate.findIndex(bot => bot._uniqueId === uniqueIdToReplace);

          if (botIndex !== -1) {
            listToUpdate[botIndex] = newBot;
            if (apiResults) {
              setApiResults(listToUpdate);
            } else {
              setBots(listToUpdate);
            }
            showAlert("Бот обновлен!", "success");
          }
        } else {
          showAlert("По вашему запросу не найдено новых ботов.", "info");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Ошибка от API (handleRefreshBots):", errorData);
        showAlert(`Ошибка при обновлении: ${errorData.message || response.statusText}`, "error");
      }
    } catch (e) {
      showAlert("Ошибка сети", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateClick = (day) => {
    if (!dateStart || (dateStart && dateEnd)) {
      setDateStart(day);
      setDateEnd(null);
    } else if (dateStart && !dateEnd) {
      if (day > dateStart) {
        // Ограничение в 1 месяц
        const maxEndDate = new Date(dateStart);
        maxEndDate.setMonth(maxEndDate.getMonth() + 1);
        if (day <= maxEndDate) {
          setDateEnd(day);
        } else {
          // Если выбранная дата превышает 1 месяц, сбрасываем и начинаем заново
          setDateStart(day);
          setDateEnd(null);
        }
      } else {
        // Если вторая дата раньше первой, начинаем выбор заново
        setDateStart(day);
        setDateEnd(null);
      }
    }
  };

  const renderCalendar = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const month = calendarDate.getMonth();
    const year = calendarDate.getFullYear();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // 0 (пн) - 6 (вс)

    const prevMonthLastDay = new Date(year, month, 0).getDate();

    // Минимальная дата (48 часов вперед)
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 2);

    // Максимальная дата (30 дней от сегодня)
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30);

    const days = [];
    // Дни предыдущего месяца
    for (let i = startDayOfWeek; i > 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthLastDay - i + 1);
      days.push({ 
        day: prevMonthLastDay - i + 1, 
        isCurrentMonth: false,
        date: prevDate,
        isDisabled: prevDate < minDate || prevDate > maxDate
      });
    }
    // Дни текущего месяца
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      currentDate.setHours(0, 0, 0, 0);
      
      // Проверяем, находится ли дата в допустимом диапазоне
      const isDisabled = currentDate < minDate || currentDate > maxDate;
      
      days.push({ 
        day: i, 
        isCurrentMonth: true, 
        date: currentDate,
        isDisabled: isDisabled
      });
    }
    // Дни следующего месяца
    const remainingDays = 42 - days.length; // 6 недель * 7 дней
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ 
        day: i, 
        isCurrentMonth: false,
        date: nextDate,
        isDisabled: nextDate < minDate || nextDate > maxDate
      });
    }

    const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

    return (
      <div className="sorting-calendar">
        <div className="sorting-calendar-header">
          <button 
            className="sorting-calendar-header__button" 
            onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
          >
            <img src={ArrowLeft} alt="arrow-left" />
          </button>
          <span className="sorting-calendar-header__title">{new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <button 
            className="sorting-calendar-header__button" 
            onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
          >
            <img src={ArrowRight} alt="arrow-right" />
          </button>
        </div>
        <div className="sorting-calendar-grid">
          {weekdays.map(day => <div key={day} className="sorting-calendar-weekday">{day}</div>)}
          {days.map((d, index) => {
            let className = 'sorting-calendar-day';
            
            if (d.isDisabled) {
              className += ' sorting-calendar-day--disabled';
            }
            
            if (!d.isCurrentMonth) {
              className += ' sorting-calendar-day--other-month';
            } else {
              const currentDate = new Date(d.date);
              currentDate.setHours(0, 0, 0, 0);

              const startDate = dateStart ? new Date(dateStart) : null;
              if (startDate) startDate.setHours(0, 0, 0, 0);

              const endDate = dateEnd ? new Date(dateEnd) : null;
              if (endDate) endDate.setHours(0, 0, 0, 0);

              if (startDate && currentDate.getTime() === startDate.getTime()) {
                className += ' sorting-calendar-day--selected';
              }
              if (endDate && currentDate.getTime() === endDate.getTime()) {
                className += ' sorting-calendar-day--selected';
              }
              if (startDate && endDate && currentDate > startDate && currentDate < endDate) {
                className += ' sorting-calendar-day--in-range';
              }
            }
            return (
              <div 
                key={index} 
                className={className} 
                onClick={() => !d.isDisabled && handleDateClick(d.date)}
                style={d.isDisabled ? {color: '#aaa', cursor: 'not-allowed'} : {}}
              >
                {d.day}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleShowMore = () => {
    setVisibleItems((prevVisibleItems) => prevVisibleItems + 6);
  };

  const handleSubmit = async () => {
    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) {
      showAlert("Для использования умного подбора необходимо войти в аккаунт", "error");
      return;
    }

    // Валидация обязательных полей
    if (!budget || budget.trim() === '') {
      showAlert("Пожалуйста, укажите бюджет", "error");
      return;
    }

    if (!dateStart) {
      showAlert("Пожалуйста, выберите дату начала", "error");
      return;
    }

    if (!dateEnd) {
      showAlert("Пожалуйста, выберите дату окончания", "error");
      return;
    }

    // Проверка, что бюджет является числом
    if (isNaN(budget) || parseFloat(budget) <= 0) {
      showAlert("Пожалуйста, укажите корректный бюджет (число больше 0)", "error");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("category", category);
    formData.append("budget", budget);
    formData.append("date_start", dateStart ? Math.floor(dateStart.getTime() / 1000) : "");
    formData.append("date_end", dateEnd ? Math.floor(dateEnd.getTime() / 1000) : "");
    formData.append("men", audience === "men" ? "true" : audience === "women" ? "false" : "none");
    // Если нужно ru, раскомментируйте:
    // formData.append("ru", "true");
    if (file) formData.append("file", file);

    // Логируем итоговые данные
    for (let pair of formData.entries()) {
      console.log(pair[0] + ':', pair[1]);
    }

    try {
      const response = await fetch("https://flyersendtest.ru/api/bot/smart-bot/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("API Response:", data);

        if (data.result && data.result.bots && Array.isArray(data.result.bots)) {
          setApiResults(data.result.bots.map(addUniqueId));
          setExcludedBotNumbers([]); // Сбрасываем список исключений при новом подборе
          showAlert("Боты успешно подобраны!", "success");
        } else {
          showAlert("Неверный формат ответа от сервера", "error");
        }
        setModalOpen(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        showAlert(`Ошибка при отправке данных: ${errorData.message || response.statusText}`, "error");
      }
    } catch (e) {
      console.error("Network error:", e);
      showAlert("Ошибка сети", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      const accessToken = sessionStorage.getItem('access_token');
      if (!accessToken) {
        showAlert("Для использования умного подбора необходимо войти в аккаунт", "error");
        return;
      }
      try {
        const response = await fetch('https://flyersendtest.ru/api/bot/category/', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
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

    const fetchBots = async () => {
      const accessToken = sessionStorage.getItem('access_token');
      if (!accessToken) {
        showAlert("Для использования умного подбора необходимо войти в аккаунт", "error");
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch('https://flyersendtest.ru/api/bot/', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.result && Array.isArray(data.result)) {
            setBots(data.result.map(addUniqueId));
          }
        }
      } catch (error) {
        console.error('Ошибка при получении ботов:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
    fetchBots();
  }, []);

  const filteredItems = apiResults || bots;

  return (
    <div className="sorting-container">
      <Dialog
        open={modalOpen}
        fullWidth
        maxWidth="sm"
        className="sorting-modal__dialog"
      >
        <DialogContent className="sorting-modal__content">
          <div className="sorting-modal__close" onClick={() => { setStep(1); setActiveStep(0); setModalOpen(false); }}>
            <CloseIcon />
          </div>
          <Box py={2}>
            {slides[activeStep]()}
          </Box>

          {/* Нижняя панель с точками и кнопками */}
          {activeStep > 0 && (
            <MobileStepper
              variant="dots"
              steps={slides.length}
              position="static"
              activeStep={activeStep}
              nextButton={
                <button
                  className="modal-stepper__button-next"
                  size="small"
                  onClick={activeStep === slides.length - 1 ? handleSubmit : handleNext}
                >
                  {activeStep === slides.length - 1 ? "Готово" : "Далее"}
                </button>
              }
              backButton={
                <button
                  className="modal-stepper__button-prev"
                  size="small"
                  onClick={handleBack}
                  disabled={activeStep === 0}
                >
                  Назад
                </button>
              }
              sx={{ justifyContent: "space-between", mt: 2 }}
            />
          )}
        </DialogContent>
      </Dialog>
      {!modalOpen && (
        <div className="">
          <h2>Умный подбор</h2>
          <div className="sorting-options">
            <button
              className="sorting-options__button"
              onClick={() => {
                const accessToken = sessionStorage.getItem('access_token');
                if (!accessToken) {
                  showAlert("Для использования умного подбора необходимо войти в аккаунт", "error");
                  return;
                }
                setModalOpen(true);
                setActiveStep(1);
              }}
            >
              Подобрать бота
            </button>
          </div>
          <div className="sorting-options__description">
            <p className="sorting-options__description-text">Если вы уберёте бота — мы автоматически предложим замену</p>
          </div>

          {isLoading && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>Подбираем ботов...</p>
            </div>
          )}


          <div className="catalog-box">
            {filteredItems.slice(0, visibleItems).map((item) => (
              <div key={item.id || item.number} className="catalog-item">
                <div className="item-text__sorting">
                    <div className="item-details__sorting">   
                    {item.photo !== null ? (
                      <img src={item.photo} alt="Бот" className="item-image" />
                    ) : (
                      <img src={BotIcon} alt="Бот" className="item-image" />
                    )}
                    <div className="item-text__details">
                      <h3 className="item-title__sorting">
                        {item.name}
                        <span className="item-rating">
                          <span className="item-rating__star">★</span>{" "}
                          {item.rate_count}
                          <img
                            src={SmartLoader}
                            alt="Обновить"
                            className="item-image__loader"
                            onClick={() => handleRefreshBots(item._uniqueId)}
                            style={{ cursor: 'pointer', marginLeft: '10px' }}
                            title="Заменить этого бота на похожего"
                          />
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
                  <div className="item-stats-and-price">
                    <div className="item-stats__sorting">
                      <div className="item-stats__box">
                        <span className="item-stats__text">
                          <img src={UsersBot} alt="users-bot" />
                          <span className="item-stats__text-span">
                            {item.file?.users ?? "-"} тыс
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
                            {item.file?.chats ?? "-"} тыс
                          </span>
                        </span>
                        <span className="item-stats__text">
                          RU: <span className="item-stats__text-span">{item.data?.ru ?? "-"} </span> %
                        </span>
                        <span className="item-stats__text">
                          <img src={UsersBotActive} alt="users-bot-active" />
                          <span className="item-stats__text-span">
                            {item.file?.users_in_chats ?? "-"} тыс
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
              </div>
            ))}
          </div>
          <div>
            {visibleItems < filteredItems.length && (
              <div className="show-more">
                <button className="show-more-button" onClick={handleShowMore}>
                  Показать еще
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sorting;
