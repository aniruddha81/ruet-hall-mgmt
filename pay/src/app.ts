import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { PAY_SERVICE_SECRET } from "./Constants.js";
import { handleError } from "./middlewares/errorHandling.middleware.js";
import { ApiResponse } from "./utils/ApiResponse.js";

const app = express();

app.use(
  cors({
    origin: "*", // Allow all origins for development; adjust in production
    // credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(morgan("dev"));

// Shared secret auth for all /pay-api/* routes
app.use("/pay-api", (req, res, next) => {
  const secret = req.headers["x-pay-secret"];
  if (secret !== PAY_SERVICE_SECRET) {
    res.status(401).json(new ApiResponse(401, null, "Unauthorized: invalid service secret"));
    return;
  }
  next();
});

const buildTransactionId = (
  prefix: string,
  parts: Array<string | number | undefined>
) => `${prefix}-${parts.filter(Boolean).join("-")}-${Date.now()}`;

//routes declaration
app.post("/pay-api/meal-payment", async (req, res) => {
  const { studentId, amount, totalQuantity, paymentMethod } = req.body;

  const transactionId = buildTransactionId("MEAL", [
    studentId,
    amount,
    totalQuantity,
    paymentMethod,
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { transactionId },
        "Meal payment endpoint is working"
      )
    );
});

app.post("/pay-api/hall-charge-payment", async (req, res) => {
  const { dueId, studentId, amount, paymentMethod, chargeType, hall } =
    req.body;

  const transactionId = buildTransactionId("HALL", [
    dueId,
    studentId,
    hall,
    chargeType,
    amount,
    paymentMethod,
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { transactionId },
        "Hall charge payment endpoint is working"
      )
    );
});

app.get("/", (req, res) => {
  void req;

  res
    .status(200)
    .json(new ApiResponse(200, null, "Dummy payment API is working"));
});

// Error handling middleware
app.use(handleError);

export { app };
