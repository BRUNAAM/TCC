import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../context/UserContext";

const PrivateRoute = () => {
    const { usuario, loading } = useUser();

    if (loading) {
        return <div>Verificando autenticação...</div>; // Ou spinner visual
    }

    return usuario ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
