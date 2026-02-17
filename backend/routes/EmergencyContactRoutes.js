import express from "express";
import auth from "../middleware/authMiddleware.js";
import controller from "../controllers/EmergencyContactController.js";

const router = express.Router();

router.post("/add", auth, controller.addEmergencyContact);
router.get("/", auth, controller.getEmergencyContacts);
router.delete("/:id", auth, controller.deleteEmergencyContact);

export default router;
