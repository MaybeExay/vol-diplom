const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authMiddleware, roleMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Получить все события с фильтрацией
router.get('/', (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `
      SELECT e.*, u.name as creator_name,
             (SELECT COUNT(*) FROM participants WHERE event_id = e.id) as participant_count
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status === 'upcoming') {
      query += ` AND e.event_date >= datetime('now')`;
    } else if (status === 'past') {
      query += ` AND e.event_date < datetime('now')`;
    }

    if (search) {
      query += ` AND (e.title LIKE ? OR e.description LIKE ? OR e.address LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY e.event_date DESC`;

    const events = db.prepare(query).all(...params);
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Ошибка получения событий' });
  }
});

// Получить конкретное событие
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const event = db.prepare(`
      SELECT e.*, u.name as creator_name, u.id as creator_id,
             (SELECT COUNT(*) FROM participants WHERE event_id = e.id) as participant_count
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `).get(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }

    let isParticipant = false;
    if (req.user) {
      const participation = db.prepare(`
        SELECT id FROM participants WHERE user_id = ? AND event_id = ?
      `).get(req.user.id, req.params.id);
      isParticipant = !!participation;
    }

    res.json({ ...event, isParticipant });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Ошибка получения события' });
  }
});

// Создать событие (Куратор, Админ)
router.post('/', authMiddleware, roleMiddleware('curator', 'admin'), upload.single('image'), (req, res) => {
  try {
    const { title, description, event_date, address } = req.body;

    if (!title || !description || !event_date || !address) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const result = db.prepare(`
      INSERT INTO events (title, description, event_date, address, image, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(title, description, event_date, address, imageUrl, req.user.id);

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
    res.json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Ошибка создания события' });
  }
});

// Обновить событие (Куратор, Админ)
router.put('/:id', authMiddleware, roleMiddleware('curator', 'admin'), upload.single('image'), (req, res) => {
  try {
    const { title, description, event_date, address, removeImage } = req.body;

    if (!title || !description || !event_date || !address) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    let imageUrl = null;
    
    // Если загрузили новое изображение
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
      
      // Удаляем старое изображение если есть
      const oldEvent = db.prepare('SELECT image FROM events WHERE id = ?').get(req.params.id);
      if (oldEvent && oldEvent.image) {
        const oldImagePath = path.join(__dirname, '..', oldEvent.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    } else if (removeImage === 'true') {
      // Если запросили удаление изображения
      const oldEvent = db.prepare('SELECT image FROM events WHERE id = ?').get(req.params.id);
      if (oldEvent && oldEvent.image) {
        const oldImagePath = path.join(__dirname, '..', oldEvent.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imageUrl = null;
    } else {
      // Оставляем старое изображение
      const oldEvent = db.prepare('SELECT image FROM events WHERE id = ?').get(req.params.id);
      imageUrl = oldEvent ? oldEvent.image : null;
    }

    db.prepare(`
      UPDATE events
      SET title = ?, description = ?, event_date = ?, address = ?, image = ?
      WHERE id = ?
    `).run(title, description, event_date, address, imageUrl, req.params.id);

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Ошибка обновления события' });
  }
});

// Удалить событие (Админ)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    // Получаем изображение для удаления
    const event = db.prepare('SELECT image FROM events WHERE id = ?').get(req.params.id);
    
    if (event && event.image) {
      const imagePath = path.join(__dirname, '..', event.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    db.prepare('DELETE FROM participants WHERE event_id = ?').run(req.params.id);
    db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
    res.json({ message: 'Событие удалено' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Ошибка удаления события' });
  }
});

// Участвовать в событии (Участник)
router.post('/:id/participate', authMiddleware, roleMiddleware('participant'), (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    // Проверяем, существует ли событие
    const event = db.prepare('SELECT id FROM events WHERE id = ?').get(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }

    // Проверяем, не участвует ли уже
    const existing = db.prepare(`
      SELECT id FROM participants WHERE user_id = ? AND event_id = ?
    `).get(userId, eventId);

    if (existing) {
      return res.status(400).json({ error: 'Вы уже участвуете в этом событии' });
    }

    db.prepare(`
      INSERT INTO participants (user_id, event_id)
      VALUES (?, ?)
    `).run(userId, eventId);

    res.json({ message: 'Вы успешно записались на событие' });
  } catch (error) {
    console.error('Participate error:', error);
    res.status(500).json({ error: 'Ошибка записи на событие' });
  }
});

// Отменить участие (Участник)
router.delete('/:id/participate', authMiddleware, roleMiddleware('participant'), (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    db.prepare(`
      DELETE FROM participants WHERE user_id = ? AND event_id = ?
    `).run(userId, eventId);

    res.json({ message: 'Участие отменено' });
  } catch (error) {
    console.error('Cancel participation error:', error);
    res.status(500).json({ error: 'Ошибка отмены участия' });
  }
});

// Получить участников события (Куратор, Админ)
router.get('/:id/participants', authMiddleware, roleMiddleware('curator', 'admin'), (req, res) => {
  try {
    const participants = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.role, p.joined_at
      FROM participants p
      JOIN users u ON p.user_id = u.id
      WHERE p.event_id = ?
      ORDER BY p.joined_at DESC
    `).all(req.params.id);

    res.json(participants);
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({ error: 'Ошибка получения участников' });
  }
});

module.exports = router;
