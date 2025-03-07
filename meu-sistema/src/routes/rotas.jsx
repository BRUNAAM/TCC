import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "../componentes/Login";
import Cadastro from "../componentes/Cadastro";
import Logado from "../componentes/Logado";
import Scaa from "../componentes/Scaa";
import Cob from "../componentes/Cob";
import CadastroFornecedores from "../componentes/CadastroFornecedores";
import Configuracoes from "../componentes/Configuracoes";
import EsqueciSenha from "../componentes/EsqueciSenha";
import PrivateRoute from "./PrivateRoute";

const Rotas = () => {
    return (
        <Router>
            <Routes>
                {/* Rotas públicas */}
                <Route path="/" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/esqueci-senha" element={<EsqueciSenha />} />

                {/* Rotas protegidas */}
                <Route element={<PrivateRoute />}>
                    <Route path="/logado" element={<Logado />} />
                    <Route path="/scaa" element={<Scaa />} />
                    <Route path="/cob" element={<Cob />} />
                    <Route path="/cadastro-fornecedores" element={<CadastroFornecedores />} />
                    <Route path="/configuracoes" element={<Configuracoes />} />
                </Route>
            </Routes>
        </Router>
    );
};

export default Rotas;
