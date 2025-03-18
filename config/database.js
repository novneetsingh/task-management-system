// Importing mongoose module
const mongoose = require("mongoose");

// Function to connect to the database
exports.dbconnect = async () => {
  try {
    // Connecting to the database using the URL from environment variables
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Database connection established");
  } catch (error) {
    // Logging any connection issues and exiting the process with failure code
    console.error("Connection issues with the database:", error);
    process.exit(1);
  }
};