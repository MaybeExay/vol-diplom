import React, { useState } from 'react';
import { postsAPI, getAssetUrl } from '../api';
import './CreatePostModal.css';

const EditPostModal = ({ post, onClose, onUpdated }) => {
  const [formData, setFormData] = useState({
    title: post.title,
    content: post.content,
  });
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState(() => {
    try {
      const imgs = post.images ? (typeof post.images === 'string' ? JSON.parse(post.images) : post.images) : [];
      return Array.isArray(imgs) ? imgs : [];
    } catch (e) {
      return [];
    }
  });
  const [removedImages, setRemovedImages] = useState([]); // Отслеживаем удаленные
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = 3 - existingImages.length - images.length;
    
    if (files.length > remainingSlots) {
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

  const removeNewImage = (index) => {
    URL.revokeObjectURL(previews[index]);
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    const imageToRemove = existingImages[index];
    setRemovedImages([...removedImages, imageToRemove]); // ✅ Сохраняем для удаления
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('existingImages', JSON.stringify(existingImages));
      
      //  Отправляем список удаленных изображений
      if (removedImages.length > 0) {
        formDataToSend.append('removeImages', JSON.stringify(removedImages));
      }

      images.forEach((file) => {
        formDataToSend.append('images', file);
      });

      const response = await postsAPI.update(post.id, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onUpdated(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка обновления поста');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Редактировать пост</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} encType="multipart/form-data">
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
              disabled={existingImages.length + images.length >= 3}
            />
          </div>

          {existingImages.length > 0 && (
            <div className="form-group">
              <label>Текущие изображения</label>
              <div className="image-previews">
                {existingImages.map((img, index) => (
                  <div key={index} className="preview-item">
                    <img src={getAssetUrl(img)} alt={`Existing ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => removeExistingImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {previews.length > 0 && (
            <div className="form-group">
              <label>Новые изображения</label>
              <div className="image-previews">
                {previews.map((preview, index) => (
                  <div key={index} className="preview-item">
                    <img src={preview} alt={`New ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => removeNewImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
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

export default EditPostModal;