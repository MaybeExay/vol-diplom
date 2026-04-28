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
    cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
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

// Получить все посты
router.get('/', optionalAuth, (req, res) => {
  try {
    const posts = db.prepare(`
      SELECT p.*, u.name as author_name, u.role as author_role
      FROM posts p
      JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
    `).all();

    // Преобразуем JSON строки изображений в массивы URL
    posts.forEach(post => {
      if (post.images) {
        try {
          post.images = typeof post.images === 'string' ? JSON.parse(post.images) : post.images;
        } catch (e) {
          post.images = [];
        }
      }
    });

    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Ошибка получения постов' });
  }
});

// Создать пост (Куратор, Админ)
router.post('/', authMiddleware, roleMiddleware('curator', 'admin'), upload.array('images', 3), (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Заголовок и контент обязательны' });
    }

    // Получаем URL загруженных изображений
    const imageUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const result = db.prepare(`
      INSERT INTO posts (title, content, images, created_by)
      VALUES (?, ?, ?, ?)
    `).run(title, content, imageUrls.length > 0 ? JSON.stringify(imageUrls) : null, req.user.id);

    const post = db.prepare(`
      SELECT p.*, u.name as author_name, u.role as author_role
      FROM posts p
      JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `).get(result.lastInsertRowid);

    if (post.images) {
      try {
        post.images = JSON.parse(post.images);
      } catch (e) {}
    }

    res.json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Ошибка создания поста' });
  }
});

// Обновить пост (Админ)
router.put('/:id', authMiddleware, roleMiddleware('admin'), upload.array('images', 3), (req, res) => {
  try {
    const { title, content, existingImages, removeImages } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Заголовок и контент обязательны' });
    }

    // Получаем существующие изображения
    let imageUrls = existingImages ? (typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages) : [];

    // Удаляем указанные изображения
    if (removeImages) {
      const toRemove = typeof removeImages === 'string' ? JSON.parse(removeImages) : removeImages;
      toRemove.forEach(index => {
        const imgPath = path.join(__dirname, '..', imageUrls[index]);
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
        }
      });
      imageUrls = imageUrls.filter((_, i) => !toRemove.includes(i));
    }

    // Добавляем новые изображения
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      imageUrls = [...imageUrls, ...newImages];
    }

    // Ограничиваем до 3 изображений
    imageUrls = imageUrls.slice(0, 3);

    db.prepare(`
      UPDATE posts
      SET title = ?, content = ?, images = ?
      WHERE id = ?
    `).run(title, content, imageUrls.length > 0 ? JSON.stringify(imageUrls) : null, req.params.id);

    const post = db.prepare(`
      SELECT p.*, u.name as author_name, u.role as author_role
      FROM posts p
      JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (post.images) {
      try {
        post.images = JSON.parse(post.images);
      } catch (e) {}
    }

    res.json(post);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Ошибка обновления поста' });
  }
});

// Удалить пост (Админ)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    // Получаем изображения для удаления
    const post = db.prepare('SELECT images FROM posts WHERE id = ?').get(req.params.id);
    
    if (post && post.images) {
      try {
        const images = typeof post.images === 'string' ? JSON.parse(post.images) : post.images;
        images.forEach(imgPath => {
          const fullPath = path.join(__dirname, '..', imgPath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        });
      } catch (e) {}
    }

    db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
    res.json({ message: 'Пост удален' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Ошибка удаления поста' });
  }
});

module.exports = router;
