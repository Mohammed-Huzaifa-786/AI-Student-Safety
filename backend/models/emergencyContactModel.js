import mongoose from "mongoose";

const emergencyContactSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { timestamps: true }
);

const EmergencyContact = mongoose.model("EmergencyContact", emergencyContactSchema);
export default EmergencyContact;
