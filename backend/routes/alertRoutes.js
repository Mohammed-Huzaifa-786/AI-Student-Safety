import express from "express";
import auth from "../middleware/auth.js";
import { createAlert, getAllAlerts, smsStatusCallback } from "../controllers/alertController.js";

const router = express.Router();

// Protected: create alert
router.post("/create", auth, createAlert);

// Protected: list alerts (requires auth)
router.get("/", auth, getAllAlerts);

// Twilio delivery status callback (POST, x-www-form-urlencoded)
router.post("/sms-status", express.urlencoded({ extended: false }), smsStatusCallback);

// Debug test route
router.get("/test", (req, res) => {
  res.send("✅ Alert route working perfectly!");
});

export default router;
