import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <span className="logo-icon">🤝</span>
          <span className="logo-text">РУДН</span>
        </Link>

        <nav className="nav">
          <Link to="/events" className="nav-link">События</Link>
          <Link to="/participants" className="nav-link">Участники</Link>
        </nav>

        <div className="auth-buttons">
          {isAuthenticated ? (
            <>
              <Link to={`/participants/${user?.id}`} className="btn-profile">
                <span className="avatar-small">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    user?.name?.charAt(0).toUpperCase()
                  )}
                </span>
                <span className="profile-name">{user?.name}</span>
              </Link>
              <button onClick={handleLogout} className="btn-logout">
                Выход
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-login">
                Войти
              </Link>
              <Link to="/register" className="btn-register">
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
