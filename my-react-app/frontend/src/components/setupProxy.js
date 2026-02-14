const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api", // This path will be proxied
    createProxyMiddleware({
      target: process.env.BACKEND_URL || "http://localhost:8080", // Use env var or default to localhost:8080
      changeOrigin: true,
    }),
  );
};
