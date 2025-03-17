import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../componentes/Home";
import Login from "../componentes/Login";
import Cadastro from "../componentes/Cadastro";
import Logado from "../componentes/Logado";
import Scaa from "../componentes/Scaa"; // Adicionando SCAA
import Cob from "../componentes/Cob";
import Fornecedores from "../componentes/Fornecedores";
import EsqueciSenha from "../componentes/EsqueciSenha";
import PrivateRoute from "./PrivateRoute";

const rotas = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/esquecisenha" element={<EsqueciSenha />} />
                <Route element={<PrivateRoute />}>
                    <Route path="/logado" element={<Logado />} />
                    <Route path="/scaa" element={<Scaa />} /> {/* Rota SCAA */}
                    <Route path="/cob" element={<Cob />} />
                    <Route path="/fornecedores" element={<Fornecedores />} />
                </Route>
            </Routes>
        </Router>
    );
};

export default rotas;
