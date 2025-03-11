import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../config/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import "./Logado.css";

const Logado = () => {
    const [usuarioNome, setUsuarioNome] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const carregarUsuario = async () => {
            let nome = localStorage.getItem("usuarioNome");

            if (!nome) {
                const user = auth.currentUser;
                if (user) {
                    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
                    if (userDoc.exists()) {
                        nome = userDoc.data().nome;
                        localStorage.setItem("usuarioNome", nome);
                    }
                }
            }

            if (nome) {
                setUsuarioNome(nome);
            }
        };

        carregarUsuario();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        localStorage.removeItem("usuarioNome");
        navigate("/Logado");
    };

    return (
        <div className="logado-container">
            <h2>Bem-vindo, {usuarioNome || "Usuário"}!</h2>

            <div className="botoes-container">
                <button onClick={() => navigate("/cob")}>Avaliação COB</button>
                <button onClick={() => navigate("/scaa")}>Avaliação SCAA</button>
                <button onClick={() => navigate("/cadastroprodutores")}>Cadastrar Produtores</button>
            </div>

            <button className="logout-button" onClick={handleLogout}>Sair</button>
        </div>
    );
};

export default Logado;
