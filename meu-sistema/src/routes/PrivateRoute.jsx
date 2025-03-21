import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { auth } from "../config/firebase";
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

    if (loading) {
        return <p>Carregando...</p>;
    }

    return user ? <Outlet /> : <Navigate to="/login" replace />; // Descobrir o que esta fazendo o Outlet e o         return () => unsubscribe();

};

export default PrivateRoute;
