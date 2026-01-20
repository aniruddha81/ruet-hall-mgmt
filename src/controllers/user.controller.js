import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const registerUser = asyncHandler(async (req, res) => {
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
});