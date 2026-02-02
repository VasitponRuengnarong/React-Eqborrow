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
import UserDashboard from "./components/UserDashboard";
import ProductManagement from "./components/ProductManagement";
import BorrowRequest from "./components/BorrowRequest";
import BorrowHistory from "./components/BorrowHistory";
import UserProfile from "./components/UserProfile";
import MemberManagement from "./components/MemberManagement";
import ApprovalPage from "./components/ApprovalPage.jsx"; // Import ApprovalPage with extension
import ActivityLogPage from "./components/ActivityLogPage.jsx";
import AccessDenied from "./components/AccessDenied";

const DashboardResolver = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.role === "Admin") {
    return <AdminDashboard />;
  }
  return <UserDashboard />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/access-denied" element={<AccessDenied />} />

        {/* --- Protected Routes (ที่มี Sidebar/Header) --- */}
        {/* ใช้การเขียนแบบ Nested Route:
           1. ProtectedRoute จะตรวจสอบสิทธิ์ก่อน
           2. ถ้าผ่าน จะไปเรียก MainLayout
           3. MainLayout จะแสดงผลหน้าลูก (Child Route) ผ่าน <Outlet /> 
        */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={["Admin", "User", "Staff", "Manager"]}
            >
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* ใส่ Route ย่อยๆ ที่ต้องการให้แสดงใน MainLayout ตรงนี้ */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardResolver />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="approvals" element={<ApprovalPage />} />{" "}
          {/* ใช้ ApprovalPage แทน PendingRequests */}
          <Route path="logs" element={<ActivityLogPage />} />
          <Route path="members" element={<MemberManagement />} />
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
