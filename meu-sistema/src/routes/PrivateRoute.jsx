import { Navigate, Outlet } from "react-router-dom";
import { auth } from "../config/firebase";
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

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
    }

    return user ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateRoute;
