import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventsAPI, getAssetUrl } from '../api';
import EditEventModal from '../components/EditEventModal';
import ParticipantsListModal from '../components/ParticipantsListModal';
import './EventDetail.css';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isParticipant, isCurator, isAdmin } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    try {
      const response = await eventsAPI.getById(id);
      setEvent(response.data);
    } catch (error) {
      console.error('Ошибка загрузки события:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleParticipate = async () => {
    try {
      await eventsAPI.participate(id);
      setEvent({ ...event, isParticipant: true, participant_count: event.participant_count + 1 });
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка записи на событие');
    }
  };

  const handleCancelParticipation = async () => {
    try {
      await eventsAPI.cancelParticipation(id);
      setEvent({ ...event, isParticipant: false, participant_count: event.participant_count - 1 });
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка отмены участия');
    }
  };

  const handleEventUpdated = (updatedEvent) => {
    setEvent(updatedEvent);
    setShowEditModal(false);
  };

  if (loading) {
    return (
      <div className="event-detail-loading">
        <div className="loading">Загрузка события...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-detail-loading">
        <div className="not-found">
          <h2>Событие не найдено</h2>
          <button onClick={() => navigate('/events')} className="btn-back">
            К списку событий
          </button>
        </div>
      </div>
    );
  }

  const isPast = new Date(event.event_date) < new Date();
  const imageUrl = getAssetUrl(event.image);
  const canEdit = isCurator || isAdmin;

  return (
    <div className="event-detail-page">
      <div className="event-detail-container">
        <button onClick={() => navigate('/events')} className="btn-back-link">
          ← Назад к списку
        </button>

        <div className="event-detail-header">
          {imageUrl ? (
            <div className="event-detail-image">
              <img src={imageUrl} alt={event.title} />
              {isPast && <span className="past-badge-large">Завершено</span>}
            </div>
          ) : (
            <div className="event-detail-image-placeholder">
              <span>📅</span>
              {isPast && <span className="past-badge-large">Завершено</span>}
            </div>
          )}

          <div className="event-detail-info">
            <h1>{event.title}</h1>
            
            <div className="event-meta-large">
              <span className="meta-item">
                📍 {new Date(event.event_date).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              <span className="meta-item">
                👥 {event.participant_count} участников
              </span>
            </div>

            <div className="event-address">
              <strong>Адрес:</strong> {event.address}
            </div>

            {(isCurator || isAdmin) && (
              <button 
                className="btn-view-participants"
                onClick={() => setShowParticipantsModal(true)}
              >
                Посмотреть участников
              </button>
            )}

            {isAuthenticated && isParticipant && !isPast && (
              <div className="action-buttons">
                {event.isParticipant ? (
                  <button 
                    className="btn-cancel-participation"
                    onClick={handleCancelParticipation}
                  >
                    Отменить участие
                  </button>
                ) : (
                  <button 
                    className="btn-participate"
                    onClick={handleParticipate}
                  >
                    Участвовать
                  </button>
                )}
              </div>
            )}

            {canEdit && (
              <div className="admin-actions">
                <button 
                  className="btn-edit-event"
                  onClick={() => setShowEditModal(true)}
                >
                  Редактировать
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="event-detail-description">
          <h2>О событии</h2>
          <p>{event.description}</p>
        </div>

        <div className="event-detail-creator">
          <strong>Организатор:</strong> {event.creator_name}
        </div>
      </div>

      {showEditModal && (
        <EditEventModal
          event={event}
          onClose={() => setShowEditModal(false)}
          onUpdated={handleEventUpdated}
        />
      )}

      {showParticipantsModal && (
        <ParticipantsListModal
          eventId={id}
          onClose={() => setShowParticipantsModal(false)}
        />
      )}
    </div>
  );
};

export default EventDetail;
