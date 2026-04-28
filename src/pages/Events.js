import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { eventsAPI } from '../api';
import EventCard from '../components/EventCard';
import CreateEventModal from '../components/CreateEventModal';
import './Events.css';

const Events = () => {
  const { isCurator, isAdmin } = useAuth();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, statusFilter, searchQuery]);

  const loadEvents = async () => {
    try {
      const response = await eventsAPI.getAll();
      setEvents(response.data);
    } catch (error) {
      console.error('Ошибка загрузки событий:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    const now = new Date();
    if (statusFilter === 'upcoming') {
      filtered = filtered.filter(e => new Date(e.event_date) >= now);
    } else if (statusFilter === 'past') {
      filtered = filtered.filter(e => new Date(e.event_date) < now);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        e.address.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      const aDate = new Date(a.event_date);
      const bDate = new Date(b.event_date);
      const aIsPast = aDate < now;
      const bIsPast = bDate < now;
      
      if (aIsPast && !bIsPast) return 1;
      if (!aIsPast && bIsPast) return -1;
      return bDate - aDate;
    });

    setFilteredEvents(filtered);
  };

  const handleEventCreated = (newEvent) => {
    setEvents([newEvent, ...events]);
    setShowCreateModal(false);
  };

  const now = new Date();
  const upcomingEvents = filteredEvents.filter(e => new Date(e.event_date) >= now);
  const pastEvents = filteredEvents.filter(e => new Date(e.event_date) < now);

  return (
    <div className="events-page">
      <div className="events-container">
        <div className="events-header">
          <h1>Все события</h1>
          {(isCurator || isAdmin) && (
            <button 
              className="btn-create-event"
              onClick={() => setShowCreateModal(true)}
            >
              + Создать событие
            </button>
          )}
        </div>

        <div className="events-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Поиск событий..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              Все
            </button>
            <button
              className={`filter-btn ${statusFilter === 'upcoming' ? 'active' : ''}`}
              onClick={() => setStatusFilter('upcoming')}
            >
              Предстоящие
            </button>
            <button
              className={`filter-btn ${statusFilter === 'past' ? 'active' : ''}`}
              onClick={() => setStatusFilter('past')}
            >
              Прошедшие
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Загрузка событий...</div>
        ) : (
          <div className="events-content">
            {upcomingEvents.length > 0 && (
              <section className="events-section">
                <h2>Предстоящие события</h2>
                <div className="events-grid">
                  {upcomingEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            {pastEvents.length > 0 && (
              <section className="events-section past-section">
                <h2>Прошедшие события</h2>
                <div className="events-grid">
                  {pastEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            {filteredEvents.length === 0 && (
              <div className="empty-state">
                <p>События не найдены</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleEventCreated}
        />
      )}
    </div>
  );
};

export default Events;
