import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MainLayout } from "./components/layout/MainLayout";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { RoleProtectedRoute } from "./components/common/RoleProtectedRoute";
import { PublicRoute } from "./components/common/PublicRoute";
import { Login } from "./pages/Login";
import { Unauthorized } from "./pages/Unauthorized";
import { Billing } from "./pages/pos/Billing";
import { Inventory } from "./pages/pos/Inventory";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import Index from "./pages/Index";
import UserManagement from "./pages/user-management";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Admin routes */}
            <Route
              path="/index"
              element={
                // <RoleProtectedRoute allowedRoles={["admin"]}>
                <MainLayout>
                  <Index />
                </MainLayout>
                // </RoleProtectedRoute>
              }
            />

            <Route path="/user-management" element={<UserManagement />} />

            {/* Cashier routes */}
            <Route
              path="/billing"
              element={
                // <RoleProtectedRoute allowedRoles={["cashier", "admin"]}>
                <MainLayout>
                  <Billing />
                </MainLayout>
                // </RoleProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/inventory"
              element={
                // <RoleProtectedRoute allowedRoles={["admin"]}>
                <MainLayout>
                  <Inventory />
                </MainLayout>
                // </RoleProtectedRoute>
              }
            />

            {/* Default route - redirect to role-specific page */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              }
            />

            {/* Catch all route - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

// Component to handle role-based redirection
const RoleBasedRedirect = () => {
  const { userData } = useAuth();

  if (userData?.role === "admin") {
    return <Navigate to="/index" replace />;
  }

  return <Navigate to="/billing" replace />;
};

export default App;
