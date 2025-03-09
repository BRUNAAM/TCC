import "./Logado.css";
import { useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";

const Logado = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        signOut(auth);
        navigate("/");
    };

    return (
        <div className="logado-container">
            <h2>Painel Principal</h2>
            <div className="logado-opcoes">
                <button className="logado-button" onClick={() => navigate("/scaa")}>SCAA</button>
                <button className="logado-button" onClick={() => navigate("/cob")}>COB</button>
                <button className="logado-button" onClick={() => navigate("/cadastro-fornecedores")}>Cadastrar Fornecedores</button>
                <button className="logado-button" onClick={() => navigate("/configuracoes")}>Configurações</button>
                <button className="logado-button logout" onClick={handleLogout}>Sair</button>
            </div>
        </div>
    );
};

export default Logado;
