import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAssetUrl } from '../api';
import EditPostModal from './EditPostModal';
import './PostCard.css';

const PostCard = ({ post, onDelete, onEdit }) => {
  const { isAdmin, user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);


  let images = [];
  if (post.images) {
    try {
      images = typeof post.images === 'string' ? JSON.parse(post.images) : post.images;
      if (!Array.isArray(images)) images = [];
    } catch (e) {
      images = [];
    }
  }
  // Преобразуем пути к изображениям в полные URL
  images = images.map(img => getAssetUrl(img));

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleDelete = () => {
    if (window.confirm('Удалить этот пост?')) {
      onDelete(post.id);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handlePostUpdated = (updatedPost) => {
    if (onEdit) onEdit(updatedPost);
    setShowEditModal(false);
  };

  return (
    <>
      <article className="post-card">
        <header className="post-header">
          <div className="post-author">
            <div className="author-avatar">
              {post.author_name?.charAt(0).toUpperCase()}
            </div>
            <div className="author-info">
              <span className="author-name">{post.author_name}</span>
              <span className={`author-role role-${post.author_role}`}>
                {post.author_role === 'admin' ? 'Администратор' :
                 post.author_role === 'curator' ? 'Куратор' : 'Участник'}
              </span>
            </div>
          </div>
          <div className="post-meta">
            <span className="post-date">
              {new Date(post.created_at).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {isAdmin && (
              <>
                <button onClick={handleEdit} className="btn-edit-post">
                  ✏️
                </button>
                <button onClick={handleDelete} className="btn-delete-post">
                  🗑️
                </button>
              </>
            )}
          </div>
        </header>

        <h3 className="post-title">{post.title}</h3>
        <p className="post-content">{post.content}</p>

        {images.length > 0 && (
          <div className="post-gallery">
            {images.length > 1 && (
              <button className="gallery-btn prev" onClick={handlePrevImage}>
                ◀
              </button>
            )}
            <img src={images[currentImageIndex]} alt={`Изображение ${currentImageIndex + 1}`} />
            {images.length > 1 && (
              <button className="gallery-btn next" onClick={handleNextImage}>
                ▶
              </button>
            )}
            {images.length > 1 && (
              <div className="gallery-indicators">
                {images.map((_, index) => (
                  <span
                    key={index}
                    className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </article>

      {showEditModal && (
        <EditPostModal
          post={post}
          onClose={() => setShowEditModal(false)}
          onUpdated={handlePostUpdated}
        />
      )}
    </>
  );
};

export default PostCard;
