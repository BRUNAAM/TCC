import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "../componentes/Login";
import Cadastro from "../componentes/Cadastro";
import Logado from "../componentes/Logado";
import Scaa from "../componentes/Scaa"; // Adicionando SCAA
import Cob from "../componentes/Cob";
import CadastroFornecedores from "../componentes/CadastroFornecedores";
import Configuracoes from "../componentes/Configuracoes";
import EsqueciSenha from "../componentes/EsqueciSenha";
import PrivateRoute from "./PrivateRoute";

const Rotas = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/Cadastro" element={<Cadastro />} />
                <Route path="/Esqueci-senha" element={<EsqueciSenha />} />
                <Route element={<PrivateRoute />}>
                    <Route path="/Logado" element={<Logado />} />
                    <Route path="/Scaa" element={<Scaa />} /> {/* Rota SCAA */}
                    <Route path="/Cob" element={<Cob />} />
                    <Route path="/Cadastro-Fornecedores" element={<CadastroFornecedores />} />
                    <Route path="/Configuracoes" element={<Configuracoes />} />
                </Route>
            </Routes>
        </Router>
    );
};

export default Rotas;
