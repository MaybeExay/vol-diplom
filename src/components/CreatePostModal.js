import React, { useState } from 'react';
import { postsAPI } from '../api';
import './CreatePostModal.css';

const CreatePostModal = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + images.length > 3) {
      setError('Можно загрузить максимум 3 изображения');
      return;
    }

    const validFiles = [];
    const newPreviews = [];

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError(`Файл "${file.name}" превышает 5МБ`);
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError(`Файл "${file.name}" не является изображением`);
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    setImages([...images, ...validFiles]);
    setPreviews([...previews, ...newPreviews]);
    setError('');
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(previews[index]);
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Используем FormData для отправки файлов
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      
      images.forEach((file, index) => {
        formDataToSend.append('images', file);
      });

      const response = await postsAPI.create(formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onCreated(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания поста');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Создать пост</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Заголовок</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Введите заголовок поста"
            />
          </div>

          <div className="form-group">
            <label>Контент</label>
            <textarea
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              required
              rows={6}
              placeholder="О чём хотите рассказать?"
            />
          </div>

          <div className="form-group">
            <label>Изображения (макс. 3, до 5МБ каждое)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              disabled={images.length >= 3}
            />
          </div>

          {previews.length > 0 && (
            <div className="image-previews">
              {previews.map((preview, index) => (
                <div key={index} className="preview-item">
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => removeImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Создание...' : 'Опубликовать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
