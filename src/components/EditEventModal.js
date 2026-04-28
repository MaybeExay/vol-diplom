import React, { useState } from 'react';
import { eventsAPI, getAssetUrl } from '../api';
import './CreateEventModal.css';

const EditEventModal = ({ event, onClose, onUpdated }) => {
  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description,
    event_date: new Date(event.event_date).toISOString().slice(0, 16),
    address: event.address,
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const currentImageUrl = getAssetUrl(event.image);

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
      setRemoveImage(false);
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
      if (removeImage && !image) {
        formDataToSend.append('removeImage', 'true');
      }

      const response = await eventsAPI.update(event.id, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onUpdated(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка обновления события');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content event-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Редактировать событие</h2>
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
            />
          </div>

          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              required
              rows={5}
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
              />
            </div>
          </div>

          <div className="form-group">
            <label>Изображение</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          {currentImageUrl && !preview && !removeImage && (
            <div className="image-preview existing">
              <img src={currentImageUrl} alt="Current" />
              <button
                type="button"
                className="remove-image"
                onClick={() => setRemoveImage(true)}
              >
                ×
              </button>
            </div>
          )}

          {preview && (
            <div className="image-preview">
              <img src={preview} alt="New" />
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

          {removeImage && (
            <div className="form-group">
              <label className="remove-label">
                <input
                  type="checkbox"
                  checked={removeImage}
                  onChange={() => setRemoveImage(false)}
                />
                Удалить изображение
              </label>
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

export default EditEventModal;
