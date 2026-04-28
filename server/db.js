const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'volunteers.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'participant' CHECK(role IN ('participant', 'curator', 'admin')),
    avatar TEXT,
    phone TEXT,
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    event_date DATETIME NOT NULL,
    address TEXT NOT NULL,
    image TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    images TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id),
    UNIQUE(user_id, event_id)
  );

  -- Создаем индекс для фильтрации событий
  CREATE INDEX IF NOT EXISTS idx_event_date ON events(event_date);
`);

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (email, password, name, role)
    VALUES ('admin@vol.ru', ?, 'Администратор', 'admin')
  `).run(hashedPassword);

  const curatorPassword = bcrypt.hashSync('curator123', 10);
  db.prepare(`
    INSERT INTO users (email, password, name, role)
    VALUES ('curator@vol.ru', ?, 'Куратор', 'curator')
  `).run(curatorPassword);

  const participantPassword = bcrypt.hashSync('user123', 10);
  db.prepare(`
    INSERT INTO users (email, password, name, role)
    VALUES ('user@vol.ru', ?, 'Участник', 'participant')
  `).run(participantPassword);
}

module.exports = db;
