import { supabase } from "../config/supabase.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId, email) => {
  return jwt.sign({ id: userId, email }, env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

export const findUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (error) {
    console.error("Error finding user by email:", error);
    throw error;
  }
  return data;
};

export const registerUser = async (email, password) => {
  const hashedPassword = await hashPassword(password);
  const normalizedEmail = email.toLowerCase().trim();

  // Create the record in our custom users table
  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        email: normalizedEmail,
        password: hashedPassword,
      },
    ])
    .select();

  if (error) {
    if (error.code === "23505") { // Unique violation code in Postgres
      throw new Error("Email is already registered.");
    }
    console.error("Error creating user:", error);
    throw error;
  }

  return data[0];
};
