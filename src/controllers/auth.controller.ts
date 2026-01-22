import { ApiResponse } from "../utils/ApiResponse.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import type { Request, Response } from "express";

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  return res
    .status(201)
    .json(
      new ApiResponse(200, { hello: "hudaii" }, "User registered Successfully")
    );
});

export { registerUser };
