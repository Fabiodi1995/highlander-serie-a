import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startTimerService } from "./timer-service";
import { testEmailConfiguration } from "./test-email";
// import { serieAManager } from "./serieAManager";

const app = express();

// Edge compatibility and SSL security middleware
app.use((req, res, next) => {
  // Set trust proxy for proper protocol detection
  app.set('trust proxy', 1);
  
  // Edge-specific headers for private browsing compatibility
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Force HTTPS in production with multiple detection methods
  if (process.env.NODE_ENV === 'production') {
    const isHttps = req.header('x-forwarded-proto') === 'https' || 
                    req.header('x-forwarded-ssl') === 'on' ||
                    req.protocol === 'https' ||
                    req.secure;
    
    if (!isHttps) {
      return res.redirect(301, `https://${req.header('host')}${req.url}`);
    }
    
    // Enhanced security headers for Edge compatibility
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Changed from DENY for Edge compatibility
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Relaxed CSP for Edge compatibility while maintaining security
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://replit.com https://*.replit.com; " +
      "style-src 'self' 'unsafe-inline' https:; " +
      "img-src 'self' data: https: blob:; " +
      "font-src 'self' data: https:; " +
      "connect-src 'self' https: wss: ws:; " +
      "frame-src 'self' https:;"
    );
  }
  
  // Redirect non-www to www
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
