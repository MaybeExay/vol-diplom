import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postsAPI, eventsAPI } from '../api';
import PostCard from '../components/PostCard';
import EventCard from '../components/EventCard';
import CreatePostModal from '../components/CreatePostModal';
import './Home.css';

const Home = () => {
  const { isCurator, isAdmin, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [postsRes, eventsRes] = await Promise.all([
        postsAPI.getAll(),
        eventsAPI.getAll({ status: 'upcoming' })
      ]);
      setPosts(postsRes.data);
      setEvents(eventsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await postsAPI.delete(postId);
      setPosts(posts.filter(p => p.id !== postId));
    } catch (error) {
      alert('Ошибка удаления поста');
    }
  };

  const handleEditPost = (updatedPost) => {
    setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
    setShowCreatePost(false);
  };

  return (
    <div className="home">
      <div className="home-container">
        <main className="main-feed">
          <div className="feed-header">
            <h1>Новости волонтёрства</h1>
            {(isCurator || isAdmin) && (
              <button 
                className="btn-create-post-main"
                onClick={() => setShowCreatePost(true)}
              >
                + Создать пост
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading">Загрузка...</div>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <p>Пока нет новостей</p>
              {!isAuthenticated && (
                <Link to="/register" className="btn-link">
                  Присоединяйтесь к нам!
                </Link>
              )}
            </div>
          ) : (
            <div className="posts-list">
              {posts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onDelete={handleDeletePost}
                  onEdit={handleEditPost}
                />
              ))}
            </div>
          )}
        </main>


        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>Ближайшие события</h2>
            <Link to="/events" className="btn-all-events">
              Все события →
            </Link>
          </div>

          {loading ? (
            <div className="loading">Загрузка...</div>
          ) : events.length === 0 ? (
            <div className="empty-sidebar">
              <p>Пока нет предстоящих событий</p>
            </div>
          ) : (
            <div className="events-sidebar">
              {events.map(event => (
                <EventCard key={event.id} event={event} compact />
              ))}
            </div>
          )}
        </aside>
      </div>

      {showCreatePost && (
        <CreatePostModal 
          onClose={() => setShowCreatePost(false)}
          onCreated={handlePostCreated}
        />
      )}
    </div>
  );
};

export default Home;
