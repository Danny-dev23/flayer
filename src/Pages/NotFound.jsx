import React from "react";

const NotFound = () => {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F4F5F7',
            width: '100%',
        }}>
            <div style={{
                borderRadius: 12,
                padding: '24px 32px',
                textAlign: 'center',
            }}>
                <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Ошибка 404</h2>
                <div style={{ fontSize: 13, color: '#222', marginBottom: 18, background: '#fff', padding: '16px', borderRadius: 12, fontWeight: 700 }}>
                    Кажется что-то пошло не так! Страница которую вы запрашиваете, не существует.
                </div>
                <a href="/" style={{
                    display: 'inline-block',
                    background: '#3d6eff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 24px',
                    fontSize: 14,
                    fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'background 0.2s',
                }}>Перейти на главную</a>
            </div>
        </div>
    );
};

export default NotFound; 