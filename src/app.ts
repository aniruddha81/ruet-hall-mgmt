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
import admissionRouter from "./modules/admission/admission.routes.ts";
import authRouter from "./modules/auth/auth.routes.ts";
import diningRouter from "./modules/dining/dining.routes.ts";
import financeRouter from "./modules/finance/finance.routes.ts";
import inventoryRouter from "./modules/inventory/inventory.routes.ts";
import profileRouter from "./modules/profile/profile.route.ts";

//routes declaration
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/dining", diningRouter);
app.use("/api/v1/admission", admissionRouter);
app.use("/api/v1/inventory", inventoryRouter);
app.use("/api/v1/finance", financeRouter);

// Error handling middleware
app.use(handleError);

export { app };
