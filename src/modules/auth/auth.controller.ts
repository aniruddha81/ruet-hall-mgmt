import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import type { CookieOptions, Request, Response } from "express";
import { NODE_ENV } from "../../Constants.ts";
import { db } from "../../db/index.ts";
import {
  hallAdmins,
  hallStudents,
  refreshTokens,
  users,
} from "../../db/models/index.ts";
import { ApiError } from "../../utils/ApiError.ts";
import { ApiResponse } from "../../utils/ApiResponse.ts";
import { asyncHandler } from "../../utils/asyncHandler.ts";
import { createJti, hashToken } from "../../utils/helpers.ts";
import type { AccessTokenPayload, RefreshTokenPayload } from "./auth.d.ts";
import {
  getRefreshTokenExpiry,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./auth.service.ts";

const options: CookieOptions = {
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: "strict",
};

const studentCookiePath = "/api/v1/auth";
const adminCookiePath = "/api/v1/auth";

/**
 * POST /api/v1/auth/register
 * Register a new student account
 */
export const studentRegister = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      name,
      email,
      password,
      rollNumber,
      academicDepartment,
      session,
      phone,
    } = req.body;

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      throw new ApiError(409, "User with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    await db.insert(users).values({
      id: userId,
      email,
      passwordHash,
      name,
      phone,
      academicDepartment,
      role: "STUDENT",
    });

    await db.insert(hallStudents).values({
      id: randomUUID(),
      userId,
      rollNumber,
      session,
      status: "ACTIVE",
    });

    const [newUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!newUser) {
      throw new ApiError(500, "Failed to create user");
    }

    const tokenPayload: AccessTokenPayload = {
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    };

    const jti = createJti();
    const refreshToken = signRefreshToken({ ...tokenPayload, jti });

    await db.insert(refreshTokens).values({
      id: randomUUID(),
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
        path: studentCookiePath,
      })
      .cookie("refreshToken", refreshToken, {
        ...options,
        maxAge: 10 * 24 * 60 * 60 * 1000,
        path: studentCookiePath,
      })
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
  }
);

/**
 * POST /api/v1/auth/login
 * Login a student with email and password
 */
export const studentLogin = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

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

    // Fetch student record from students table
    const [studentRecord] = await db
      .select()
      .from(hallStudents)
      .where(eq(hallStudents.userId, user.id))
      .limit(1);

    if (!studentRecord) {
      throw new ApiError(401, "Student record not found for this user");
    }

    const tokenPayload: AccessTokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const activeTokens = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, user.id))
      .orderBy(desc(refreshTokens.createdAt));

    if (activeTokens.length >= 2) {
      const oldestToken = activeTokens.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      )[0]!;

      await db
        .delete(refreshTokens)
        .where(eq(refreshTokens.id, oldestToken.id));
    }

    const jti = createJti();
    const refreshToken = signRefreshToken({ ...tokenPayload, jti });

    await db.insert(refreshTokens).values({
      id: randomUUID(),
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
        path: studentCookiePath,
      })
      .cookie("refreshToken", refreshToken, {
        ...options,
        maxAge: 10 * 24 * 60 * 60 * 1000,
        path: studentCookiePath,
      })
      .json(
        new ApiResponse(
          200,
          {
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              phone: user.phone,
              academicDepartment: user.academicDepartment,
            },
            student: {
              id: studentRecord.id,
              rollNumber: studentRecord.rollNumber,
              session: studentRecord.session,
              hall: studentRecord.hall,
              roomId: studentRecord.roomId,
              status: studentRecord.status,
            },
          },
          "User logged in successfully"
        )
      );
  }
);

/**
 * POST /api/v1/auth/admin/register
 * Register a new admin account with hall assignment
 */
export const adminRegister = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      name,
      email,
      password,
      academicDepartment,
      hall,
      designation,
      operationalUnit,
      phone,
    } = req.body;

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      throw new ApiError(409, "User with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    await db.insert(users).values({
      id: userId,
      email,
      passwordHash,
      name,
      phone,
      academicDepartment,
      role: designation,
    });

    await db.insert(hallAdmins).values({
      id: randomUUID(),
      userId,
      hall,
      designation,
      operationalUnit,
      isActive: true,
    });

    const [newUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!newUser) {
      throw new ApiError(500, "Failed to create user");
    }

    const tokenPayload: AccessTokenPayload = {
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    };

    const jti = createJti();
    const refreshToken = signRefreshToken({ ...tokenPayload, jti });

    await db.insert(refreshTokens).values({
      id: randomUUID(),
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
        path: adminCookiePath,
      })
      .cookie("refreshToken", refreshToken, {
        ...options,
        maxAge: 10 * 24 * 60 * 60 * 1000,
        path: adminCookiePath,
      })
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
          "Admin registered successfully"
        )
      );
  }
);

export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

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

  // Fetch admin record from admins table
  const [adminRecord] = await db
    .select()
    .from(hallAdmins)
    .where(eq(hallAdmins.userId, user.id))
    .limit(1);

  if (!adminRecord) {
    throw new ApiError(401, "Admin record not found for this user");
  }

  if (!adminRecord.isActive) {
    throw new ApiError(403, "Admin account is deactivated");
  }

  const tokenPayload: AccessTokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const activeTokens = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.userId, user.id))
    .orderBy(desc(refreshTokens.createdAt));

  if (activeTokens.length >= 2) {
    const oldestToken = activeTokens.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    )[0]!;

    await db.delete(refreshTokens).where(eq(refreshTokens.id, oldestToken.id));
  }

  const jti = createJti();
  const refreshToken = signRefreshToken({ ...tokenPayload, jti });

  await db.insert(refreshTokens).values({
    id: randomUUID(),
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
      path: adminCookiePath,
    })
    .cookie("refreshToken", refreshToken, {
      ...options,
      maxAge: 10 * 24 * 60 * 60 * 1000,
      path: adminCookiePath,
    })
    .json(
      new ApiResponse(
        200,
        {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            academicDepartment: user.academicDepartment,
            phone: user.phone,
          },
          admin: {
            id: adminRecord.id,
            hall: adminRecord.hall,
            designation: adminRecord.designation,
            operationalUnit: adminRecord.operationalUnit,
            reportingToId: adminRecord.reportingToId,
            isActive: adminRecord.isActive,
          },
        },
        "Admin logged in successfully"
      )
    );
});

/**
 * POST /api/v1/auth/renew-access-token
 * Refresh access token using refresh token
 */
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

    if (tokenRecord.expiresAt < new Date()) {
      throw new ApiError(401, "Refresh token has expired");
    }

    const tokenPayload: AccessTokenPayload = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };

    const newAccessToken = signAccessToken(tokenPayload);

    return res
      .status(200)
      .cookie("accessToken", newAccessToken, {
        ...options,
        maxAge: 15 * 60 * 1000,
        path: decoded.role === "STUDENT" ? studentCookiePath : adminCookiePath,
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

/**
 * POST /api/v1/auth/logout
 * Logout from current device only
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  const user = req.user;

  if (!refreshToken) {
    throw new ApiError(400, "Refresh token is required");
  }

  const hashedToken = hashToken(refreshToken);

  await db
    .delete(refreshTokens)
    .where(eq(refreshTokens.tokenHash, hashedToken));

  return res
    .status(200)
    .clearCookie("accessToken", {
      ...options,
      path: user?.role === "STUDENT" ? studentCookiePath : adminCookiePath,
    })
    .clearCookie("refreshToken", {
      ...options,
      path: user?.role === "STUDENT" ? studentCookiePath : adminCookiePath,
    })
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

/**
 * POST /api/v1/auth/logout-all
 * Logout from all devices (invalidate all refresh tokens)
 */
export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const user = req.user;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));

  return res
    .status(200)
    .clearCookie("accessToken", {
      ...options,
      path: user?.role === "STUDENT" ? studentCookiePath : adminCookiePath,
    })
    .clearCookie("refreshToken", {
      ...options,
      path: user?.role === "STUDENT" ? studentCookiePath : adminCookiePath,
    })
    .json(
      new ApiResponse(200, null, "Logged out from all devices successfully")
    );
});

/* 
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
      .where(eq(refreshTokens.userId, userId))
      .orderBy(desc(refreshTokens.createdAt));

    return res
      .status(200)
      .json(new ApiResponse(200, { sessions }, "Active sessions retrieved"));
  }
);

export const revokeSession = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const sessionId = req.params.sessionId as string;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

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

    await db.delete(refreshTokens).where(eq(refreshTokens.id, sessionId));

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Session revoked successfully"));
  }
);
 */
