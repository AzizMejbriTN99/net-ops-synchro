import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import LoadingSpinner from "../components/general/LoadingSpinner";

export default function PrivateRoute({ children }) {
    const { session, loading } = useAuth();

    console.log("Session content = ", session);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!session?.token) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
