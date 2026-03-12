import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { User, Progress } from "./src/data/models.ts"; // Import models vừa tạo

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Kết nối MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/tieng-viet-1";

mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Hàm khởi tạo dữ liệu mẫu (Seed)
async function seedDatabase() {
  try {
    const adminExists = await User.findOne({ username: "admin" });
    if (!adminExists) {
      await User.create({
        id: "admin",
        username: "admin",
        password: "admin123",
        fullName: "Giáo Viên Quản Trị",
        role: "teacher",
        classId: "1A3"
      });
      console.log("Created admin user");
    }

    const parentExists = await User.findOne({ username: "parent" });
    if (!parentExists) {
      await User.create({
        id: "phuhuynh01",
        username: "parent",
        password: "123456",
        fullName: "Phụ Huynh Bé An",
        role: "parent",
        classId: "1A3"
      });
      console.log("Created parent user");
    }

    const studentCount = await User.countDocuments({ role: "student" });
    if (studentCount === 0) {
      const sampleStudents = [
        { id: "hs01", name: "Hà Tâm An" },
        { id: "hs02", name: "Vũ Ngọc Khánh An" },
        { id: "hs03", name: "Hoàng Diệu Anh" },
        { id: "hs04", name: "Quàng Tuấn Anh" },
        { id: "hs05", name: "Lê Bảo Châu" }
      ];

      for (const s of sampleStudents) {
        await User.create({
          id: s.id,
          username: s.id,
          password: "",
          fullName: s.name,
          role: "student",
          classId: "1A3"
        });
      }
      console.log("Seeded sample students");
    }
  } catch (error) {
    console.error("Seeding error:", error);
  }
}

seedDatabase();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3002; // Đổi sang 3002 để tránh lỗi cổng 3001 đang bận

  app.use(express.json());

  // API routes
  app.get("/api/leaderboard", async (req, res) => {
    try {
      // Lấy top 10 người dùng có điểm cao nhất từ bảng Progress
      // ProgressSchema không có field 'role', không filter theo role
      const players = await Progress.find({}).sort({ points: -1 }).limit(10);
      const formatted = players.map((p: any) => ({
        username: p.username,
        points: p.points,
        lessons_completed: (p.completedLessons || []).length
      }));
      res.json(formatted);
    } catch (err: any) {
      console.error('Leaderboard error:', err.message);
      res.status(500).json({ error: 'Lỗi lấy bảng xếp hạng' });
    }
  });

  // API Lessons Management
  app.get("/api/lessons", async (req, res) => {
    try {
      const { Lesson } = await import('./src/data/models.js');
      const { lessons: initialLessons } = await import('./src/data/lessons.js');
      let dbLessons = await Lesson.find({}).sort({ id: 1 });
      if (dbLessons.length === 0) {
        console.log("Seeding initial lessons to DB...");
        await Lesson.insertMany(initialLessons);
        dbLessons = await Lesson.find({}).sort({ id: 1 });
      }
      res.json(dbLessons);
    } catch (err: any) {
      console.error('Lessons fetch error:', err.message);
      res.status(500).json({ error: 'Lỗi tải bài học' });
    }
  });

  app.post("/api/lessons", async (req, res) => {
    try {
      const { Lesson } = await import('./src/data/models.js');
      const { id, updates } = req.body;
      const updatedLesson = await Lesson.findOneAndUpdate(
        { id },
        { ...updates, updatedAt: new Date() },
        { new: true, upsert: true }
      );
      res.json(updatedLesson);
    } catch (err: any) {
      res.status(500).json({ error: 'Lỗi cập nhật bài học' });
    }
  });

  // API /api/leaderboard/update không cần thiết nữa vì ta lưu trực tiếp vào Progress

  // API tiến độ học tập (Cloud Sync)
  app.get("/api/progress", async (req, res) => {
    const { userId, userIds } = req.query;

    // Bulk fetch by comma-separated userIds (dành cho view giáo viên)
    if (userIds) {
      try {
        const ids = String(userIds).split(',').map(s => s.trim()).filter(Boolean);
        const progresses = await Progress.find({ userId: { $in: ids } });
        return res.json(progresses.map(p => p.toObject()));
      } catch (err: any) {
        console.error('Progress bulk fetch error:', err.message);
        return res.status(500).json({ error: 'Lỗi lấy dữ liệu tiến độ (bulk)' });
      }
    }

    if (!userId) return res.status(400).json({ error: "userId required" });

    try {
      const progress = await Progress.findOne({ userId });
      if (progress) {
        // Trả về toàn bộ object tiến độ
        res.json(progress.toObject());
      } else {
        res.status(404).json({ error: "Progress not found" });
      }
    } catch (err: any) {
      console.error('Progress fetch error:', err.message);
      res.status(500).json({ error: 'Lỗi lấy dữ liệu tiến độ' });
    }
  });

  app.post("/api/progress", async (req, res) => {
    const { userId, ...progressData } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    // Cập nhật hoặc tạo mới progress
    try {
      const updated = await Progress.findOneAndUpdate(
        { userId },
        {
          userId,
          username: progressData.username,
          role: 'student', // Mặc định là student
          data: progressData,
          points: progressData.points || 0,
          completedLessons: progressData.completedLessons || [],
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );

      console.log(`[Progress] Saved for userId=${userId} points=${progressData.points || 0} lessons=${(progressData.completedLessons || []).length}`);
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      console.error('Progress save error:', err.message);
      return res.status(500).json({ error: 'Lỗi lưu tiến độ' });
    }
  });

  // API Authentication
  app.get("/api/auth", (req, res) => {
    if (req.query.seed) {
      seedDatabase();
      return res.json({
        success: true,
        message: "Localhost (MongoDB): Đã kích hoạt seed dữ liệu."
      });
    }
    res.status(405).json({ error: "Method not allowed" });
  });

  app.post("/api/auth", async (req, res) => {
    const { action, username, password, fullName, role, classId } = req.body;

    if (action === "register") {
      try {
        const id = Date.now().toString();
        await User.create({
          id,
          username,
          password,
          fullName,
          role: role || "student",
          classId: classId || "1A3"
        });
        res.status(201).json({ success: true, user: { id, username, fullName, role: role || "student" } });
      } catch (e: any) {
        if (e.code === 11000) { // Duplicate key error code in Mongo
          res.status(400).json({ error: "Tài khoản đã tồn tại" });
        } else {
          res.status(500).json({ error: "Lỗi đăng ký: " + e.message });
        }
      }
    } else if (action === "login") {
      console.log(`Login attempt: ${username} / ${password}`);
      const user = await User.findOne({ username, password: password || "" });

      if (user) {
        res.json({
          success: true,
          user: {
            id: user._id,
            username: user.username,
            fullName: user.fullName,   // Mongoose schema field
            role: user.role,
            classId: user.classId     // Mongoose schema field
          }
        });
      } else {
        res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" });
      }
    }
  });

  app.get("/api/auth/students", async (req, res) => {
    const { classId } = req.query;
    try {
      const students = await User.find({ classId: classId || "1A3", role: "student" });
      res.json(students);
    } catch (error: any) {
      console.error("Lỗi lấy danh sách học sinh:", error.message);
      res.status(500).json({ error: "Lỗi cơ sở dữ liệu." });
    }
  });

  // API nghe lại bài đọc học sinh (proxy audio từ Cloudinary để tránh vấn đề CORS trên webview/mobile)
  app.get("/api/audio/:recordingId", async (req, res) => {
    const { recordingId } = req.params;
    const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || "dx8v9vuxo";

    if (!cloudName) {
      return res.status(500).json({ error: "Cloudinary Cloud Name chưa được cấu hình trên server." });
    }

    const audioUrl = `https://res.cloudinary.com/${cloudName}/video/upload/f_auto/${recordingId}.mp3`;
    console.log(`[Audio Request] Proxying ${recordingId} from ${audioUrl} (range: ${req.headers.range || 'none'})`);

    try {
      // Forward Range header if present so cloud provider can respond with partial content
      const headers: Record<string, string> = {};
      if (req.headers.range) headers['Range'] = String(req.headers.range);

      const fetchRes = await fetch(audioUrl, { headers });
      if (!fetchRes.ok) {
        return res.status(502).json({ error: 'Failed to fetch from cloud provider' });
      }

      const contentType = fetchRes.headers.get('content-type') || 'audio/mpeg';
      const contentLength = fetchRes.headers.get('content-length');
      const acceptRanges = fetchRes.headers.get('accept-ranges') || 'bytes';
      const contentRange = fetchRes.headers.get('content-range');

      // Allow cross-origin playback and expose range headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Accept-Ranges, Content-Range');
      res.setHeader('Content-Type', contentType);
      if (contentLength) res.setHeader('Content-Length', contentLength);
      res.setHeader('Accept-Ranges', acceptRanges);
      if (contentRange) res.setHeader('Content-Range', contentRange);

      const arrayBuffer = await fetchRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Use the same status code returned by the cloud (206 for partial content)
      res.status(fetchRes.status).send(buffer);
    } catch (err) {
      console.error('[Audio] Proxy error:', err);
      res.status(500).json({ error: 'Internal server error while proxying audio' });
    }
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
