import { Router } from "express";
import { registerUser } from "../controllers/auth.controller.ts";

const authRouter = Router();

authRouter.post("/register", registerUser);

export default authRouter;
