import React, { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./header.css";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { StepContext } from "../../utilits/StepContext/StepContext";
import { CartContext } from "../../utilits/CartContext/CartContext";


// MUI
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import LogutIcon from "../../assents/images/logutIcon.png";
// Images
import Logo from "../../assents/images/Logo__mobile.png";
import LogoPc from "../../assents/images/log_pc.png";
import Cart from "../../assents/images/Cart.png";
import TelegramIcon from "../../assents/images/telegramIcon.png";
import Avatar from "../../assents/images/avatar.png";
import Balans from "../../assents/images/balans.png";
import MyBots from "../../assents/images/my-bots.png";
import Story from "../../assents/images/story.png";
import Statistica from "../../assents/images/statistica.png";
import TelegramLogin from "../TelegramBtn/TelegramLogin";
import { Logout } from "@mui/icons-material";

const Header = () => {
  const { step,setStep } = useContext(StepContext);
  const { cart } = useContext(CartContext);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const storedUser = sessionStorage.getItem("user_photo_url");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [balance, setBalance] = useState(0);
  const [retention, SetRetention] = useState(0);
  const [history, setHistory] = useState([]);
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      const accessToken = sessionStorage.getItem('access_token');

      if (!accessToken) {
        console.error("access_token не найден в sessionStorage");
        return;
      }

      try {
        // Получение баланса
        const balanceResponse = await fetch(
          `https://flyersendtest.ru/api/user/info/`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
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

    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  const handleLogout = async () => {
    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) {
      sessionStorage.clear();
      setIsLoggedIn(false);
      setUserData(null);
      setStep(1);
      return;
    }
    try {
      await fetch('https://flyersendtest.ru/api/logout/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: accessToken })
      });
    } catch (e) {
      // Можно обработать ошибку, если нужно
    } finally {
      sessionStorage.clear();
      setIsLoggedIn(false);
      setUserData(null);
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

      if (accessToken && refreshToken) {
        // Store tokens in sessionStorage
        sessionStorage.setItem('access_token', accessToken);
        sessionStorage.setItem('refresh_token', refreshToken);
        
        // Remove tokens from URL
        window.history.replaceState({}, document.title, window.location.pathname);

        // Fetch user data using the access token
        fetch('https://flyersendtest.ru/api/me/', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
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
          setIsLoggedIn(true);
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
      setIsLoggedIn(true);
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


  return (
    <header className="header">
      <nav className="nav">
        <Link to="/" className="nav-logo">
          <img src={Logo} alt="Logo" onClick={() => setStep(1)} style={{cursor: 'pointer'}}  />
        </Link>
        <Link to="/" className="nav-logo-pc">
          <img src={LogoPc} alt="Logo" onClick={() => setStep(1)} style={{cursor: 'pointer'}}  />
        </Link>
        {isLoggedIn && (
          <div className="account-info-center">
            <div className="account-info">
              <Button
                id="basic-button"
                aria-controls={open ? "basic-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
                onClick={handleClick}
              >
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
                      backgroundColor: "#4590D6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#606060",
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  >
                    {userData?.first_name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="account-info__title">
                  {userData?.first_name}
                </span>
                <KeyboardArrowDownIcon className="header-arrow__svg" />
              </Button>
              <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                className="header-account__info-menu"
                onClose={handleClose}
                MenuListProps={{
                  "aria-labelledby": "basic-button",
                }}
              >
                <MenuItem onClick={() => setStep(7)}>
                  {" "}
                  <img
                    src={Balans}
                    alt=""
                    className="header-account__info-icons"
                  />
                  Баланс
                </MenuItem>
                <MenuItem onClick={() => setStep(8)}>
                  {" "}
                  <img
                    src={MyBots}
                    alt=""
                    className="header-account__info-icons"
                  />
                  Мои боты
                </MenuItem>
                <MenuItem onClick={() => setStep(9)}>
                  {" "}
                  <img
                    src={Story}
                    alt=""
                    className="header-account__info-icons"
                  />
                  История закупов
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  {" "}
                  <img
                    src={LogutIcon}
                    alt="Logout"
                    className="header-account__info-icons"
                  />
                  Выход
                </MenuItem>
              </Menu>
            </div>
          </div>
        )}
        <div className="nav-right">
          {isLoggedIn ? (
            <div className="button-header">
              <span className="header-balans" style={{ color: "#1976d2", cursor: 'pointer' }} onClick={() => setStep(7)} >
                {Math.round((balance - retention) * 100) / 100} USDT
              </span>
              <button onClick={() => setStep(5)} className="nav-cart">
                <img src={Cart} alt="Cart" />
                {cart.length > 0 && (
                  <span className="cart-count">{cart.length}</span>
                )}
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => setStep(5)} className="nav-cart">
                <img src={Cart} alt="Cart" />
                {cart.length > 0 && (
                  <span className="cart-count">{cart.length}</span>
                )}
              </button>
              <a 
                href="https://t.me/FlyerSendBot?start=AUTH"
                className="telegram-login-button"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Войти <span className="telegram-login-button__text">через </span></span>
                <svg className="telegram-icon" viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M9.78,18.65L10.06,14.42L17.74,7.5C18.08,7.19 17.67,7.04 17.22,7.31L7.74,13.3L3.64,12C2.76,11.75 2.75,11.14 3.84,10.7L19.81,4.54C20.54,4.21 21.24,4.72 20.96,5.84L18.24,18.65C18.05,19.56 17.5,19.78 16.74,19.36L12.6,16.3L10.61,18.23C10.38,18.46 10.19,18.65 9.78,18.65Z"/>
                </svg>
              </a>
            </>
          )}
        </div>
      </nav>
      
      <style jsx>{`
        .nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }
        .account-info-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1;
        }
        .nav-right {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-left: auto;
        }
      `}</style>
    </header>
  );
};

export default Header;
