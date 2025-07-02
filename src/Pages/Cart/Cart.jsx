import React, { useContext, useEffect, useState, forwardRef } from "react";
import { CartContext } from "../../utilits/CartContext/CartContext";
import BotIcon from "../../assents/images/bot.png";
import EmptyCart from "../../assents/images/EmptyCart.png";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./cart.css";
import Galka from "../../assents/images/galoshka.png"
import Trash from "../../assents/images/trash_can.png"
import UsersBot from "../../assents/images/users-bot.png";
import UsersBotActive from "../../assents/images/users-bot-active.png";
import ChatBot from "../../assents/images/chats-bot.png";
import { StepContext } from "../../utilits/StepContext/StepContext";

const CustomInput = forwardRef(({ value, onClick, placeholder, disabled, onFocus }, ref) => (
  <input
    className={`date-picker${disabled ? ' date-picker--disabled' : ''}`}
    onClick={disabled ? onFocus : onClick}
    value={value}
    placeholder={placeholder}
    ref={ref}
    readOnly
    style={{ 
      background: "#fff", 
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1
    }}
  />
));

const Cart = () => {
  const { cart, setCart } = useContext(CartContext);
  const { step, setStep } = useContext(StepContext);
  const [categories, setCategories] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [postLink, setPostLink] = useState(null);
  const [postStatus, setPostStatus] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [mobileOpen, setMobileOpen] = useState({});
  const [showAuthMessage, setShowAuthMessage] = useState(false);
  const token = sessionStorage.getItem('access_token');

  // Загрузка категорий для отображения их названий
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
  }, [token]);
  console.log(categories);
  
  const handleDatePickerFocus = () => {
    if (!token) {
      setShowAuthMessage(true);
      setTimeout(() => setShowAuthMessage(false), 3000);
    }
  };

  const createPost = async () => {
    if (!token) {
      alert('Для создания поста необходимо зарегистрироваться');
      return;
    }

    try {
      const response = await fetch('https://flyersendtest.ru/api/user/post/create/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: "New Post",
          text: "Post content",
          is_public: true
        })
      });
      if (response.ok) {
        const data = await response.json();
        setPostLink({
          post_id: data.result.post_id,
          link: data.result.link
        });
        checkPostStatus(data.result.post_id);
      }
    } catch (error) {
      console.error('Ошибка при создании поста:', error);
    }
  };

  const checkPostStatus = async (postId) => {
    if (!token) return;

    try {
      const response = await fetch(`https://flyersendtest.ru/api/user/post/?post_id=${postId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const isPostReady = (data.result?.text && data.result.text.trim() !== "") ||
          (data.result?.file && Object.keys(data.result.file).length > 0);
        setPostStatus(isPostReady);
        if (!isPostReady) {
          setTimeout(() => checkPostStatus(postId), 2000);
        }
      }
    } catch (error) {
      console.error('Ошибка при проверке поста:', error);
    }
  };

  const isCheckoutValid = () => {
    if (cart.length === 0) return false;
    const minTimestamp = Date.now() + 24 * 60 * 60 * 1000;
    return selectedDate && postLink?.post_id && postStatus && selectedDate.getTime() > minTimestamp;
  };

  const handlePurchase = async () => {
    setPurchaseLoading(true);
    if (!token) return;

    // Группируем ботов по категориям
    const botsByCategory = cart.reduce((acc, item) => {
      const category = item.categories?.[0] || item.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        number: item.number,
        price: item.price
      });
      return acc;
    }, {});

    // Создаем объект покупки для первой категории
    const [category, bots] = Object.entries(botsByCategory)[0];
    const purchase = {
      category: 1,
      post_id: postLink.post_id,
      date: Math.floor(selectedDate.getTime() / 1000),
      bots: bots
    };

    try {
      const response = await fetch('https://flyersendtest.ru/api/purchase/create/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(purchase) // Отправляем один объект вместо массива
      });
      if (response.ok) {
        alert('Покупки успешно оформлены!');
        setCart([]);
      } else {
        const errorData = await response.json();
        alert(`Ошибка при оформлении покупок: ${errorData.detail || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      alert('Ошибка сети');
    } finally {
      setPurchaseLoading(false);
    }
  };

  // Подсчет количества и суммы
  const totalCount = cart.length;
  const totalSum = cart.reduce((sum, item) => sum + (item.price || 0), 0);

  // Выделить/снять выделение одной карточки
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((el) => el !== id) : [...prev, id]
    );
  };

  // Выбрать все
  const selectAll = () => {
    setSelected(cart.map((item) => item.id || item.number));
  };

  // Снять все
  const deselectAll = () => {
    setSelected([]);
  };

  // Удалить выбранные
  const removeSelected = () => {
    const newCart = cart.filter(item => !selected.includes(item.id || item.number));
    setCart(newCart);
    setSelected([]);
  };

  // Ограничения для выбора даты: минимум завтра с 00:00, максимум через 30дней
  const now = new Date();
  const minDateTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const maxDateTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="">
      <h3 className="catalog-title">Корзина</h3>
      {cart.length === 0 ? (
        <div className="empty-cart">
          <img src={EmptyCart} alt="" className="empty-cart__img" />
          <h3 className="empty-cart__title">Корзина пуста</h3>
          <button className="empty-cart__button" onClick={() => setStep(2)}>Перейти к каталогу</button>
        </div>
      ) : (
        <div className="cart-box">
          {/* Сообщение о необходимости авторизации */}
          {showAuthMessage && (
            <div className="auth-message" style={{
              background: '#ff6b6b',
              color: 'white',
              padding: '10px',
              borderRadius: '5px',
              marginBottom: '15px',
              textAlign: 'center',
              fontSize: '14px'
            }}>
              Для выбора даты необходимо зарегистрироваться
            </div>
          )}
          
          <div className="cart-actions">
            <button onClick={selected.length === cart.length ? deselectAll : selectAll} className="cart-actions__button">
              {selected.length === cart.length ? "Снять все" : "Выбрать все"} <img src={Galka} alt="" />
            </button>
            <button
              onClick={removeSelected}
              disabled={selected.length === 0}
              className="cart-remove-btn"
            >
              Удалить выбранные <img src={Trash} alt="" />
            </button>
          </div>
          <div className="cart-box__items">
            <div className="cart-box__items-left">
              {cart.map((item, index) => {
                const id = item.id || item.number || index;
                const isActive = selected.includes(id);
                const isMobileOpen = mobileOpen[id] || false;
                return (
                  <div
                    className={`cart-item${isActive ? ' cart-item--active' : ''}`}
                    key={id}
                    onClick={() => toggleSelect(id)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Десктопная версия (как есть) */}
                    <div className="catalog-item catalog-item--desktop">
                      <div className="item-text__cart">
                        <div className="item-text__left">
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
                          <div className="item-stats-cart">
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
                          <div className="items-details__price">
                            <span className="item-price-cart">
                              USDT {item.price}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Мобильная версия */}
                    <div className="catalog-item cart-mobile">
                      <div className="cart-mobile__box">
                        <div className="cart-mobile__photo">
                          {item.photo ? (
                            <img src={item.photo} alt="Бот" className="item-image" />
                          ) : (
                            <img src={BotIcon} alt="Бот" className="item-image" />
                          )}
                        </div>
                        <div className="cart-mobile__text">
                          <h3 className="cart-mobile__title">{item.name}</h3>
                          <span className="cart-mobile__audience">
                            Аудитория: <b>{item.file?.users ?? '-'}</b>
                          </span> <br />
                          <span>Покупок: <b>{item.data?.purchases ?? 0}</b></span><br />
                          {/* Скрываемый блок */}
                          <div className={`cart-mobile__hidden${isMobileOpen ? ' cart-mobile__hidden--open' : ''}`}>
                            <span>Категория: <b>{item.categories && categories ? item.categories.map(catId => categories[String(catId)]?.name).filter(Boolean).join(', ') : ''}</b></span><br />
                            <span>RU: <b>{item.data?.ru ?? '-'}</b></span><br />
                            <span>МЦА: <b>{item.data?.men ?? '-'}</b></span>
                          </div>
                          <button
                            className="cart-mobile__more"
                            onClick={e => {
                              e.stopPropagation();
                              setMobileOpen(prev => ({ ...prev, [id]: !prev[id] }));
                            }}
                          >
                            {isMobileOpen ? 'Свернуть ▲' : 'Подробнее ▼'}
                          </button>
                        </div>
                        <div className="cart-mobile__bottom">
                          <span className="cart-mobile__rate">
                            <span className="item-rating__star">★</span>{' '}
                            {item.data?.purchases ? (item.data.purchases / 20).toFixed(1) : '4.9'}
                          </span>
                          <span className="item-price-cart">USDT {item.price}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="cart-item__price">
              <div className="cart-summary">
                <p className="cart-summary__bots">
                  {totalCount} {
                    totalCount === 1 ? 'бот' :
                      totalCount >= 2 && totalCount <= 4 ? 'бота' :
                        'ботов'
                  }
                </p>
                <p className="cart-summary__total">
                  Итоговая стоимость: {" "}
                  <span className="cart-summary__total-price">{totalSum} USDT</span>
                </p>
              </div>

              {/* Блок создания поста и выбора даты */}
              <div className="cart-post-date">
                <div className="cart-post-date__post">
                  {postLink ? (
                    <div className="post-status">
                      {postStatus ? (
                        <div className="post-link-">
                          <span className="post-status__icon">✓</span>
                          Пост загружен
                        </div>
                      ) : (
                        <a
                          href={postLink.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="post-link"
                        >
                          Загрузить пост
                        </a>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={createPost}
                      className={`create-post-btn${!token ? ' create-post-btn--disabled' : ''}`}
                      disabled={!token}
                      style={{
                        opacity: !token ? 0.6 : 1,
                        cursor: !token ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {!token ? 'Создать пост (требуется регистрация)' : 'Создать пост'}
                    </button>
                  )}
                </div>

                <div className="cart-post-date__calendar">
                  <DatePicker
                    selected={selectedDate}
                    onChange={date => setSelectedDate(date)}
                    minDate={minDateTime}
                    maxDate={maxDateTime}
                    filterDate={date => {
                      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
                      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
                      return (
                        endOfDay >= minDateTime && startOfDay <= maxDateTime
                      );
                    }}
                    filterTime={time => {
                      return time >= minDateTime && time <= maxDateTime;
                    }}
                    placeholderText={!token ? "Выберите дату и время (требуется регистрация)" : "Выберите дату и время"}
                    dateFormat="dd.MM.yyyy HH:00"
                    showTimeSelect
                    timeFormat="HH:00"
                    timeIntervals={60}
                    timeCaption="Время"
                    customInput={<CustomInput disabled={!token} onFocus={handleDatePickerFocus} />}
                    shouldCloseOnSelect={true}
                    disabled={!token}
                  />
                </div>
              </div>

              <button
                className={`cart-summary__checkout${!isCheckoutValid() ? ' cart-summary__checkout--disabled' : ''}`}
                disabled={!isCheckoutValid() || purchaseLoading}
                onClick={handlePurchase}
              >
                {purchaseLoading ? "Оформляем..." : "Перейти к оформлению"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
