import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { handleError } from "./middlewares/errorHandling.middleware.ts";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "https://your-frontend.com"],
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(morgan("dev"));

if (process.env.NODE_ENV === "development") {
  import("./utils/run-any-script.ts").then(() => {
    console.log("Executed run-any-script.ts for development.");
  });
}
//routes import
import admissionRouter from "./modules/admission/admission.routes.ts";
import authRouter from "./modules/auth/auth.routes.ts";
import diningRouter from "./modules/dining/dining.routes.ts";
import financeRouter from "./modules/finance/finance.routes.ts";
import inventoryRouter from "./modules/inventory/inventory.routes.ts";
import profileRouter from "./modules/profile/profile.route.ts";

//routes declaration
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/dining", diningRouter);
app.use("/api/admission", admissionRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/finance", financeRouter);

// Error handling middleware
app.use(handleError);

export { app };
