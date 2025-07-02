import React, { useState, useContext } from "react";
import { AlertContext } from "../../utilits/AlertContext/AlertContext";

const AddBot = () => {
  const { showAlert } = useContext(AlertContext);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addToken, setAddToken] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAddBot = async () => {
    const accessToken = sessionStorage.getItem('access_token');
    if (!addToken || !accessToken) return;
    setAdding(true);
    window.location.reload()
    try {
      const response = await fetch('https://flyersendtest.ru/api/user/bot/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ token: addToken })
      });
      if (response.ok) {
        setAddToken("");
        setShowAddForm(false);
        window.dispatchEvent(new Event('botsUpdated'));
      } else {
        showAlert('Ошибка при добавлении бота', 'error');
      }
    } catch (error) {
      showAlert('Ошибка при добавлении бота', 'error');
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <button className="my-bots__add-btn" onClick={() => {
        setShowAddForm(true);
        
      }}>
        Добавить бота&nbsp;+
      </button>
      {showAddForm && (
        <div className="my-bots__add-form-block">
          <div className="my-bots__add-form-title">Добавление нового бота</div>
          <div className="my-bots__add-form-desc">Отправьте токен вашего бота</div>
          <div className="my-bots__add-form-example">Пример: 12345678:AaBbCcDdEeFf...</div>
          <input
            className="my-bots__edit-input"
            type="text"
            placeholder="Введите токен бота"
            value={addToken}
            onChange={e => setAddToken(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }} className="my-bots__add-form-actions">
            <button className="my-bots__save-btn"  onClick={handleAddBot} disabled={adding || !addToken} >
              Далее
            </button>
            <button className="my-bots__cancel-btn" onClick={() => { setShowAddForm(false); setAddToken(""); }}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AddBot; 