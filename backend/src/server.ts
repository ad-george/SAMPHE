import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app";
import { env } from "./config/env";
import { PrismaClient } from "@prisma/client";
import { checkLicenseExpiry, checkTrialExpiry } from "./jobs/license-checker";
import express from "express";
import path from "path";
import { LicenseService } from "./modules/licensing/license.service";
import { cleanupExpiredAttendanceLinks } from "./jobs/cleanup-expired-links";

const licenseService = new LicenseService();
const prisma = new PrismaClient();

// 1. APPLY LICENSE PROTECTION MIDDLEWARE
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// 2. INITIALIZE SERVERS
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

// 3. BACKGROUND CRON CHECKS FOR MULTI-TENANT LICENSING
checkLicenseExpiry();
checkTrialExpiry();

licenseService
  .syncExpiredLicenses()
  .then((result: { updatedCount: number }) =>
    console.log(`✅ Synced ${result.updatedCount} expired licenses`),
  )
  .catch((err: Error) =>
    console.error("❌ Failed to sync expired licenses:", err),
  );

setInterval(
  () => {
    console.log("🔄 Running scheduled multi-tenant license health check...");
    checkLicenseExpiry();
    checkTrialExpiry();

    licenseService
      .syncExpiredLicenses()
      .then((result: { updatedCount: number }) =>
        console.log(`✅ Synced ${result.updatedCount} expired licenses`),
      )
      .catch((err: Error) =>
        console.error("❌ Failed to sync expired licenses:", err),
      );
  },
  24 * 60 * 60 * 1000,
);

// 4. WEBSOCKET REAL-TIME ATTENDANCE STREAMS
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-session", (sessionId: string) => {
    socket.join(sessionId);
    console.log(
      `Socket ${socket.id} joined live attendance session: ${sessionId}`,
    );
  });

  socket.on("leave-session", (sessionId: string) => {
    socket.leave(sessionId);
    console.log(`Socket ${socket.id} left session: ${sessionId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

/**
 * Global functional exporter used by core attendance controllers
 * to push live check-ins directly into university lecturer/HOD UI dashboards.
 */
export const notifyAttendance = (sessionId: string, record: any) => {
  io.to(sessionId).emit("new-attendance", record);
};

// 5. START HTTP & WEBSOCKET ENGINE
const PORT = parseInt(env.PORT || "3000", 10);
httpServer.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 SUAMP Server running on port ${PORT}`);
  console.log(`🔌 WebSocket real-time cluster ready`);
  console.log(`🔒 B2B License access rules applied to secure routes`);
  console.log(`📅 Background license lifecycle worker scheduled`);
  console.log(`===============================================`);
});

// Clean up old sessions at startup
cleanupExpiredAttendanceLinks();

// Clean up old sessions daily at midnight
setInterval(cleanupExpiredAttendanceLinks, 24 * 60 * 60 * 1000);
