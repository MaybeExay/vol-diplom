import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>🤝 РУДН</h3>
            <p>Платформа для оптимизации волонтёрской деятельности</p>
          </div>
          <div className="footer-section">
            <h4>Навигация</h4>
            <ul>
              <li><a href="/">Главная</a></li>
              <li><a href="/events">События</a></li>
              <li><a href="/participants">Участники</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Контакты</h4>
            <p>info@test.ru</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Сочинский филиал РУДН. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
