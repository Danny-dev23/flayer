import React, { useEffect, useState, useRef, useContext } from "react";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Switch from '@mui/material/Switch';
import BotIcon from "../../assents/images/bot.png";
import UsersBot from "../../assents/images/users-bot.png";
import ChatsBot from "../../assents/images/chats-bot.png";
import UsersInChatsBot from "../../assents/images/users-bot-active.png";
import CloseBotIcon from "../../assents/images/Close_bot.png";
import DeleteIcons from "../../assents/images/delete.png";
import Edit from "../../assents/images/edit.png";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import CustomCalendarProps from "./CustomCalendarProps";
import { formatDate, formatShortDateTime } from "./utils";
import { AlertContext } from "../../utilits/AlertContext/AlertContext";
import "./mybots.css";

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

const MyBotsMobile = () => {
  const { showAlert } = useContext(AlertContext);
  const token = sessionStorage.getItem('access_token');
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editBotId, setEditBotId] = useState(null);
  const [editToken, setEditToken] = useState("");
  const [deleteBotNumber, setDeleteBotNumber] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState({});
  const [bookings, setBookings] = useState({});
  const fileInputRefs = useRef({});
  const [editUSDTId, setEditUSDTId] = useState(null);
  const [usdtValue, setUsdtValue] = useState(0);
  const [blockRanges, setBlockRanges] = useState({});
  const [blockings, setBlockings] = useState({});
  const usdtInputRef = useRef(null);
  const [purchases, setPurchases] = useState({});
  const [showPurchases, setShowPurchases] = useState(null);
  const [selectedPurchaseDate, setSelectedPurchaseDate] = useState({});
  const [loadingBlockings, setLoadingBlockings] = useState({});
  const [showAllDates, setShowAllDates] = useState({});

  const [dateRange, setDateRange] = useState({
    start: null,
    end: null,
  });

  const handleDateRangeChange = (startTimestamp, endTimestamp) => {
    setDateRange({
      start: startTimestamp,
      end: endTimestamp,
    });

    console.log("Получены данные в родительском компоненте:");
    console.log("Start:", startTimestamp);
    console.log("End:", endTimestamp);
  };

  const handleDateRangeChangeForBot = (botNumber, startTimestamp, endTimestamp) => {
    console.log('=== handleDateRangeChangeForBot ===');
    console.log('botNumber:', botNumber);
    console.log('startTimestamp:', startTimestamp);
    console.log('endTimestamp:', endTimestamp);
    console.log('startTimestamp type:', typeof startTimestamp);
    console.log('endTimestamp type:', typeof endTimestamp);
    
    // Конвертируем timestamps в Date объекты для handleBlockDates
    const startDate = new Date(startTimestamp * 1000);
    const endDate = new Date(endTimestamp * 1000);
    
    console.log('startDate:', startDate);
    console.log('endDate:', endDate);
    
    setBlockRanges(prev => {
      const newRanges = {
        ...prev,
        [botNumber]: [startDate, endDate]
      };
      console.log('Updated blockRanges:', newRanges);
      return newRanges;
    });
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString("ru-RU");
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month}`;
  };

  // Функция для преобразования номеров категорий в названия
  const getCategoryNames = (categoryNumbers) => {
    if (!categoryNumbers || !categories) return '';
    
    // Если categoryNumbers это строка, разбиваем её на массив
    const numbers = typeof categoryNumbers === 'string' 
      ? categoryNumbers.split(',').map(num => num.trim())
      : Array.isArray(categoryNumbers) 
        ? categoryNumbers 
        : [categoryNumbers];
    
    const categoryNames = numbers
      .map(num => {
        const category = categories[num];
        return category ? category.name : null;
      })
      .filter(name => name !== null);
    
    return categoryNames.length > 0 ? categoryNames.join(', ') : '';
  };

  const fetchPurchases = async (botNumber) => {
    if (!token) return;

    try {
      const response = await fetch(`https://flyersendtest.ru/api/bot/purchases/?number=${botNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPurchases(prev => ({ ...prev, [botNumber]: data.result || [] }));
        setShowPurchases(botNumber);
        console.log(data.result);
      } else {
        console.error('Ошибка при получении покупок:', response.status);
        showAlert('Ошибка при получении истории покупок', 'error');
      }
    } catch (error) {
      console.error('Ошибка сети при получении покупок:', error);
      showAlert('Ошибка сети при получении истории покупок', 'error');
    }
  };

  const fetchBots = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    console.log('🔍 Запрашиваем список ботов...');
    
    try {
      const response = await fetch('https://flyersendtest.ru/api/user/bots/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Ответ API ботов:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Данные ботов от API:', data);
        
        if (data.result && data.result.length > 0) {
          console.log('Детали первого бота:', {
            number: data.result[0].number,
            name: data.result[0].name,
            status: data.result[0].status,
            statusType: typeof data.result[0].status
          });
        }
        
        setBots(data.result || []);
      } else {
        console.error('❌ Ошибка при получении ботов:', response.status);
      }
    } catch (error) {
      console.error('❌ Ошибка при получении ботов:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
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

  useEffect(() => {
    if (!token) return;
    bots.forEach(bot => {
      if (!bookings[bot.number]) {
        fetch(`https://flyersendtest.ru/api/bot/bookings/?number=${bot.number}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
          .then(res => res.json())
          .then(data => {
            setBookings(prev => ({ ...prev, [bot.number]: data.result }));
          })
          .catch(e => console.error('Ошибка при получении бронирований:', e));
      }
    });
  }, [bots, token]);

  useEffect(() => {
    bots.forEach(bot => {
      if (bot.number && !purchases[bot.number]) {
        fetchPurchases(bot.number);
      }
    });
    // eslint-disable-next-line
  }, [bots]);

  const handleUSDTEdit = (bot) => {
    console.log('Редактирование USDT для бота:', bot.number);
    setEditUSDTId(bot.number);
    setUsdtValue(bot.prices?.[1] || 0);
  };

  const handleUSDTChange = (e) => {
    const value = e.target.value;
    // Разрешаем только числа и точку
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setUsdtValue(value);
    }
  };

  const handleUSDTBlur = async (bot) => {
    if (!token) return;
    
    console.log('Отправляем запрос на обновление USDT:', {
      number: bot.number,
      price: parseFloat(usdtValue) || 0,
      price_category: 1
    });

    try {
      const response = await fetch('https://flyersendtest.ru/api/user/bot/edit/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          number: bot.number,
          price: parseFloat(usdtValue) || 0,
          price_category: 1
        })
      });
      
      console.log('Ответ сервера:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('USDT успешно обновлен:', result);
        // Обновляем список ботов
        await fetchBots();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Ошибка при обновлении USDT:', response.status, errorData);
        showAlert(`Ошибка при обновлении цены USDT: ${errorData.detail || response.statusText}`, 'error');
      }
    } catch (error) {
      console.error('Ошибка сети при обновлении USDT:', error);
      showAlert('Ошибка сети при обновлении цены USDT', 'error');
    }
    
    setEditUSDTId(null);
  };

  const handleUSDTKeyDown = (e, bot) => {
    if (e.key === 'Enter') {
      handleUSDTBlur(bot);
    }
  };

  const handleEditClick = (bot) => {
    setEditBotId(bot.number);
    setEditToken(bot.token || "");
    fetchBlockings(bot.number);
  };

  const handleSave = async () => {
    if (editBotId && blockRanges[editBotId]) {
      const bot = bots.find(b => b.number === editBotId);
      if (bot) {
        await handleBlockDates(bot, blockRanges[editBotId]);
      }
    }
    setEditBotId(null);
    setEditToken("");
    setBlockRanges(prev => {
      const newRanges = { ...prev };
      delete newRanges[editBotId];
      return newRanges;
    });
  };

  const handleCancel = () => {
    setEditBotId(null);
    setEditToken("");
    setBlockRanges(prev => {
      const newRanges = { ...prev };
      delete newRanges[editBotId];
      return newRanges;
    });
  };

  const handleDelete = (number) => {
    setDeleteBotNumber(number);
  };

  const handleConfirmDelete = async () => {
    if (!deleteBotNumber) return;
    setDeleting(true);
    const accessToken = sessionStorage.getItem('access_token');

    if (!accessToken) {
      showAlert('Ошибка: токен доступа не найден', 'error');
      setDeleting(false);
      return;
    }

    console.log('Начинаем удаление бота:', deleteBotNumber);

    try {
      const response = await fetch('https://flyersendtest.ru/api/user/bot/delete/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ number: deleteBotNumber })
      });

      console.log('Ответ сервера при удалении:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('Бот успешно удален:', result);
        setDeleteBotNumber(null);
        await fetchBots();
        showAlert('Бот успешно удален', 'success');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Ошибка при удалении бота:', response.status, errorData);
        showAlert(`Ошибка при удалении бота: ${errorData.detail || response.statusText}`, 'error');
      }
    } catch (error) {
      console.error('Ошибка сети при удалении бота:', error);
      showAlert('Ошибка сети при удалении бота', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteBotNumber(null);
  };

  const handleToggleStatus = async (bot) => {
    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) return;

    console.log('=== handleToggleStatus Debug ===');
    console.log('Bot status before toggle:', bot.status);
    console.log('Bot number:', bot.number);
    console.log('Bot name:', bot.name);
    console.log('Bot prices:', bot.prices);
    console.log('Bot USDT price:', bot.prices?.[1]);

    // Если пытаемся активировать бота (статус меняется с false на true)
    if (!bot.status) {
      console.log('Попытка активации бота - проверяем цену USDT...');
      
      // Проверяем цену бота (USDT)
      const botPrice = bot.prices?.[1] || 0;
      
      console.log('Цена бота (USDT):', botPrice);
      
      // Проверяем, что цена больше 0
      if (botPrice <= 0) {
        console.log('❌ Цена бота равна 0 - нужно добавить сумму');
        showAlert('Для активации бота необходимо добавить цену USDT. Установите цену в поле USDT.', 'error');
        return;
      }
      
      console.log('✅ Цена бота достаточна для активации');
    } else {
      console.log('Деактивация бота - проверка цены не требуется');
    }

    try {
      console.log('Отправляем запрос на изменение статуса бота...');
      const response = await fetch('https://flyersendtest.ru/api/user/bot/edit/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          number: bot.number,
          status: !bot.status,
        })
      });
      
      console.log('Ответ сервера:', response.status, response.statusText);
      
      if (response.ok) {
        console.log('Статус бота успешно изменен');
        await fetchBots();
        if (!bot.status) {
          showAlert('Бот успешно активирован!', 'success');
        } else {
          showAlert('Бот деактивирован', 'success');
        }
      } else {
        const result = await response.json();
        console.error('Ошибка сервера:', result);
        showAlert('Ошибка при изменении статуса: ' + (result?.detail || response.status), 'error');
      }
    } catch (error) {
      console.error('Ошибка при изменении статуса:', error);
      showAlert('Ошибка при изменении статуса', 'error');
    }
  };

  const handleFileUpload = async (e, bot) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Проверяем, что bot.number существует
    if (!bot || !bot.number) {
      console.error('Ошибка: bot.number не определен:', bot);
      showAlert('Ошибка: номер бота не найден', 'error');
      return;
    }
    
    const accessToken = sessionStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('number', bot.number);
    
    console.log('=== handleFileUpload Debug (Mobile) ===');
    console.log('Full bot object:', bot);
    console.log('bot.number:', bot.number);
    console.log('bot.bot_id:', bot.bot_id);
    console.log('bot.name:', bot.name);
    
    try {
      const response = await fetch('https://flyersendtest.ru/api/user/bot/edit/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });
      if (response.ok) {
        showAlert('Файл успешно загружен!', 'success');
        await fetchBots();
      } else {
        showAlert('Ошибка при загрузке файла', 'error');
      }
    } catch (error) {
      showAlert('Ошибка при загрузке файла', 'error');
    }
  };

  const fetchBlockings = async (number) => {
    console.log('Начинаем загрузку заблокированных дат для бота:', number);
    setLoadingBlockings(prev => ({ ...prev, [number]: true }));
    
    if (!token) return;
    try {
      const response = await fetch(`https://flyersendtest.ru/api/bot/bookings/?number=${number}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Загружены заблокированные даты для бота', number, ':', data.result);
        // Обновляем состояние bookings, которое используется в интерфейсе
        setBookings(prev => ({ ...prev, [number]: data.result || [] }));
        // Также обновляем blockings для совместимости
        setBlockings(prev => ({ ...prev, [number]: data.result || [] }));
      }
    } catch (e) {
      console.error('Ошибка при получении блокировок:', e);
    } finally {
      setLoadingBlockings(prev => ({ ...prev, [number]: false }));
    }
  };

  const handleBlockDates = async (bot, range) => {
    console.log('=== handleBlockDates ===');
    console.log('bot:', bot);
    console.log('range:', range);
    console.log('range type:', typeof range);
    console.log('range length:', range ? range.length : 'null');
    
    if (!range || !Array.isArray(range) || range.length !== 2) {
      console.error('Invalid range format:', range);
      showAlert('Ошибка: неверный формат диапазона дат', 'error');
      return;
    }
    
    const [start, end] = range;
    console.log('start:', start);
    console.log('end:', end);
    console.log('start type:', typeof start);
    console.log('end type:', typeof end);
    
    if (!(start instanceof Date) || !(end instanceof Date)) {
      console.error('Invalid date objects:', { start, end });
      showAlert('Ошибка: неверные объекты дат', 'error');
      return;
    }
    
    const startDate = new Date(start);
    startDate.setMinutes(0, 0, 0);
    const endDate = new Date(end);
    endDate.setMinutes(0, 0, 0);
    
    console.log('Processed startDate:', startDate);
    console.log('Processed endDate:', endDate);
    console.log('startDate timestamp:', Math.floor(startDate.getTime() / 1000));
    console.log('endDate timestamp:', Math.floor(endDate.getTime() / 1000));

    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) {
      showAlert('Ошибка: токен доступа не найден', 'error');
      return;
    }

    const body = {
      number: bot.number,
      block: true,
      date_start: Math.floor(startDate.getTime() / 1000),
      date_end: Math.floor(endDate.getTime() / 1000)
    };

    console.log('Request body:', body);
    console.log('Request URL:', 'https://flyersendtest.ru/api/bot/bookings/edit/');

    try {
      const response = await fetch('https://flyersendtest.ru/api/bot/bookings/edit/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      console.log('Response status:', response.status);
      console.log('Response statusText:', response.statusText);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Response data:', responseData);
        console.log('Блокировка успешно создана');
        // Добавляем небольшую задержку перед обновлением данных
        setTimeout(() => {
          fetchBlockings(bot.number);
        }, 500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Ошибка при создании блокировки:', response.status, errorData);
        showAlert(`Ошибка при создании блокировки: ${errorData.detail || response.statusText}`, 'error');
      }
    } catch (e) {
      console.error('Ошибка сети при создании блокировки:', e);
      showAlert('Ошибка сети при создании блокировки', 'error');
    }
  };

  const handleRemoveBlockDate = async (bot, start, end) => {
    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) {
      showAlert('Ошибка: токен доступа не найден', 'error');
      return;
    }

    console.log('Удаляем блокировку для бота:', bot.number, 'с датами:', start, end);
    console.log('Тип start:', typeof start, 'значение:', start);
    console.log('Тип end:', typeof end, 'значение:', end);

    // Проверяем, что bot.number существует
    if (!bot.number) {
      console.error('bot.number не определен:', bot);
      showAlert('Ошибка: номер бота не найден', 'error');
      return;
    }

    // Проверяем, что start и end существуют
    if (start === undefined || start === null || end === undefined || end === null) {
      console.error('start или end не определены:', { start, end });
      showAlert('Ошибка: даты не найдены', 'error');
      return;
    }

    const requestBody = {
      number: bot.number,
      block: false,
      date_start: start,
      date_end: end,
    };

    console.log('Отправляем запрос с телом:', requestBody);

    try {
      const response = await fetch('https://flyersendtest.ru/api/bot/bookings/edit/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Ответ сервера при удалении блокировки:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('Блокировка удалена успешно:', result);
        // Обновляем данные асинхронно вместо локального обновления
        await fetchBlockings(bot.number);
        showAlert('Блокировка успешно удалена', 'success');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Ошибка при удалении блокировки:', response.status, errorData);
        showAlert(`Ошибка при удалении блокировки: ${errorData.detail || errorData.error || response.statusText}`, 'error');
      }
    } catch (error) {
      console.error('Ошибка сети при удалении блокировки:', error);
      showAlert('Ошибка сети при удалении блокировки', 'error');
    }
  };

  const handleApprovePurchase = async (purchaseNumber) => {
    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) {
      showAlert('Ошибка: токен доступа не найден', 'error');
      return;
    }
    
    try {
      const response = await fetch('https://flyersendtest.ru/api/bot/purchase/approve/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          number: purchaseNumber
        })
      });

      if (response.ok) {
        console.log('Покупка подтверждена успешно');
        showAlert('Покупка подтверждена', 'success');
        // Обновляем данные покупок
        const botNumber = Object.keys(purchases).find(key => 
          purchases[key].some(p => p.number === purchaseNumber)
        );
        if (botNumber) {
          fetchPurchases(botNumber);
        }
      } else {
        console.error('Ошибка при подтверждении покупки:', response.status);
        showAlert('Ошибка при подтверждении покупки', 'error');
      }
    } catch (error) {
      console.error('Ошибка сети при подтверждении покупки:', error);
      showAlert('Ошибка сети при подтверждении покупки', 'error');
    }
  };

  const handleCancelPurchase = async (purchaseNumber) => {
    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) {
      showAlert('Ошибка: токен доступа не найден', 'error');
      return;
    }
    
    try {
      const response = await fetch('https://flyersendtest.ru/api/bot/purchase/cancel/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          number: purchaseNumber
        })
      });

      if (response.ok) {
        console.log('Покупка отменена успешно');
        showAlert('Покупка отменена', 'success');
        // Обновляем данные покупок
        const botNumber = Object.keys(purchases).find(key => 
          purchases[key].some(p => p.number === purchaseNumber)
        );
        if (botNumber) {
          fetchPurchases(botNumber);
        }
      } else {
        console.error('Ошибка при отмене покупки:', response.status);
        showAlert('Ошибка при отмене покупки', 'error');
      }
    } catch (error) {
      console.error('Ошибка сети при отмене покупки:', error);
      showAlert('Ошибка сети при отмене покупки', 'error');
    }
  };

  const handleSaveBlockDates = async (botNumber, start, end) => {
    const bot = bots.find(b => b.number === botNumber);
    if (bot) {
      await handleBlockDates(bot, [new Date(start * 1000), new Date(end * 1000)]);
    }
  };

  // Глобальная функция для тестирования цены бота (доступна в консоли браузера)
  useEffect(() => {
    window.testBotPrice = (botIndex = 0) => {
      console.log('🧪 Тестирование цены бота...');
      if (bots.length === 0) {
        console.log('❌ Нет ботов для тестирования');
        return null;
      }
      
      const bot = bots[botIndex];
      const botPrice = bot.prices?.[1] || 0;
      
      console.log('Результат тестирования цены бота:', {
        botName: bot.name,
        botNumber: bot.number,
        botPrices: bot.prices,
        botPrice: botPrice,
        canActivateBot: botPrice > 0
      });
      
      return { bot, botPrice, canActivateBot: botPrice > 0 };
    };
    
    window.testBots = () => {
      console.log('🧪 Текущие боты:', bots);
      return bots;
    };
  }, [bots]);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (bots.length === 0) {
    return <div className="my-bots__empty mobile-version">У вас пока нет ботов (Добавьте бота, чтобы увидеть его здесь)</div>;
  }

  return (
    <div className="my-bots__mobile">
      {bots.map((bot) => (
        <div className="my-bots__item" key={bot.bot_id}>
          <div className="my-bots__item-title">
            <div className="my-bots__item-head">
              <div className="my-bots__item__head-text">
                <div className="my-bots__item__head-image">
                  {bot.photo !== null ? (
                    <img src={bot.photo} alt="Бот" />
                  ) : (
                    <img src={BotIcon} alt="Бот" />
                  )}
                </div>
                <div className="my-bots__item-title-text">
                  <p className="my-bots__item-title-text-name">
                    {bot.name} <br /> {bot.status ? <span className="my-bots__item-title-text-active-pc">Активный</span> : <span className="my-bots__item-title-text-not-active-pc">Неактивный</span>}
                  </p>
                  {getCategoryNames(bot.categories) && (
                    <p className="my-bots__item-title-text-category">
                      {getCategoryNames(bot.categories)}
                    </p>
                  )}
                </div>
              </div>
              <div className="my-bots__item-title-user">
                <div className="my-bots__item-title-actions">
                  <Switch
                    checked={!!bot.status}
                    onChange={() => handleToggleStatus(bot)}
                    color="primary"
                  />
                  <button
                    className="my-bots__edit-btn"
                    onClick={() => handleEditClick(bot)}
                    title="Редактировать токен"
                  >
                    <img src={Edit} alt="edit" />
                  </button>
                  <button
                    className="my-bots__delete-btn"
                    onClick={() => handleDelete(bot.number)}
                    title="Удалить бота"
                  >
                    <img src={DeleteIcons} alt="delete" />
                  </button>
                </div>
              </div>
            </div>

            {/* Показываем информацию только когда НЕ в режиме редактирования */}
            {editBotId !== bot.number && (
              <>
                <div className="my-bots-active__btn">
                  <p className="my-bots__item-title-user-text" style={{ display: 'flex', alignItems: 'center' }}>
                    USDT:
                    {editUSDTId === bot.number ? (
                      <input
                        type="number"
                        className="my-bots__item-title-user-input"
                        value={usdtValue}
                        onChange={handleUSDTChange}
                        onBlur={() => handleUSDTBlur(bot)}
                        onKeyDown={e => handleUSDTKeyDown(e, bot)}
                        autoFocus
                        style={{
                          border: "1px solid #606060",
                          borderRadius: "5px",
                          fontSize: "14px",
                          color: "#456EFD",
                          height: "20px",
                          width: "80px",
                          outline: "none",
                          marginLeft: "10px",
                          padding: "8px 10px",
                          textAlign: "left"
                        }}
                        ref={usdtInputRef}
                      />
                    ) : (
                      <span
                        className="my-bots__item-title-user-text-number"
                        style={{
                          color: "#456EFD",
                          fontSize: "28px",
                          marginLeft: "10px",
                          marginRight: "10px"
                        }}
                      >
                        {bot.prices?.[1] || 0}
                      </span>
                    )}
                    <button
                      className="my-bots__item-title-user-edit-btn"
                      onClick={() => handleUSDTEdit(bot)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        marginLeft: "4px"
                      }}
                      tabIndex={-1}
                    >
                      <EditIcon style={{ width: 20, height: 20, color: "#606060" }} />
                    </button>
                  </p>
                  <div className="my-bots-active__btn-text">
                    <p className="my-bots__item-title-user-text">
                      <img src={UsersBot} alt="" /> <span className="my-bots__item-title-user-text-number">{bot.file && typeof bot.file.users !== '0' ? bot.file.users : 0}</span> тыс
                    </p>
                    <p className="my-bots__item-title-user-text">
                      <img src={ChatsBot} alt="" />  <span className="my-bots__item-title-user-text-number">{bot.file && typeof bot.file.chats !== '0' ? bot.file.chats : 0}</span> тыс
                    </p>
                    <p className="my-bots__item-title-user-text">
                      <img src={UsersInChatsBot} alt="" />  <span className="my-bots__item-title-user-text-number">{bot.file && typeof bot.file.users_in_chats !== '0' ? bot.file.users_in_chats : 0}</span> тыс
                    </p>
                  </div>
                  <div className="my-bots__item-title-actions">
                    <input
                      type="file"
                      style={{ display: 'none' }}
                      ref={el => fileInputRefs.current[bot.number] = el}
                      onChange={e => handleFileUpload(e, bot)}
                      accept=".txt,.csv,.xlsx,.xls,.json"
                    />
                    <button
                      className="my-bots__upload-btn"
                      onClick={() => fileInputRefs.current[bot.number].click()}
                    >
                      Обновить базу
                    </button>
                  </div>
                </div>

                <div className="my-bots__close">
                  <div className="my-bots__bookings-head">
                    {loadingBlockings[bot.number] ? (
                      <div style={{ 
                        padding: '10px', 
                        textAlign: 'center', 
                        color: '#666',
                        fontSize: '14px'
                      }}>
                        Загрузка заблокированных дат...
                      </div>
                    ) : bookings[bot.number] && bookings[bot.number].length > 0 ? (
                      <div className="my-bots__bookings-head">
                        <CustomCalendarProps
                          onSave={async (start, end) => await handleSaveBlockDates(bot.number, start, end)}
                        />
                        <p className="my-bots__bookings-close-text">Закрытые даты:</p>
                        <div className="my-bots__bookings-close">
                          {bookings[bot.number].slice(0, showAllDates[bot.number] ? undefined : 3).map((b, idx) => (
                            <div key={idx} className="my-bots__bookings-close__slot" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {formatShortDateTime(b.start)} - {formatShortDateTime(b.end)}
                              <button
                                className="my-bots__bookings-close__remove"
                                onClick={async () => await handleRemoveBlockDate(bot, b.start, b.end)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#d00',
                                  fontSize: 18,
                                  cursor: 'pointer',
                                  marginLeft: 4
                                }}
                                title="Удалить блокировку"
                              >
                                <img src={CloseBotIcon} alt="" />
                              </button>
                            </div>
                          ))}
                          {bookings[bot.number]?.length > 3 && (
                            <button
                              onClick={() => setShowAllDates(prev => ({ ...prev, [bot.number]: !prev[bot.number] }))}
                              className="my-bots__bookings-close__show-all"
                            >
                              {showAllDates[bot.number] ? (
                                <>Скрыть ∧</>
                              ) : (
                                <>Показать все ∨</>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <CustomCalendarProps
                          onSave={async (start, end) => await handleSaveBlockDates(bot.number, start, end)}
                        />
                        <p>Нет заблокированных дат</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Показываем форму редактирования только когда в режиме редактирования */}
            {editBotId === bot.number && (
              <div className="my-bots__edit-form">
                <div className="my-bots__edit-form__redact">
                  <div className="my-bots__edit-form-title">Редактировать токен бота:</div>
                  <div className="my-bots__edit-form-desc">
                    <p className="my-bots__edit-form-desc-text">Токен бота</p>
                    <input
                      type="text" 
                      value={editToken === true ? '' : editToken}
                      onChange={e => setEditToken(e.target.value)}
                      className="my-bots__edit-input-pc"
                      placeholder="1234asdfghjka1234asdfghjk"
                    />
                  </div>
                  <div className="my-bots__edit-actions">
                    <button
                      className="my-bots__save-btn"
                      onClick={handleSave}
                      disabled={!blockRanges[bot.number] || !blockRanges[bot.number][0] || !blockRanges[bot.number][1]}
                    >
                      Сохранить изменения
                    </button>
                    <button className="my-bots__cancel-btn" onClick={handleCancel}>
                      Отменить
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {deleteBotNumber === bot.number && (
            <div className="my-bots__modal-inline">
              <div className="my-bots__modal-header">
                <span className="my-bots__modal-title">Удаление бота</span>
                <button className="my-bots__modal-close" onClick={handleCancelDelete}>&times;</button>
              </div>
              <div className="my-bots__modal-body">
                <div>Удалить выбранный бот?</div>
                <div style={{ color: '#888', fontSize: '0.95em', marginTop: 4 }}>Отменить действие будет невозможно.</div>
              </div>
              <div className="my-bots__modal-actions">
                <button className="my-bots__save-btn" onClick={handleConfirmDelete} disabled={deleting}>
                  Удалить
                </button>
                <button className="my-bots__cancel-btn" onClick={handleCancelDelete} disabled={deleting}>
                  Оставить
                </button>
              </div>
            </div>
          )}

          {/* Показываем информацию о заказах только когда НЕ в режиме редактирования */}
          {editBotId !== bot.number && (
            <div className="my-bots__buy-mobile">
              {/* Кнопки дат заказов и детали заказа */}
              {purchases[bot.number] && purchases[bot.number].length > 0 ? (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>Запланированные заказы:</div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    {purchases[bot.number].map((purchase, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedPurchaseDate(prev => {
                          // Если кликаем на ту же кнопку, то снимаем выделение
                          if (prev[bot.number] === idx) {
                            const newState = { ...prev };
                            delete newState[bot.number];
                            return newState;
                          }
                          // Иначе выделяем новую кнопку
                          return { ...prev, [bot.number]: idx };
                        })}
                        className={`my-bots__buy-mobile__btn ${selectedPurchaseDate[bot.number] === idx ? 'active' : ''}`}
                      >
                        {formatDate(purchase.date)}
                      </button>
                    ))}
                  </div>
                  {typeof selectedPurchaseDate[bot.number] === 'number' && purchases[bot.number][selectedPurchaseDate[bot.number]] && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ marginBottom: 6 }}>
                        <span style={{ color: '#222' }}>Заказ от: </span>
                        <span style={{ color: '#456EFD' }}>{formatDate(purchases[bot.number][selectedPurchaseDate[bot.number]].date)}</span>
                      </div>
                      <div style={{ marginBottom: 6 }}>
                        <span style={{ color: '#222' }}>USDT: </span>
                        <span style={{ color: '#456EFD' }}>{purchases[bot.number][selectedPurchaseDate[bot.number]].price}</span>
                      </div>
                      <div>
                        <span style={{ color: '#222' }}>Статус: </span>
                        <span style={{ color: '#456EFD' }}>{translateStatus(purchases[bot.number][selectedPurchaseDate[bot.number]].status)}</span>
                      </div>
                      <div className="my-bots__buy-mobile__btn-container">
                        <button
                          className="my-bots__approve-btn"
                          onClick={() => handleApprovePurchase(purchases[bot.number][selectedPurchaseDate[bot.number]].number)}
                        >
                          Подтвердить
                        </button>
                        <button
                          className="my-bots__cancel-purchase-btn"
                          onClick={() => handleCancelPurchase(purchases[bot.number][selectedPurchaseDate[bot.number]].number)}
                        >
                          Отменить
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: 16, color: '#666' }}>
                  Заказов сейчас нет
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MyBotsMobile; 