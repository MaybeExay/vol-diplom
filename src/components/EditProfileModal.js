import React, { useState } from 'react';
import { usersAPI } from '../api';
import './EditProfileModal.css';

const EditProfileModal = ({ user, isAdmin, onClose, onUpdated }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone || '',
    bio: user.bio || '',
    role: user.role,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      if (isAdmin) {
        response = await usersAPI.update(user.id, formData);
      } else {
        response = await usersAPI.updateMe(formData);
      }
      onUpdated(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка обновления профиля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Редактировать профиль</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Имя</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Телефон</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+7 (999) 000-00-00"
            />
          </div>

          <div className="form-group">
            <label>О себе</label>
            <textarea
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              placeholder="Расскажите о себе"
            />
          </div>

          {isAdmin && (
            <div className="form-group">
              <label>Роль</label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="participant">Участник</option>
                <option value="curator">Куратор</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
