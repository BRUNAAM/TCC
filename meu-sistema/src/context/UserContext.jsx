import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Recupera o nome salvo localmente, ou usa o displayName do Firebase
        const nomeSalvo = localStorage.getItem("usuarioNome") || user.displayName || "Usuário";
        setUsuario({ nome: nomeSalvo, email: user.email });
      } else {
        setUsuario(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ usuario, setUsuario, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
