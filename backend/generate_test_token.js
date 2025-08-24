#!/usr/bin/env node

const jwt = require("jsonwebtoken");

// Use the same secret as the backend
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

// Create a test user payload
const payload = {
  userId: "test-user-id",
  email: "test@caregrid.com",
};

// Generate token
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

console.log("Test JWT Token:");
console.log(token);
console.log("\nUse this token in Authorization header as:");
console.log(`Bearer ${token}`);
