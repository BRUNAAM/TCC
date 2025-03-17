import { Navigate, Outlet } from "react-router-dom";
import { auth, db } from "../config/firebase";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";

const privateroute = () => {
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

    return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default privateroute;
