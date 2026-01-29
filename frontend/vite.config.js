import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // กำหนด Port Frontend ให้เป็น 3000 (ตาม Error Log ที่คุณแจ้ง)
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080", // ชี้ไปที่ Backend Server ของคุณ
        changeOrigin: true,
        secure: false,
      },
      // เพิ่ม Proxy สำหรับรูปภาพ Static (เช่น /uploads) เพื่อให้ดึงจาก Backend ได้
      "/uploads": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
