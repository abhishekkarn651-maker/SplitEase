const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * User Schema
 * -----------
 * Represents an authenticated user of the application.
 *
 * Fields:
 *  - name:     Display name
 *  - email:    Unique email (used for login)
 *  - password: Hashed password (excluded from queries by default)
 *
 * Timestamps adds createdAt and updatedAt automatically.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't include password in queries by default
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save middleware:
 * Hash the password before saving, but only if it was modified.
 * This prevents re-hashing when updating other fields like name.
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Instance method:
 * Compare an entered plaintext password against the stored hash.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
