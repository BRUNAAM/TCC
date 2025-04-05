import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../config/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import "./Logado.css";

const Logado = () => {
    const [usuarioNome, setUsuarioNome] = useState("");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const carregarUsuario = async () => {
            try {
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
            } catch (error) {
                console.error("Erro ao carregar usuário:", error);
            } finally {
                setLoading(false);
            }
        };

        carregarUsuario();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        localStorage.removeItem("usuarioNome");
        navigate("/login");
    };

    if (loading) return <p>Carregando...</p>;

    return (
        <main className="logado-container">
            <h2>Bem-vindo (a) <br />{usuarioNome}!</h2>

            <nav className="botoes-container" aria-label="Menu de navegação">
                <button onClick={() => navigate("/cob")}> Iniciar Avaliação COB</button>
                <button onClick={() => navigate("/scaa")}>Iniciar Avaliação SCAA</button>
                <button onClick={() => navigate("/fornecedores")}> Cadastro de Fornecedores / Produtores </button>
                <button onClick={() => navigate("/historico-scaa")}>Histórico de Avaliações SCAA</button>
                <button onClick={() => navigate("/historico-cob")}>Histórico de Avaliações COB</button>
            </nav>

            <button className="logout-button" onClick={handleLogout}>Sair</button>
        </main>
    );
};

export default Logado;
