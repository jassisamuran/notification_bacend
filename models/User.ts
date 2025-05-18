import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      otp:{type:Boolean,default:true}
    },
  },
  { timestamps: true }
)
export default mongoose.model("User", userSchema)