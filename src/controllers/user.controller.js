import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
    return res.status(201).json(
        new ApiResponse(200, { hello: "hudaii" }, "User registered Successfully")
    )
});


export { registerUser };