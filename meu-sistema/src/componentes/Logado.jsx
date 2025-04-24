import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { useUser } from "../context/UserContext";
import "./Logado.css";

const Logado = () => {
    const { usuario, setUsuario } = useUser();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUsuario(null);
            navigate("/login");
        } catch (error) {
            console.error("Erro ao sair:", error);
        }
    };

    if (!usuario) return <p>Carregando...</p>; // Evita erro se contexto ainda não carregou

    return (
        <main className="logado-container">
            <h2 className="logado-h2">
                Bem-vindo (a) <br />
                {usuario.nome}!
            </h2>

            <nav className="botoes-container" aria-label="Menu de navegação">
                <button onClick={() => navigate("/cob")}>Iniciar Avaliação COB</button>
                <button onClick={() => navigate("/scaa")}>Iniciar Avaliação SCAA</button>
                <button onClick={() => navigate("/fornecedores")}>Cadastro de Produtores / Fornecedores</button>
                <button onClick={() => navigate("/historico-scaa")}>Histórico de Avaliações SCAA</button>
                <button onClick={() => navigate("/historico-cob")}>Histórico de Avaliações COB</button>
            </nav>

            <button className="logout-button" onClick={handleLogout}>SAIR</button>
        </main>
    );
};

export default Logado;
