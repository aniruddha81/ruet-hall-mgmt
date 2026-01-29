import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { CORS_ORIGIN } from "./Constants.ts";
import { handleError } from "./middlewares/errorHandling.middleware.ts";

const app = express();

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(morgan("dev"));

//routes import
import authRouter from "./routes/auth.routes.ts";
import profileRouter from "./routes/profile.route.ts";

//routes declaration
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/profile", profileRouter);

// Error handling middleware
app.use(handleError);

export { app };
