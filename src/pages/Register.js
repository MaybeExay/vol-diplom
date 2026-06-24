import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!privacyAccepted) {
      setError('Необходимо принять политику конфиденциальности');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyAccept = () => {
    setPrivacyAccepted(true);
    setShowPrivacyModal(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Регистрация</h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Имя *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Ваше имя"
            />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="email@example.com"
            />
          </div>
          <div className="form-group">
            <label>Телефон</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+7 (999) 000-00-00"
            />
          </div>
          <div className="form-group">
            <label>Пароль *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="••••••••"
            />
          </div>
          <div className="form-group">
            <label>Подтверждение пароля *</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              placeholder="••••••••"
            />
          </div>
          
          <div className="privacy-checkbox">
            <input
              type="checkbox"
              id="privacy"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              disabled
            />
            <label htmlFor="privacy">
              Я принимаю{' '}
              <span 
                className="privacy-link"
                onClick={() => setShowPrivacyModal(true)}
              >
                политику конфиденциальности
              </span>
            </label>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || !privacyAccepted}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        <p className="auth-link">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>

      {showPrivacyModal && (
        <div 
          className="modal-overlay"
          onClick={() => setShowPrivacyModal(false)}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Политика конфиденциальности</h2>
            <div className="modal-body">
              <p>Здесь будет текст политики конфиденциальности...</p>
              <p>Добавить сюда полный текст документа по условиям предприятия.</p>
              <p>Временный заменитель</p>
              <p>Временный заменитель</p>
              <p>Временный заменитель</p>
              <p>Временный заменитель</p>
            </div>
            <div className="modal-footer">
              <label className="modal-checkbox-label">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={handlePrivacyAccept}
                />
                <span>Я принимаю условия политики конфиденциальности</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;