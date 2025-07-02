import React, { createContext, useState } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    // Проверяем, есть ли у бота номер для идентификации
    if (!item || !item.number) {
      // Если у бота нет номера, добавляем его без проверки на дубликаты
      setCart((prevCart) => [...prevCart, item]);
      return true;
    }
    
    // Проверяем, есть ли уже бот с таким номером в корзине
    const isAlreadyInCart = cart.some(cartItem => cartItem.number === item.number);
    
    if (isAlreadyInCart) {
      // Возвращаем false, чтобы показать уведомление о том, что бот уже в корзине
      return false;
    }
    
    // Если бота нет в корзине, добавляем его
    setCart((prevCart) => [...prevCart, item]);
    return true; // Возвращаем true, чтобы показать уведомление об успешном добавлении
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, setCart }}>
      {children}
    </CartContext.Provider>
  );
};