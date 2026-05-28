const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// ========================================
// Initialize Express App
// ========================================
const app = express();

// ========================================
// Middleware
// ========================================

// Enable CORS so the React frontend (on a different port) can talk to this API
app.use(cors({
  origin: "*",
  credentials: true
}));

// Parse incoming JSON request bodies
app.use(express.json());

// HTTP request logger — helpful during development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ========================================
// API Routes (will be added in Step 2)
// ========================================
app.get("/", (req, res) => {
  res.send("SplitEase Backend Running 🚀");
});

// Health check endpoint — useful for testing if the server is alive
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SplitEase API is running 🚀",
    timestamp: new Date().toISOString(),
  });
});

// API route handlers
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/groups", require("./routes/groupRoutes"));
app.use("/api/expenses", require("./routes/expenseRoutes"));
app.use("/api/invitations", require("./routes/invitationRoutes"));
app.use("/api/community", require("./routes/communityRoutes"));

// ========================================
// Error Handling Middleware
// ========================================

// Catch 404 (route not found) and forward to error handler
app.use(notFound);

// Central error handler — must be the LAST middleware
app.use(errorHandler);

// ========================================
// Start Server
// ========================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to MongoDB first, then start listening
  await connectDB();

  // Run DB migration check
  try {
    const runMigration = require("./utils/migration");
    await runMigration();
  } catch (err) {
    console.error("Migration failed:", err);
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 SplitEase Server running on http://localhost:${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || "production"}\n`);
  });
};

startServer();
