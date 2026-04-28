import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI } from '../api';
import './Participants.css';

const Participants = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = filter === 'all' 
    ? users 
    : users.filter(u => u.role === filter);

  return (
    <div className="participants-page">
      <div className="participants-container">
        <h1>Участники</h1>

        <div className="participants-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Все
          </button>
          <button
            className={`filter-btn ${filter === 'participant' ? 'active' : ''}`}
            onClick={() => setFilter('participant')}
          >
            Участники
          </button>
          <button
            className={`filter-btn ${filter === 'curator' ? 'active' : ''}`}
            onClick={() => setFilter('curator')}
          >
            Кураторы
          </button>
          <button
            className={`filter-btn ${filter === 'admin' ? 'active' : ''}`}
            onClick={() => setFilter('admin')}
          >
            Администраторы
          </button>
        </div>

        {loading ? (
          <div className="loading">Загрузка участников...</div>
        ) : (
          <div className="participants-grid">
            {filteredUsers.map(user => (
              <Link
                key={user.id}
                to={`/participants/${user.id}`}
                className="participant-card"
              >
                <div className="participant-card-avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="participant-card-info">
                  <h3>{user.name}</h3>
                  <span className={`role-badge role-${user.role}`}>
                    {user.role === 'admin' ? 'Администратор' : 
                     user.role === 'curator' ? 'Куратор' : 'Участник'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Participants;
