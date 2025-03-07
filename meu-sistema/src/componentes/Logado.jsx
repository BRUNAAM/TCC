import { useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";

const Logado = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };

    return (
        <div className="container">
            <h2>Bem-vindo!</h2>
            <button className="btn-primary" onClick={() => navigate("/scaa")}>SCAA</button>
            <button className="btn-primary" onClick={() => navigate("/cob")}>COB</button>
            <button className="btn-primary" onClick={() => navigate("/cadastro-fornecedores")}>Cadastrar Fornecedores</button>
            <button className="btn-primary" onClick={() => navigate("/configuracoes")}>Configurações</button>
            <button className="btn-danger" onClick={handleLogout}>Sair</button>
        </div>
    );
};

export default Logado;
