import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startTimerService } from "./timer-service";
import { testEmailConfiguration } from "./test-email";
// import { serieAManager } from "./serieAManager";

const app = express();

// Replit Deploy compatibility middleware
app.use((req, res, next) => {
  // Set trust proxy for Replit Deploy
  app.set('trust proxy', 1);
  
  // Detect if running on Replit Deploy vs development
  const isReplitDeploy = req.header('host')?.includes('replit.app') || 
                         req.header('host')?.includes('highlandergame.it') ||
                         process.env.REPLIT_DEPLOYMENT === 'true';
  
  // Only apply strict security in actual production, not on Replit Deploy
  if (isReplitDeploy && process.env.NODE_ENV !== 'development') {
    // Minimal headers for Replit Deploy compatibility
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    // Very permissive CSP for Replit Deploy
    res.setHeader('Content-Security-Policy', 
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https: wss: ws:; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:; " +
      "style-src 'self' 'unsafe-inline' https: data:; " +
      "img-src 'self' data: https: blob:; " +
      "connect-src 'self' https: wss: ws: data:;"
    );
  }
  
  // Redirect non-www to www only for custom domain
  if (req.header('host') === 'highlandergame.it') {
    return res.redirect(301, `https://www.highlandergame.it${req.url}`);
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start timer service for deadline monitoring
    startTimerService();
    log("Timer service started for deadline monitoring");
    
    // Test email configuration
    testEmailConfiguration();
  });
})();
