import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("learning.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    points INTEGER DEFAULT 0,
    lessons_completed INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS user_progress (
    user_id TEXT PRIMARY KEY,
    data TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Add some mock data if empty
const count = db.prepare("SELECT COUNT(*) as count FROM leaderboard").get() as { count: number };
if (count.count === 0) {
  const insert = db.prepare("INSERT INTO leaderboard (username, points, lessons_completed) VALUES (?, ?, ?)");
  insert.run("Bé Na", 1200, 15);
  insert.run("Bé Tí", 950, 12);
  insert.run("Bé Gấu", 800, 10);
  insert.run("Bé Thỏ", 600, 8);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/leaderboard", (req, res) => {
    const players = db.prepare("SELECT username, points, lessons_completed FROM leaderboard ORDER BY points DESC LIMIT 10").all();
    res.json(players);
  });

  app.post("/api/leaderboard/update", (req, res) => {
    const { username, points, lessonsCompleted } = req.body;
    if (!username) return res.status(400).json({ error: "Username required" });

    const upsert = db.prepare(`
      INSERT INTO leaderboard (username, points, lessons_completed, last_updated)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(username) DO UPDATE SET
        points = MAX(points, excluded.points),
        lessons_completed = MAX(lessons_completed, excluded.lessons_completed),
        last_updated = CURRENT_TIMESTAMP
    `);

    upsert.run(username, points, lessonsCompleted);
    res.json({ success: true });
  });

  // API tiến độ học tập (Cloud Sync)
  app.get("/api/progress", (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const row = db.prepare("SELECT data FROM user_progress WHERE user_id = ?").get(userId) as { data: string };
    if (row) {
      res.json(JSON.parse(row.data));
    } else {
      res.status(404).json({ error: "Progress not found" });
    }
  });

  app.post("/api/progress", (req, res) => {
    const { userId, ...progressData } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const upsert = db.prepare(`
      INSERT INTO user_progress (user_id, data, last_updated)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        data = excluded.data,
        last_updated = CURRENT_TIMESTAMP
    `);

    upsert.run(userId, JSON.stringify(progressData));
    res.json({ success: true });
  });

  // API nghe lại bài đọc học sinh
  app.get("/api/audio/:recordingId", (req, res) => {
    const { recordingId } = req.params;
    // Lấy Cloud Name từ .env hoặc dùng mặc định đã cấu hình trong dự án
    const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || "dx8v9vuxo";

    if (!cloudName) {
      return res.status(500).json({ error: "Cloudinary Cloud Name chưa được cấu hình trên server." });
    }

    // Chuyển hướng tới URL audio trên Cloudinary
    // Cloudinary tự động xử lý đuôi file nếu public_id đúng
    const audioUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${recordingId}`;
    res.redirect(audioUrl);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
