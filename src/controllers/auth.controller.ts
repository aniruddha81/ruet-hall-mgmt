import bcrypt from "bcrypt";
import { and, eq } from "drizzle-orm";
import type { CookieOptions, Request, Response } from "express";
import { NODE_ENV } from "../Constants.ts";
import { db } from "../db/index.ts";
import { refreshTokens, users } from "../db/schema/index.ts";
import { ApiError } from "../utils/ApiError.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import {
  generateAccessAndRefreshTokens,
  getRefreshTokenExpiry,
  verifyRefreshToken,
} from "../utils/auth.ts";
import type { TokenPayload } from "../types/auth";

const options: CookieOptions = {
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: "strict",
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role = "STUDENT" } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new ApiError(409, "User with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [newUser] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      name,
      role,
    })
    .returning();

  if (!newUser) {
    throw new ApiError(500, "Failed to create user");
  }

  const tokenPayload = {
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
  };

  const { accessToken, refreshToken } =
    generateAccessAndRefreshTokens(tokenPayload);

  await db.insert(refreshTokens).values({
    userId: newUser.id,
    token: refreshToken,
    expiresAt: getRefreshTokenExpiry(),
  });

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        201,
        {
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
          },
        },
        "User registered successfully"
      )
    );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new ApiError(401, "No user found with this email");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const { accessToken, refreshToken } =
    generateAccessAndRefreshTokens(tokenPayload);

  await db.insert(refreshTokens).values({
    userId: user.id,
    token: refreshToken,
    expiresAt: getRefreshTokenExpiry(),
  });

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    const incomingRefreshToken = req.cookies?.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(400, "Refresh token is required");
    }

    let decoded: TokenPayload;
    try {
      decoded = verifyRefreshToken(incomingRefreshToken);
    } catch {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const [tokenRecord] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.userId, decoded.userId),
          eq(refreshTokens.token, incomingRefreshToken)
        )
      )
      .limit(1);

    if (!tokenRecord || new Date() > tokenRecord.expiresAt) {
      if (tokenRecord) {
        await db
          .delete(refreshTokens)
          .where(eq(refreshTokens.id, tokenRecord.id));
      }
      throw new ApiError(401, "Refresh token has expired");
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      generateAccessAndRefreshTokens({
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      });

    return res
      .status(200)
      .cookie("accessToken", newAccessToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed"
        )
      );
  }
);

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new ApiError(400, "Refresh token is required");
  }

  // Delete refresh token from database
  const result = await db
    .delete(refreshTokens)
    .where(eq(refreshTokens.token, refreshToken))
    .returning();

  if (result.length === 0) {
    throw new ApiError(404, "Refresh token not found");
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// LOGOUT FROM ALL DEVICES
export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  // Delete all refresh tokens for this user
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(200, null, "Logged out from all devices successfully")
    );
});
