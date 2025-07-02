import React, { useContext, useEffect, useState } from "react";
import { StepContext } from "../../utilits/StepContext/StepContext";
import { CartContext } from "../../utilits/CartContext/CartContext";
import './profileMobile.css';
import { useLocation } from "react-router-dom";
import UserIcon from '../../assents/images/user.png';
import LogoutIcon from '../../assents/images/logout-mobile.png';
import HistoryIcon from '../../assents/images/history_mobile.png';
import BotsIcon from '../../assents/images/icon_bot-mobile.png';
import NoUser from '../../assents/images/users-no.png';


const ProfileMobile = () => {
  const { setStep } = useContext(StepContext);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const token = sessionStorage.getItem('access_token');
  const [userData, setUserData] = useState(null);
  const [balance, setBalance] = useState(0);
  const [retention, SetRetention] = useState(0);
  const location = useLocation();
  useEffect(() => {
    const fetchData = async () => {
      const accessToken = sessionStorage.getItem('access_token');

      if (!token) {
        console.error("access_token не найден в sessionStorage");
        return;
      }

      try {
        // Получение баланса
        const balanceResponse = await fetch(
          `https://flyersendtest.ru/api/user/info/`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          setBalance(parseFloat(balanceData.result.balance));
          SetRetention(parseFloat(balanceData.result.retention));
        }
      } catch (error) {
        console.error("Ошибка при выполнении запроса:", error);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    const accessToken = sessionStorage.getItem('access_token');
    if (!token) {
      sessionStorage.clear();
      setStep(1);
      return;
    }
    try {
      await fetch('https://flyersendtest.ru/api/logout/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: token })
      });
    } catch (e) {
      // Можно обработать ошибку, если нужно
    } finally {
      sessionStorage.clear();
      setStep(1);
      window.location.reload();
    }
  };

  useEffect(() => {
    // Handle Telegram authentication response
    const handleTelegramAuth = () => {
      const searchParams = new URLSearchParams(location.search);
      const accessToken = searchParams.get('access');
      const refreshToken = searchParams.get('refresh');

      if (token && refreshToken) {
        // Store tokens in sessionStorage
        sessionStorage.setItem('access_token', token);
        sessionStorage.setItem('refresh_token', refreshToken);

        // Remove tokens from URL
        window.history.replaceState({}, document.title, window.location.pathname);

        // Fetch user data using the access token
        fetch('https://flyersendtest.ru/api/me/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
          .then(response => response.json())
          .then(data => {
            // Save user data to sessionStorage separately
            sessionStorage.setItem('photo_url', data.photo_url);
            sessionStorage.setItem('username', data.username);
            sessionStorage.setItem('last_name', data.last_name);
            sessionStorage.setItem('first_name', data.first_name);

            // Update UI state
            // setIsLoggedIn(true);
            setUserData({
              username: data.username,
              photo_url: data.photo_url,
              last_name: data.last_name,
              first_name: data.first_name
            });
          })
          .catch(error => {
            console.error('Error fetching user data:', error);
          });
      }
    };

    handleTelegramAuth();
  }, [location]);

  // Check for existing session on component mount
  useEffect(() => {
    const photoUrl = sessionStorage.getItem('photo_url');
    const accessToken = sessionStorage.getItem('access_token');

    if (photoUrl && accessToken) {
      // setIsLoggedIn(true);
      setUserData({
        username: sessionStorage.getItem('username'),
        photo_url: photoUrl,
        last_name: sessionStorage.getItem('last_name'),
        first_name: sessionStorage.getItem('first_name')
      });
    }
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Проверка авторизации
  // const isLogged = !!accessToken;
  const isLogged = !!token;

  if (!isLogged) {
    return (
      <div className="profile-mobile">
        <div className="profile-mobile__title">Профиль</div>
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          margin: '24px 16px 24px 16px',
          padding: '48px 0 40px 0',
          display: 'flex',
          height: '272px',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(44, 62, 80, 0.04)'
        }}>
          <img src={NoUser} alt="no user" style={{ width: 96, height: 96, marginBottom: 24 }} />
          <div style={{ fontSize: 18, color: '#222', fontWeight: 500 }}>Войдите в профиль</div>
        </div>
        <a href="https://t.me/FlyerSendBot?start=AUTH"
        className="profile-mobile__login-btn"
          style={{
            width: 'calc(100% - 32px)',
            margin: '0 16px',
            background: '#3d6eff',
            color: '#fff',
            border: 'none',
            borderRadius: 16,
            padding: '18px 0',
            fontSize: 18,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            cursor: 'pointer',
            textDecoration: 'none',
            marginTop: 8
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: 8}}><path d="M9.036 15.472l-.398 5.6c.57 0 .818-.246 1.116-.542l2.672-2.56 5.536 4.04c1.014.558 1.74.264 1.994-.94l3.62-16.98c.33-1.56-.566-2.168-1.58-1.8L1.36 9.24c-1.54.6-1.522 1.46-.264 1.848l5.6 1.75 13-8.18c.61-.4 1.17-.18.712.22l-10.52 9.59z" fill="#fff"/></svg>
          Войти через Telegram
        </a>
      </div>
    );
  }

  return (
    <div className="profile-mobile">
      <div className="profile-mobile__title">Профиль</div>
      <div className="profile-mobile__header">
        <div className="profile-mobile__header-left">
          {userData?.photo_url ? (
            <img
              src={userData?.photo_url}
              alt=""
              className="account-info__images"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextElementSibling.style.display = "flex";
              }}
            />
          ) : (
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#606060",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
             <img src={UserIcon} alt="" />
            </div>
          )}
          <span className="account-info__title">
            {userData?.first_name}
          </span>
        </div>
        <button className="profile-mobile__logout" onClick={handleLogout}>
          <img src={LogoutIcon} alt="logout" />
        </button>
      </div>
      <div className="profile-mobile__balance-card">
        <span className="profile-mobile__balance-amount">{Math.round((balance - retention) * 100) / 100} USDT</span>
        <button
          className="profile-mobile__balance-btn"
          onClick={() => setStep(7)}
        >
          Баланс {'>'}
        </button>
      </div>
      <div className="profile-mobile__menu">
        <button
          className="profile-mobile__menu-btn"
          onClick={() => setStep(8)}
        >
          <img src={BotsIcon} alt="" /> Мои боты
        </button>
        <button
          className="profile-mobile__menu-btn"
          onClick={() => setStep(9)}
        >
          <img src={HistoryIcon} alt="" />
          История закупов
        </button>
      </div>
    </div>
  );
};

export default ProfileMobile;