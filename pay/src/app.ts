import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
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
