import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../Componentes/Home";
import Login from "../Componentes/Login";
import Cadastro from "../Componentes/Cadastro";
import Logado from "../Componentes/Logado";
import Scaa from "../Componentes/Scaa"; // Adicionando SCAA
import Cob from "../Componentes/Cob";
import Fornecedores from "../Componentes/Fornecedores";
import EsqueciSenha from "../Componentes/EsqueciSenha";
import PrivateRoute from "./PrivateRoute";

const Rotas = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="Login" element={<Login />} />
                <Route path="/Cadastro" element={<Cadastro />} />
                <Route path="/EsqueciSenha" element={<EsqueciSenha />} />
                <Route element={<PrivateRoute />}>
                    <Route path="/Logado" element={<Logado />} />
                    <Route path="/Scaa" element={<Scaa />} /> {/* Rota SCAA */}
                    <Route path="/Cob" element={<Cob />} />
                    <Route path="/Fornecedores" element={<Fornecedores />} />
                </Route>
            </Routes>
        </Router>
    );
};

export default Rotas;
