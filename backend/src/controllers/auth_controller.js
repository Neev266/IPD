import { registerUser, findUserByEmail, verifyPassword, generateToken } from "../services/auth_service.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const signup = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return errorResponse(res, "Email and password are required.", null, 400);
  }

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return errorResponse(res, "Email is already in use.", null, 400);
    }

    const newUser = await registerUser(email, password);
    const token = generateToken(newUser.id, newUser.email);

    return successResponse(
      res,
      {
        user: { id: newUser.id, email: newUser.email },
        token,
      },
      "User registered successfully",
      201
    );
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return errorResponse(res, "Email and password are required.", null, 400);
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return errorResponse(res, "Invalid email or password.", null, 401);
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return errorResponse(res, "Invalid email or password.", null, 401);
    }

    const token = generateToken(user.id, user.email);

    return successResponse(
      res,
      {
        user: { id: user.id, email: user.email },
        token,
      },
      "Logged in successfully"
    );
  } catch (err) {
    next(err);
  }
};
