import React, { useContext } from "react";
import Catalog from "../../Components/Catalog/Catalog";
import "./home.css";

import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import ListOutlinedIcon from "@mui/icons-material/ListOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InputIcon from "@mui/icons-material/Input";
import SmartBtn from "../../assents/images/Smart-btn.png";
import SmartBtnActive from "../../assents/images/Smart-btn-active.png";
import EmptyCart from "../../assents/images/EmptyCart.png";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { StepContext } from "../../utilits/StepContext/StepContext";
import { CartContext } from "../../utilits/CartContext/CartContext";
import Cart from "../Cart/Cart";
import Sorting from "../../Components/Sorting/Sorting";
import Main from "../Main/Main";
import Instructions from "../Instructions/Instructions.jsx";
import { Balance } from "@mui/icons-material";
import Balans from "../Balans/Balans.jsx";
import MyBots from "../MyBots/MyBots.jsx";
import History from "../History/History.jsx";
import ProfileMobile from "../../Components/ProfileMobile/ProfileMobile.jsx";

const Step1 = () => (
  <div>
    <Main />
  </div>
);
const Step2 = () => (
  <div>
    <Catalog />
  </div>
);
const Step3 = () => (
  <div>
    <Instructions />
  </div>
);
const Step4 = () => <div>Step 4 Content</div>;
const Step5 = () => {
  const { cart } = useContext(CartContext);
  const { step, setStep } = useContext(StepContext);
  return (
    <div className="catalog">
      {cart.length === 0 ? (
        <div className="empty-cart">
          <img src={EmptyCart} alt="" className="empty-cart__img" />
          <h3 className="empty-cart__title">Коризна пуста</h3>
          <button className="empty-cart__button" onClick={() => setStep(2)}>Перейти к каталогу</button>
        </div>
      ) : (
        <div className="cart-box">
          <Cart />
        </div>
      )}
    </div>
  );
};
const Step6 = () => (
  <div>
    <Sorting />
  </div>
);
const Step7 = () => (
  <div>
    <Balans />
  </div>
);
const Step8 = () => (
  <div>
    <MyBots />
  </div>
);
const Step9 = () => (
  <div>
    <History />
  </div>
);
const Step10 = () => (
  <div>
    <ProfileMobile />
  </div>
);

const Home = () => {
  const { step, setStep } = useContext(StepContext);

  const handleLogout = async () => {
    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) {
      sessionStorage.clear();
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
      setStep(1);
      window.location.reload();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1 />;
      case 2:
        return <Step2 />;
      case 3:
        return <Step3 />;
      case 4:
        return <Step4 />;
      case 5:
        return <Step5 />; // Новый шаг
      case 6:
        return <Step6 />; // Новый шаг
      case 7:
        return <Step7 />; // Новый шаг
      case 8:
        return <Step8 />; // Новый шаг
      case 9:
        return <Step9 />; // Новый шаг
      case 10:
        return <Step10 />; // Новый шаг
      default:
        return <Step1 />;
    }
  };

  return (
    <div className="home-container">
      <div className="step-fix">
        <div className="step-buttons">
          <button
            className={`step-button ${step === 1 ? "active" : ""}`}
            onClick={() => setStep(1)}
          >
            <HomeOutlinedIcon /> Главная
          </button>
          <button
            className={`step-button ${step === 2 ? "active" : ""}`}
            onClick={() => setStep(2)}
          >
            <ListOutlinedIcon /> Каталог
          </button>
          <button
            className={`step-button__smart ${step === 6 ? "active" : ""}`}
            onClick={() => setStep(6)}
          >
            <img src={step === 6 ? SmartBtn : SmartBtnActive} alt="" />
            <p className="step-button__smart-text">Умный подбор</p>
          </button>

          <button
            className={`step-button ${step === 3 ? "active" : ""}`}
            onClick={() => setStep(3)}
          >
            <HelpOutlineIcon /> Инструкция
          </button>
        </div>
      </div>
      <div className="step-fix-mobile">
        <div className="step-buttons">

          <button
            className={`step-button ${step === 1 ? "active" : ""}`}
            onClick={() => setStep(1)}
          >
            <HomeOutlinedIcon /> Главная
          </button>
          <button
            className={`step-button ${step === 2 ? "active" : ""}`}
            onClick={() => setStep(2)}
          >
            <ListOutlinedIcon /> Каталог
          </button>
          <button
            className={`step-button__smart-mobile ${step === 6 ? "active" : ""}`}
            onClick={() => setStep(6)}
          >
            <div className="mobile-smart-btn">
              <img src={step === 6 ? SmartBtn : SmartBtnActive} alt="" />
            </div>
            <p className="step-button__smart-text">Подбор</p>
          </button>
          <button
            className={`step-button ${step === 3 ? "active" : ""}`}
            onClick={() => setStep(3)}
          >
            <HelpOutlineIcon /> Инструкция
          </button>
          <button
            className={`step-button ${step === 10 ? "active" : ""}`}
            onClick={() => setStep(10)}
          >
            <AccountCircleIcon /> Проофиль
          </button>
        </div>
      </div>
      <div className="step-content">{renderStep()}</div>
    </div>
  );
};

export default Home;
