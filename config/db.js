//M-Safe\backend\config\db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI is missing in environment variables");
      return;
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
  console.error("❌ MongoDB Error:", error.message);
  process.exit(1);
}
};

module.exports = connectDB;