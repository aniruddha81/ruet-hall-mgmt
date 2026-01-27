import bcrypt from "bcrypt";
import { and, desc, eq, isNull } from "drizzle-orm";
import type { CookieOptions, Request, Response } from "express";
import { NODE_ENV } from "../Constants.ts";
import { db } from "../db/index.ts";
import { refreshTokens, users } from "../db/models/index.ts";
import {
  getRefreshTokenExpiry,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../services/auth.service.ts";
import type { RefreshTokenPayload } from "../types/auth";
import { ApiError } from "../utils/ApiError.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { createJti, hashToken } from "../utils/helpers.ts";

const options: CookieOptions = {
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: "strict",
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [newUser] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      name,
      role: "STUDENT",
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

  const jti = createJti();
  const refreshToken = signRefreshToken({ ...tokenPayload, jti });

  await db.insert(refreshTokens).values({
    jti,
    userId: newUser.id,
    tokenHash: hashToken(refreshToken),
    ip: req.ip as string,
    userAgent: req.headers["user-agent"] || "",
    expiresAt: getRefreshTokenExpiry(),
  });

  return res
    .status(201)
    .cookie("accessToken", signAccessToken(tokenPayload), {
      ...options,
      maxAge: 15 * 60 * 1000,
    }) // 15 minutes
    .cookie("refreshToken", refreshToken, {
      ...options,
      maxAge: 10 * 24 * 60 * 60 * 1000,
    }) // 10 days
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

  const jti = createJti();
  const refreshToken = signRefreshToken({ ...tokenPayload, jti });

  // Check active token count for this user
  const activeTokens = await db
    .select()
    .from(refreshTokens)
    .where(
      and(eq(refreshTokens.userId, user.id), isNull(refreshTokens.revokedAt))
    );

  // If user has 2 or more active tokens, remove the oldest one
  if (activeTokens.length >= 2) {
    // Sort by createdAt and get the oldest
    const oldestToken = activeTokens.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    )[0]!;

    await db.delete(refreshTokens).where(eq(refreshTokens.id, oldestToken.id));
  }

  // Insert new refresh token
  await db.insert(refreshTokens).values({
    jti,
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    ip: String(req.ip),
    userAgent: req.headers["user-agent"] || "",
    expiresAt: getRefreshTokenExpiry(),
  });

  return res
    .status(200)
    .cookie("accessToken", signAccessToken(tokenPayload), {
      ...options,
      maxAge: 15 * 60 * 1000,
    }) // 15 minutes
    .cookie("refreshToken", refreshToken, {
      ...options,
      maxAge: 10 * 24 * 60 * 60 * 1000,
    }) // 10 days
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
        },
        "User logged in successfully"
      )
    );
});

export const renewAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    const incomingRefreshToken = req.cookies?.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(400, "Refresh token is required");
    }

    let decoded: RefreshTokenPayload;
    try {
      decoded = verifyRefreshToken(incomingRefreshToken);
    } catch {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const tokenHash = hashToken(incomingRefreshToken);

    const [tokenRecord] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.jti, decoded.jti),
          eq(refreshTokens.tokenHash, tokenHash)
        )
      )
      .limit(1);

    if (!tokenRecord) {
      throw new ApiError(401, "Refresh token not found");
    }

    if (tokenRecord.revokedAt) {
      throw new ApiError(401, "Refresh token has been revoked");
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new ApiError(401, "Refresh token has expired");
    }

    const tokenPayload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    const newAccessToken = signAccessToken(tokenPayload);

    return res
      .status(200)
      .cookie("accessToken", newAccessToken, {
        ...options,
        maxAge: 15 * 60 * 1000,
      })
      .json(
        new ApiResponse(
          200,
          { accessToken: newAccessToken },
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

  if (refreshToken) {
    const hashedToken = hashToken(refreshToken);

    const [doc] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, hashedToken))
      .limit(1);

    if (doc && !doc.revokedAt) {
      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.tokenHash, hashedToken));
    }
  }

  // // Delete refresh token from database
  // const [result] = await db
  //   .delete(refreshTokens)
  //   .where(eq(refreshTokens.tokenHash, hashToken(refreshToken)))
  //   .returning();

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

  // Revoke all refresh tokens for this user (preserve audit trail)
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.userId, userId));

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(200, null, "Logged out from all devices successfully")
    );
});

// Get active sessions
export const getActiveSessions = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const sessions = await db
      .select({
        id: refreshTokens.id,
        ip: refreshTokens.ip,
        userAgent: refreshTokens.userAgent,
        createdAt: refreshTokens.createdAt,
        expiresAt: refreshTokens.expiresAt,
      })
      .from(refreshTokens)
      .where(
        and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt))
      )
      .orderBy(desc(refreshTokens.createdAt));

    return res
      .status(200)
      .json(new ApiResponse(200, { sessions }, "Active sessions retrieved"));
  }
);

// Revoke specific session
export const revokeSession = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const sessionId = req.params.sessionId as string;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    // Verify session belongs to user
    const [session] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(eq(refreshTokens.id, sessionId), eq(refreshTokens.userId, userId))
      )
      .limit(1);

    if (!session) {
      throw new ApiError(404, "Session not found");
    }

    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, sessionId));

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Session revoked successfully"));
  }
);
