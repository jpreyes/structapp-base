import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useSession } from "../store/useSession";

const RequireAuth = () => {
  const token = useSession((state) => state.token);
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
};

export default RequireAuth;
