import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI, eventsAPI } from '../api';
import EditProfileModal from '../components/EditProfileModal';
import './Profile.css';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAdmin, isAuthenticated, updateUser } = useAuth();
  const [user, setUser] = useState(null);
  const [userEvents, setUserEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const isOwnProfile = isAuthenticated && currentUser.id === parseInt(id);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      const userRes = await usersAPI.getById(id);
      setUser(userRes.data);

      if (isOwnProfile) {
        const eventsRes = await eventsAPI.getAll();

      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdated = (updatedUser) => {
    setUser(updatedUser);
    if (isOwnProfile) {
      updateUser(updatedUser);
    }
    setShowEditModal(false);
  };

  const handleDeleteUser = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return;
    }

    try {
      await usersAPI.delete(id);
      navigate('/participants');
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка удаления');
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading">Загрузка профиля...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-loading">
        <div className="not-found">
          <h2>Пользователь не найден</h2>
          <button onClick={() => navigate('/')} className="btn-back">
            На главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header-card">
          <div className="profile-avatar-large">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>

          <div className="profile-info">
            <h1>{user.name}</h1>
            <span className={`role-badge-large role-${user.role}`}>
              {user.role === 'admin' ? 'Администратор' : 
               user.role === 'curator' ? 'Куратор' : 'Участник'}
            </span>
          </div>

          {(isOwnProfile || isAdmin) && (
            <div className="profile-actions">
              <button 
                className="btn-edit-profile"
                onClick={() => setShowEditModal(true)}
              >
                Редактировать
              </button>
              {isAdmin && !isOwnProfile && (
                <button 
                  className="btn-delete-user"
                  onClick={handleDeleteUser}
                >
                  Удалить
                </button>
              )}
            </div>
          )}
        </div>

        <div className="profile-details">
          <div className="detail-item">
            <strong>Email:</strong> {user.email}
          </div>
          {user.phone && (
            <div className="detail-item">
              <strong>Телефон:</strong> {user.phone}
            </div>
          )}
          {user.bio && (
            <div className="detail-item">
              <strong>О себе:</strong>
              <p>{user.bio}</p>
            </div>
          )}
          <div className="detail-item">
            <strong>Дата регистрации:</strong>{' '}
            {new Date(user.created_at).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal
          user={user}
          isAdmin={isAdmin}
          onClose={() => setShowEditModal(false)}
          onUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
};

export default Profile;
