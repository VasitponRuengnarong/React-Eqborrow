import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./MainLayout";
import AdminDashboard from "./components/AdminDashboard";
import ProductManagement from "./components/ProductManagement";
import BorrowRequest from "./components/BorrowRequest";
import BorrowHistory from "./components/BorrowHistory";
import UserProfile from "./components/UserProfile";
import MemberManagement from "./components/MemberManagement";
import ApprovalPage from "./components/ApprovalPage.jsx"; // Import ApprovalPage with extension
import ActivityLogPage from "./components/ActivityLogPage.jsx";

function App() {
  return (
    <Router>
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* --- Protected Routes (ที่มี Sidebar/Header) --- */}
        {/* ใช้การเขียนแบบ Nested Route:
           1. ProtectedRoute จะตรวจสอบสิทธิ์ก่อน
           2. ถ้าผ่าน จะไปเรียก MainLayout
           3. MainLayout จะแสดงผลหน้าลูก (Child Route) ผ่าน <Outlet /> 
        */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["Admin", "User", "Staff"]}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* ใส่ Route ย่อยๆ ที่ต้องการให้แสดงใน MainLayout ตรงนี้ */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />{" "}
          {/* Assuming AdminDashboard is also for general dashboard */}
          <Route path="products" element={<ProductManagement />} />
          <Route path="approvals" element={<ApprovalPage />} />{" "}
          {/* ใช้ ApprovalPage แทน PendingRequests */}
          <Route path="logs" element={<ActivityLogPage />} />
          <Route path="members" element={<MemberManagement />} />
          <Route
            path="inventory"
            element={
              <div style={{ padding: "20px" }}>
                <h2>รายการคงเหลือ</h2>
                <p>หน้าจอนี้กำลังอยู่ระหว่างการพัฒนา</p>
              </div>
            }
          />
          <Route path="borrow" element={<BorrowRequest />} />
          <Route path="history" element={<BorrowHistory />} />
          <Route path="profile" element={<UserProfile />} />
          {/* Catch all สำหรับหน้าที่หาไม่เจอภายในระบบ */}
          <Route path="*" element={<div>Page Not Found</div>} />
        </Route>
      </Routes>{" "}
      {/* จุดที่เดิมคุณลืมปิด tag นี้ */}
    </Router>
  );
}

export default App;
