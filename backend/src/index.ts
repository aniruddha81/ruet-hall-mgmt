import "dotenv/config";
import type { Server } from "http";
import { app } from "./app.ts";
import { PORT } from "./Constants.ts";
import { db } from "./db/index.ts";

let server: Server | undefined;
let isShuttingDown = false;
let shutdownTimer: NodeJS.Timeout | undefined;

function gracefulShutdown(reason: string, code: number = 0): void {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\nShutting down: ${reason}`);

  // Safety timeout in case close hangs
  shutdownTimer = setTimeout(() => {
    console.error("Force exiting after graceful timeout.");
    process.exit(code || 1);
  }, 10000).unref();

  // Close HTTP server to stop accepting new connections
  if (server) {
    server.close(() => {
      console.log("HTTP server closed.");
      // drizzle + neon-http are stateless; no explicit close needed
      if (shutdownTimer) clearTimeout(shutdownTimer);
      process.exit(code);
    });
  } else {
    if (shutdownTimer) clearTimeout(shutdownTimer);
    process.exit(code);
  }
}

process.on("SIGINT", () => gracefulShutdown("SIGINT (Ctrl+C)", 0));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM", 0));
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  gracefulShutdown("uncaughtException", 1);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  gracefulShutdown("unhandledRejection", 1);
});

server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  // db is imported for side effects; accessing ensures lint doesn't tree-shake in some setups
  void db;
});

export { db, server };
