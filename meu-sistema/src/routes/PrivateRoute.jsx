import { Navigate, Outlet } from "react-router-dom";
import { auth } from "../Config/Firebase";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";

const PrivateRoute = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Evita exibir um estado de carregamento visível (melhora UX)
    if (loading) {
        return null; // Não renderiza nada enquanto verifica a autenticação
    }

    return user ? <Outlet /> : <Navigate to="/Login" replace />;
};

export default PrivateRoute;
