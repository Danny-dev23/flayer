import { useState, useRef, useEffect } from 'react';
import "./calendarPc.css";

const CalendarIcon = ({ onClick }) => (
  <svg
    onClick={onClick}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="calendar-icon"
    style={{ cursor: 'pointer' }}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="#407bff" strokeWidth="2" fill="none"/>
    <line x1="16" y1="2" x2="16" y2="6" stroke="#407bff" strokeWidth="2"/>
    <line x1="8" y1="2" x2="8" y2="6" stroke="#407bff" strokeWidth="2"/>
    <line x1="3" y1="10" x2="21" y2="10" stroke="#407bff" strokeWidth="2"/>
  </svg>
);

const CalendarPc = ({ 
  dateFrom, 
  dateTo, 
  onDateFromChange, 
  onDateToChange, 
  isOpen, 
  onOpenChange 
}) => {
  const [currentStep, setCurrentStep] = useState('from'); // 'from' или 'to'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = useRef(null);

  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Закрытие календаря при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Проверяем, что клик не был на элементах календаря
      const isCalendarElement = event.target.closest('.calendar-container') || 
                               event.target.closest('.calendar-popup__pc') ||
                               event.target.closest('.calendar-icon');
      
      if (!isCalendarElement && calendarRef.current && !calendarRef.current.contains(event.target)) {
        // Добавляем небольшую задержку
        setTimeout(() => {
          onOpenChange(false);
          setCurrentStep('from');
        }, 10);
      }
    };

    if (isOpen) {
      // Используем mousedown вместо click для более точного контроля
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onOpenChange]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Получаем первый день недели (понедельник = 0)
    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const days = [];
    
    // Добавляем пустые дни в начале
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Добавляем дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const handleDateClick = (date) => {
    if (currentStep === 'from') {
      onDateFromChange(date);
      setCurrentStep('to');
    } else {
      // Проверяем, что выбранная дата "до" не меньше даты "от"
      if (dateFrom && date < dateFrom) {
        // Если дата "до" меньше даты "от", меняем их местами
        onDateToChange(dateFrom);
        onDateFromChange(date);
      } else {
        onDateToChange(date);
      }
      onOpenChange(false);
      setCurrentStep('from');
    }
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const isDateSelected = (date) => {
    if (currentStep === 'from') {
      return dateFrom && date.toDateString() === dateFrom.toDateString();
    } else {
      return (dateFrom && date.toDateString() === dateFrom.toDateString()) ||
             (dateTo && date.toDateString() === dateTo.toDateString());
    }
  };

  const isDateInRange = (date) => {
    if (currentStep === 'to' && dateFrom && !dateTo) {
      return date >= dateFrom;
    }
    if (dateFrom && dateTo) {
      return date >= dateFrom && date <= dateTo;
    }
    return false;
  };

  const openCalendar = () => {
    onOpenChange(true);
    setCurrentStep('from');
    setCurrentMonth(new Date());
  };

  const clearDates = (e) => {
    e.stopPropagation();
    onDateFromChange(null);
    onDateToChange(null);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  return (
    <div className="calendar-container">
      <div className="date-display">
        <CalendarIcon onClick={openCalendar} />
        {/* <div className="date-text">
          {dateFrom && dateTo ? (
            <span>{formatDate(dateFrom)} - {formatDate(dateTo)}</span>
          ) : dateFrom ? (
            <span>{formatDate(dateFrom)} - Выберите дату "До"</span>
          ) : (
            <span>Выберите даты</span>
          )}
        </div> */}
        {(dateFrom || dateTo) && (
          <button 
            className="clear-dates-btn" 
            onClick={clearDates}
            title="Очистить даты"
          >
            ×
          </button>
        )}
      </div>

      {isOpen && (
        <div className="calendar-popup__pc" ref={calendarRef}>
          <div className="calendar-header">
            <button onClick={() => navigateMonth(-1)} className="nav-button">‹</button>
            <h3 className="month-year">
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button onClick={() => navigateMonth(1)} className="nav-button">›</button>
          </div>
          
          <div className="step-indicator">
            {currentStep === 'from' ? 'Выберите дату "От"' : 'Выберите дату "До"'}
          </div>

          <div className="calendar-grid__pc">
            <div className="weekdays">
              {weekDays.map(day => (
                <div key={day} className="weekday">{day}</div>
              ))}
            </div>
            
            <div className="days-grid">
              {getDaysInMonth(currentMonth).map((date, index) => (
                <div
                  key={index}
                  className={`day ${!date ? 'empty' : ''} ${
                    date && isDateSelected(date) ? 'selected' : ''
                  } ${date && isDateInRange(date) ? 'in-range' : ''}`}
                  onClick={() => date && handleDateClick(date)}
                >
                  {date ? date.getDate() : ''}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPc;