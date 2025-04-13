import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { MainLayout } from "./components/layout/MainLayout";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { RoleProtectedRoute } from "./components/common/RoleProtectedRoute";
import { PublicRoute } from "./components/common/PublicRoute";
import { Login } from "./pages/Login";
import { Unauthorized } from "./pages/Unauthorized";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

// Example page components
const Home = () => (
  <div className="space-y-4">
    <h1 className="text-3xl font-bold">Welcome to the Dashboard</h1>
    <p className="text-muted-foreground">
      This is a protected page that only authenticated users can see.
    </p>
  </div>
);

const AdminDashboard = () => (
  <div className="space-y-4">
    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
    <p className="text-muted-foreground">
      This page is only accessible to administrators.
    </p>
  </div>
);

const ManagerDashboard = () => (
  <div className="space-y-4">
    <h1 className="text-3xl font-bold">Manager Dashboard</h1>
    <p className="text-muted-foreground">
      This page is only accessible to managers.
    </p>
  </div>
);

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

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Home />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <RoleProtectedRoute allowedRoles="admin">
                  <MainLayout>
                    <AdminDashboard />
                  </MainLayout>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/manager"
              element={
                <RoleProtectedRoute allowedRoles={["manager", "admin"]}>
                  <MainLayout>
                    <ManagerDashboard />
                  </MainLayout>
                </RoleProtectedRoute>
              }
            />

            {/* Default route - redirect to login if not authenticated, dashboard if authenticated */}
            <Route
              path="/"
              element={
                <ProtectedRoute redirectTo="/login">
                  <Navigate to="/dashboard" replace />
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

export default App;
