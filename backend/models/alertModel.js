import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },

    // ALERT LOCATION
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },

    // MAIN ALERT MESSAGE
    message: { type: String, required: true },

    // SMS SENDING METADATA
    sms: {
      sid: { type: String },
      status: { type: String },
      to: { type: String },
      from: { type: String },
      errorCode: { type: Number },
      errorMessage: { type: String },
      updatedAt: { type: Date },
      fallbackSent: { type: Boolean, default: false }, // Small fallback SMS sent?
    },
  },
  { timestamps: true }
);

const Alert = mongoose.model("Alert", alertSchema);
export default Alert;
