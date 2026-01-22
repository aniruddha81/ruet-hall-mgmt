import "dotenv/config";
import { app } from "./app.js";

const PORT = Number(process.env.PORT || 8000);

let server;
let isShuttingDown = false;
let shutdownTimer;

function gracefulShutdown(reason, code = 0) {
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
            clearTimeout(shutdownTimer);
            process.exit(code);
        });
    } else {
        clearTimeout(shutdownTimer);
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
});

export { server };

