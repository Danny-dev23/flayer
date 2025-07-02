import { useState } from "react"
import { ChevronLeft, ChevronRight, Calendar, ChevronUp, ChevronDown } from "lucide-react"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import "./customCalendar.css"

const MONTHS = [
  "Январь",
  "Февраль", 
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
]

const DAYS_OF_WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

export default function CustomCalendar({ onDateRangeChange, onSave }) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [isOpen, setIsOpen] = useState(false)
  const [selectionStep, setSelectionStep] = useState("start")

  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)

  const [tempTime, setTempTime] = useState({ hour: 12, minute: 0 })

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month, year) => {
    const firstDay = new Date(year, month, 1).getDay()
    return firstDay === 0 ? 6 : firstDay - 1 // Convert Sunday (0) to be last (6)
  }

  const isPastDay = (year, month, day) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const checkDate = new Date(year, month, day)
    checkDate.setHours(0, 0, 0, 0)

    return checkDate < today
  }

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const days = []

    // Previous month days
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const daysInPrevMonth = getDaysInMonth(prevMonth, prevYear)

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        isPrevMonth: true,
        isPast: isPastDay(prevYear, prevMonth, daysInPrevMonth - i),
      })
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        isPrevMonth: false,
        isPast: isPastDay(currentYear, currentMonth, day),
      })
    }

    // Next month days
    const totalCells = Math.ceil(days.length / 7) * 7
    const remainingCells = totalCells - days.length
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear

    for (let day = 1; day <= remainingCells; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        isPrevMonth: false,
        isPast: isPastDay(nextYear, nextMonth, day),
      })
    }

    return days
  }

  const handleDateSelect = (day) => {
    const selectedDateTime = {
      year: currentYear,
      month: currentMonth,
      day,
      hour: tempTime.hour,
      minute: tempTime.minute,
    }

    if (selectionStep === "start") {
      setStartDate(selectedDateTime)
      setSelectionStep("end")
    } else {
      setEndDate(selectedDateTime)
      setSelectionStep("start")

      // Convert to Unix timestamp and log
      const startTimestamp = dateTimeToUnixTimestamp(startDate)
      const endTimestamp = dateTimeToUnixTimestamp(selectedDateTime)

      console.log("=== CustomCalendar handleDateSelect ===")
      console.log("startDate object:", startDate)
      console.log("endDate object:", selectedDateTime)
      console.log("start timestamp:", startTimestamp)
      console.log("end timestamp:", endTimestamp)

      // Передаем данные в родительский компонент
      if (onDateRangeChange) {
        console.log("Вызываем onDateRangeChange с:", startTimestamp, endTimestamp)
        onDateRangeChange(startTimestamp, endTimestamp)
      }
    }
  }

  const dateTimeToUnixTimestamp = (dateTime) => {
    const date = new Date(dateTime.year, dateTime.month, dateTime.day, dateTime.hour, dateTime.minute)
    return Math.floor(date.getTime() / 1000)
  }

  const isDateSelected = (day) => {
    if (startDate && startDate.year === currentYear && startDate.month === currentMonth && startDate.day === day) {
      return "start"
    }
    if (endDate && endDate.year === currentYear && endDate.month === currentMonth && endDate.day === day) {
      return "end"
    }
    return false
  }

  const adjustTime = (type, direction) => {
    setTempTime((prev) => {
      if (type === "hour") {
        const newHour = direction === "up" ? (prev.hour + 1) % 24 : prev.hour === 0 ? 23 : prev.hour - 1
        return { ...prev, hour: newHour }
      } else {
        const newMinute = direction === "up" ? (prev.minute + 1) % 60 : prev.minute === 0 ? 59 : prev.minute - 1
        return { ...prev, minute: newMinute }
      }
    })
  }

  const navigateMonth = (direction) => {
    const today = new Date()
    const currentMonthNow = today.getMonth()
    const currentYearNow = today.getFullYear()

    if (direction === "prev") {
      // Проверяем, не пытаемся ли мы перейти к прошлому месяцу от текущего
      if (currentYear < currentYearNow || (currentYear === currentYearNow && currentMonth <= currentMonthNow)) {
        return // Не позволяем перейти к прошлому месяцу
      }

      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear((prev) => prev - 1)
      } else {
        setCurrentMonth((prev) => prev - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear((prev) => prev + 1)
      } else {
        setCurrentMonth((prev) => prev + 1)
      }
    }
  }

  const resetSelection = () => {
    setStartDate(null)
    setEndDate(null)
    setSelectionStep("start")
  }

  const handleSave = async () => {
    if (!startDate || !endDate) return;
    const startTimestamp = dateTimeToUnixTimestamp(startDate);
    const endTimestamp = dateTimeToUnixTimestamp(endDate);
    if (onSave) {
      await onSave(startTimestamp, endTimestamp);
    }
    setIsOpen(false);
    resetSelection();
  };

  return (
    <div className="custom-calendar">
      <Button
        variant="outline"
        className="custom-calendar__trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="custom-calendar__trigger-text">
          {startDate && endDate
            ? `${startDate.day}.${startDate.month + 1}.${startDate.year} - ${endDate.day}.${endDate.month + 1}.${endDate.year}`
            : startDate
              ? `От: ${startDate.day}.${startDate.month + 1}.${startDate.year} (выберите конечную дату)`
              : "Выбрать закрытые даты"}
        </span>
        <Calendar className="h-4 w-4" />
      </Button>

      {isOpen && (
        <Card className="custom-calendar__dropdown">
          <CardContent className="custom-calendar__content">
            {/* Time Selector */}
            <div className="custom-calendar__time-selector">
              <div className="custom-calendar__time-controls">
                <div className="custom-calendar__time-group">
                  <Button variant="ghost" size="sm" onClick={() => adjustTime("hour", "up")} className="custom-calendar__time-btn">
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <span className="custom-calendar__time-display">{tempTime.hour.toString().padStart(2, "0")}</span>
                  <Button variant="ghost" size="sm" onClick={() => adjustTime("hour", "down")} className="custom-calendar__time-btn">
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>

                <span className="custom-calendar__time-separator">:</span>

                <div className="custom-calendar__time-group">
                  <Button variant="ghost" size="sm" onClick={() => adjustTime("minute", "up")} className="custom-calendar__time-btn" disabled>
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <span className="custom-calendar__time-display">
                    {tempTime.minute.toString().padStart(2, "0")}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => adjustTime("minute", "down")}
                    className="custom-calendar__time-btn"
                    disabled
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Month Navigation */}
            <div className="custom-calendar__navigation">
              <Button variant="ghost" size="sm" onClick={() => navigateMonth("prev")} className="custom-calendar__nav-btn">
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <h3 className="custom-calendar__month-title">
                {MONTHS[currentMonth]} {currentYear}
              </h3>

              <Button variant="ghost" size="sm" onClick={() => navigateMonth("next")} className="custom-calendar__nav-btn">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Selection Status */}
            <div className="custom-calendar__selection-status">
              {selectionStep === "start" ? "Выберите начальную дату" : "Выберите конечную дату"}
            </div>

            {/* Days of Week */}
            <div className="custom-calendar__weekdays">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="custom-calendar__weekday">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="custom-calendar__grid">
              {generateCalendarDays().map((dayObj, index) => {
                const isSelected = dayObj.isCurrentMonth && isDateSelected(dayObj.day)
                const isClickable = dayObj.isCurrentMonth && !dayObj.isPast

                let dayBtnClass = "custom-calendar__day-btn"
                
                if (!dayObj.isCurrentMonth) {
                  dayBtnClass += " custom-calendar__day-btn--other-month"
                } else if (dayObj.isPast) {
                  dayBtnClass += " custom-calendar__day-btn--past"
                } else {
                  dayBtnClass += " custom-calendar__day-btn--current"
                }

                if (isSelected === "start") {
                  dayBtnClass += " custom-calendar__day-btn--selected-start"
                } else if (isSelected === "end") {
                  dayBtnClass += " custom-calendar__day-btn--selected-end"
                }

                if (!isClickable) {
                  dayBtnClass += " custom-calendar__day-btn--disabled"
                }

                return (
                  <Button
                    key={index}
                    variant="ghost"
                    className={dayBtnClass}
                    onClick={() => isClickable && handleDateSelect(dayObj.day)}
                    disabled={!isClickable}
                  >
                    {dayObj.day}
                  </Button>
                )
              })}
            </div>

            {/* Action Buttons */}
            <div className="custom-calendar__actions">
              <Button variant="outline" size="sm" onClick={handleSave} className="custom-calendar__action-btn" disabled={!startDate || !endDate}>
                Сохранить
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)} className="custom-calendar__action-btn">
                Закрыть
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      {/* {(startDate || endDate) && (
        <div className="custom-calendar__debug">
          <div className="custom-calendar__debug-title">Выбранные даты:</div>
          {startDate && (
            <div className="custom-calendar__debug-item">
              Начало: {startDate.day}.{startDate.month + 1}.{startDate.year} {startDate.hour}:
              {startDate.minute.toString().padStart(2, "0")}
            </div>
          )}
          {endDate && (
            <div className="custom-calendar__debug-item">
              Конец: {endDate.day}.{endDate.month + 1}.{endDate.year} {endDate.hour}:
              {endDate.minute.toString().padStart(2, "0")}
            </div>
          )}
          {startDate && endDate && (
            <div className="custom-calendar__debug-timestamp">
              <div>Start timestamp: {dateTimeToUnixTimestamp(startDate)}</div>
              <div>End timestamp: {dateTimeToUnixTimestamp(endDate)}</div>
            </div>
          )}
        </div>
      )} */}
    </div>
  )
}
