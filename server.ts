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

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    full_name TEXT,
    role TEXT,
    class_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const insertUser = db.prepare("INSERT INTO users (id, username, password, full_name, role, class_id) VALUES (?, ?, ?, ?, ?, ?)");
  insertUser.run("admin", "admin", "admin123", "Giáo Viên Quản Trị", "teacher", "1A3");

  // Nạp sẵn danh sách học sinh mẫu vào DB
  const sampleStudents = [
    { id: "hs01", name: "Hà Tâm An" },
    { id: "hs02", name: "Vũ Ngọc Khánh An" },
    { id: "hs03", name: "Hoàng Diệu Anh" },
    { id: "hs04", name: "Quàng Tuấn Anh" },
    { id: "hs05", name: "Lê Bảo Châu" }
  ];

  sampleStudents.forEach(s => {
    insertUser.run(s.id, s.id, "", s.name, "student", "1A3");
  });

  // Nạp sẵn 1 tài khoản phụ huynh mẫu
  insertUser.run("phuhuynh01", "parent", "123456", "Phụ Huynh Bé An", "parent", "1A3");

  console.log("Seeded default users (Teacher: admin/admin123, Students: hs01-hs05)");
}

// Đảm bảo tài khoản Phụ huynh mẫu luôn tồn tại
const parentExists = db.prepare("SELECT id FROM users WHERE username = 'parent'").get();
if (!parentExists) {
  const insertUser = db.prepare("INSERT INTO users (id, username, password, full_name, role, class_id) VALUES (?, ?, ?, ?, ?, ?)");
  insertUser.run("phuhuynh01", "parent", "123456", "Phụ Huynh Bé An", "parent", "1A3");
  console.log("Created sample parent account: parent / 123456");
}

// Cập nhật tất cả học sinh đã có để mật khẩu là trống (để HS đăng nhập nhanh bằng cách chọn tên)
db.prepare("UPDATE users SET password = '' WHERE role = 'student' AND password = '123'").run();

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

  // API Authentication
  // Thêm handler cho GET /api/auth để hỗ trợ kiểm tra seed trên Localhost
  app.get("/api/auth", (req, res) => {
    if (req.query.seed) {
      return res.json({
        success: true,
        message: "Localhost (SQLite): Dữ liệu đã được khởi tạo tự động khi khởi động server.",
        results: {
          admin: "exists",
          parent: "exists",
          students: "exists (managed by SQLite)"
        }
      });
    }
    res.status(405).json({ error: "Method not allowed" });
  });

  app.post("/api/auth", (req, res) => {
    const { action, username, password, fullName, role, classId } = req.body;

    if (action === "register") {
      try {
        const id = Date.now().toString();
        const insert = db.prepare("INSERT INTO users (id, username, password, full_name, role, class_id) VALUES (?, ?, ?, ?, ?, ?)");
        insert.run(id, username, password, fullName, role || "student", classId || "1A3");
        res.status(201).json({ success: true, user: { id, username, fullName, role: role || "student" } });
      } catch (e: any) {
        if (e.message.includes("UNIQUE constraint failed")) {
          res.status(400).json({ error: "Tài khoản đã tồn tại" });
        } else {
          res.status(500).json({ error: "Lỗi đăng ký: " + e.message });
        }
      }
    } else if (action === "login") {
      const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
      if (user) {
        res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            fullName: user.full_name,
            role: user.role,
            classId: user.classId
          }
        });
      } else {
        res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" });
      }
    }
  });

  app.get("/api/auth/students", (req, res) => {
    const { classId } = req.query;
    const students = db.prepare("SELECT id, full_name as fullName, username, role FROM users WHERE class_id = ? AND role = 'student'").all(classId || "1A3");
    res.json(students);
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
