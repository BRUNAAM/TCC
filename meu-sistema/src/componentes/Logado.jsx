import { useEffect, } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { useUser } from "../context/UserContext";
import "./Logado.css";

const Logado = () => {
    const { usuario, setUsuario } = useUser();
    const navigate = useNavigate();

    // ✅ Proteção extra: redireciona se não estiver logado
    useEffect(() => {
        if (!usuario) {
            const nomeSalvo = localStorage.getItem("usuarioNome");
            if (nomeSalvo) {
                setUsuario({ nome: nomeSalvo }); // repõe o contexto
            } else {
                navigate("/login", { replace: true });
            }
        }
    }, [usuario, navigate, setUsuario]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUsuario(null);
            localStorage.removeItem("usuarioNome"); // ← remove nome salvo
            navigate("/login", { replace: true });
        } catch (error) {
            console.error("Erro ao sair:", error);
        }
    };


    // Ainda carregando contexto
    if (!usuario) return <p>Carregando...</p>;

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
                <button onClick={() => navigate("/historico-cob")}>Histórico de Avaliações COB</button>
                <button onClick={() => navigate("/historico-scaa")}>Histórico de Avaliações SCAA</button>
            </nav>

            <button className="logout-button" onClick={handleLogout}>SAIR</button>
        </main>
    );
};

export default Logado;
