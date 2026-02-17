import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export default function auth(req, res, next) {
  try {
    const header = req.headers.authorization || req.headers.Authorization || '';
    const token = header && header.split && header.startsWith('Bearer ') ? header.split(' ')[1] : null;
    if (!token) return res.status(401).json({ success: false, error: "No token" });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.id;
      return next();
    } catch (e) {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }
  } catch (err) {
    console.error('authMiddleware error', err?.message || err);
    return res.status(500).json({ success: false, error: 'Auth middleware failure' });
  }
}
