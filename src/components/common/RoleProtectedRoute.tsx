import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../types/auth";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole | UserRole[];
  redirectTo?: string;
}

export const RoleProtectedRoute = ({
  children,
  allowedRoles,
  redirectTo = "/unauthorized",
}: RoleProtectedRouteProps) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(allowedRoles)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
