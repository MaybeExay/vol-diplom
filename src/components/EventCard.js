import React from 'react';
import { Link } from 'react-router-dom';
import { getAssetUrl } from '../api';
import './EventCard.css';

const EventCard = ({ event, compact = false }) => {
  const isPast = new Date(event.event_date) < new Date();
  const imageUrl = getAssetUrl(event.image);

  if (compact) {
    return (
      <Link to={`/events/${event.id}`} className={`event-card-compact ${isPast ? 'past' : ''}`}>
        {imageUrl && (
          <div className="event-image-compact">
            <img src={imageUrl} alt={event.title} />
          </div>
        )}
        <div className="event-info-compact">
          <h4>{event.title}</h4>
          <p className="event-date">
            {new Date(event.event_date).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
          {isPast && <span className="past-badge">Завершено</span>}
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/events/${event.id}`} className={`event-card ${isPast ? 'past' : ''}`}>
      {imageUrl ? (
        <div className="event-image">
          <img src={imageUrl} alt={event.title} />
          {isPast && <span className="past-badge">Завершено</span>}
        </div>
      ) : (
        <div className="event-image-placeholder">
          <span>📅</span>
          {isPast && <span className="past-badge">Завершено</span>}
        </div>
      )}
      <div className="event-content">
        <h3>{event.title}</h3>
        <p className="event-description">{event.description}</p>
        <div className="event-meta">
          <span className="event-date">
            📍 {new Date(event.event_date).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          <span className="participant-count">
            👥 {event.participant_count || 0}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
