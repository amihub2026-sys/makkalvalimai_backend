
const mongoose = require("mongoose");

exports.connect = async (uri) => {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });

    console.log("✅ MongoDB connected successfully");
    console.log("Database:", mongoose.connection.name);
  } catch (error) {
    console.error("❌ MongoDB connection failed");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    if (error.reason?.servers) {
      for (const [server, details] of error.reason.servers) {
        console.error("Server:", server);
        console.error("Reason:", details.error?.message || details.type);
      }
    }

    throw error;
  }
};
