import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";

const PrivateRoute = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Escuta mudanças de autenticação
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        // Limpa o listener ao desmontar o componente
        return () => unsubscribe();
    }, []);

    if (loading) {
        // Pode personalizar com um spinner, animação ou componente separado
        return <p>Carregando autenticação...</p>;
    }

    // Se usuário estiver logado, renderiza a rota protegida
    return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
