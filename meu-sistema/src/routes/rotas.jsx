import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../componentes/Home";
import Login from "../componentes/Login";
import Cadastro from "../componentes/Cadastro";
import EsqueciSenha from "../componentes/EsqueciSenha";
import Logado from "../componentes/Logado";
import Scaa from "../componentes/Scaa";
import Cob from "../componentes/Cob";
import Fornecedores from "../componentes/Fornecedores";
import PrivateRoute from "./PrivateRoute";

const Rotas = () => {
    return (
        <Router>
            <Routes>
                {/* Rotas públicas */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/esquecisenha" element={<EsqueciSenha />} />

                {/* Rotas protegidas */}
                <Route path="/" element={<PrivateRoute />}>
                    <Route path="/logado" element={<Logado />} />
                    <Route path="/scaa" element={<Scaa />} />
                    <Route path="/cob" element={<Cob />} />
                    <Route path="/fornecedores" element={<Fornecedores />} />
                </Route>
            </Routes>
        </Router>
    );
};

export default Rotas;
