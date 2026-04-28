const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();


router.get('/', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, email, name, role, phone, bio, avatar, created_at
      FROM users
      ORDER BY created_at DESC
    `).all();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Ошибка получения пользователей' });
  }
});


router.get('/:id', (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, email, name, role, phone, bio, avatar, created_at
      FROM users
      WHERE id = ?
    `).get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Ошибка получения пользователя' });
  }
});


router.put('/me', authMiddleware, (req, res) => {
  try {
    const { name, phone, bio } = req.body;
    const userId = req.user.id;

    db.prepare(`
      UPDATE users
      SET name = ?, phone = ?, bio = ?
      WHERE id = ?
    `).run(name, phone, bio, userId);

    const updatedUser = db.prepare(`
      SELECT id, email, name, role, phone, bio, avatar
      FROM users
      WHERE id = ?
    `).get(userId);

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Ошибка обновления профиля' });
  }
});


router.put('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const { name, phone, bio, role, avatar } = req.body;
    const userId = req.params.id;

    db.prepare(`
      UPDATE users
      SET name = ?, phone = ?, bio = ?, role = ?, avatar = ?
      WHERE id = ?
    `).run(name, phone, bio, role, avatar, userId);

    const updatedUser = db.prepare(`
      SELECT id, email, name, role, phone, bio, avatar
      FROM users
      WHERE id = ?
    `).get(userId);

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Ошибка обновления пользователя' });
  }
});


router.delete('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const userId = req.params.id;


    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'Нельзя удалить свой аккаунт' });
    }

    db.prepare('DELETE FROM participants WHERE user_id = ?').run(userId);

    db.prepare('DELETE FROM posts WHERE created_by = ?').run(userId);

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    res.json({ message: 'Пользователь удален' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Ошибка удаления пользователя' });
  }
});

module.exports = router;
