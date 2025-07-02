import React, { useContext, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Components/Header/Header.jsx";
import routes from "./router.js";
import Footer from "./Components/Footer/Footer.jsx";
import Home from "./Pages/Home/home.jsx"; // Импортируем Home
import { AlertContext } from "./utilits/AlertContext/AlertContext.jsx";
import { Alert, Snackbar } from "@mui/material";
import NotFound from "./Pages/NotFound.jsx";

const App = () => {
  const [cartItems, setCartItems] = useState([]);
  const { alert, handleClose } = useContext(AlertContext);
  const addToCart = (item) => {
    setCartItems([...cartItems, item]);
  };

  // useEffect(() => {
  //   sessionStorage.setItem('access_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzUxMzg1MjEyLCJpYXQiOjE3NTA3ODA0MTIsImp0aSI6IjdiZDQ0ZjhhYzA1NzRmZTc5MzdjYzQwMDhhODM2ZjI0IiwidXNlcl9pZCI6NjU5NjYzNDcxLCJ0ZWxlZ3JhbV9pZCI6NjU5NjYzNDcxLCJmaXJzdF9uYW1lIjoiRGFubnkiLCJsYXN0X25hbWUiOm51bGwsInVzZXJuYW1lIjoiRGFubnlfZGV2X2wiLCJwaG90b191cmwiOiJodHRwczovL3QubWUvaS91c2VycGljLzMyMC9fcXBmSjZqOGFVVkNSU2FZVHp3TXlLUjRxWUZjVURWbmRUck5ZLUlvc05jLmpwZyJ9.8beVL_FLr3fa1807752lZNWIEZlhkIVUHHXY84wWEWM');
  // }, []);

  return (
    <Router>
      <Header cartItems={cartItems} />
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleClose} severity={alert.severity} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>
      <div className="">
        <Routes>
          {routes.map((route, index) => (
            <Route key={index} {...route} />
          ))}
          <Route path="/home" element={<Home addToCart={addToCart} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
};

export default App;
