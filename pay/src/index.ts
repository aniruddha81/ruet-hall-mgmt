import "dotenv/config";
import { app } from "./app.ts";

export const PORT = Number(process.env.PORT) || 8080;

export const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
