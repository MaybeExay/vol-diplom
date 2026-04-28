import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI } from '../api';
import './ParticipantsListModal.css';

const ParticipantsListModal = ({ eventId, onClose }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParticipants();
  }, [eventId]);

  const loadParticipants = async () => {
    try {
      const response = await eventsAPI.getParticipants(eventId);
      setParticipants(response.data);
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content participants-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Участники события</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div className="loading">Загрузка участников...</div>
        ) : participants.length === 0 ? (
          <div className="empty-participants">
            <p>Пока нет участников</p>
          </div>
        ) : (
          <div className="participants-list">
            {participants.map(participant => (
              <Link
                key={participant.id}
                to={`/participants/${participant.id}`}
                className="participant-item"
                onClick={onClose}
              >
                <div className="participant-avatar">
                  {participant.name.charAt(0).toUpperCase()}
                </div>
                <div className="participant-info">
                  <span className="participant-name">{participant.name}</span>
                  <span className="participant-email">{participant.email}</span>
                </div>
                <span className={`participant-role role-${participant.role}`}>
                  {participant.role === 'admin' ? 'Администратор' : 
                   participant.role === 'curator' ? 'Куратор' : 'Участник'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantsListModal;
