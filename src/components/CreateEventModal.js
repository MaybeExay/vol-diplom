import React, { useState } from 'react';
import { eventsAPI } from '../api';
import './CreateEventModal.css';

const CreateEventModal = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    address: '',
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Изображение не должно превышать 5МБ');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Файл должен быть изображением');
        return;
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('event_date', formData.event_date);
      formDataToSend.append('address', formData.address);
      
      if (image) {
        formDataToSend.append('image', image);
      }

      const response = await eventsAPI.create(formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onCreated(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания события');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content event-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Создать событие</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название события</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Введите название события"
            />
          </div>

          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              required
              rows={5}
              placeholder="Опишите событие"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Дата и время проведения</label>
              <input
                type="datetime-local"
                value={formData.event_date}
                onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Адрес</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                required
                placeholder="Где пройдет событие"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Изображение (до 5МБ)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          {preview && (
            <div className="image-preview">
              <img src={preview} alt="Preview" />
              <button
                type="button"
                className="remove-image"
                onClick={() => {
                  setImage(null);
                  setPreview(null);
                }}
              >
                ×
              </button>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Создание...' : 'Создать событие'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
