import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "../store/useSession";
const RequireAuth = () => {
    const token = useSession((state) => state.token);
    const location = useLocation();
    if (!token) {
        return _jsx(Navigate, { to: "/login", replace: true, state: { from: location.pathname } });
    }
    return _jsx(Outlet, {});
};
export default RequireAuth;
