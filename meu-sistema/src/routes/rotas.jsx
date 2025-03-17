import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./componentes/home";
import Login from "./componentes/login";
import Cadastro from "./componentes/cadastro";
import Logado from "./componentes/logado";
import Scaa from "./componentes/scaa"; // Adicionando SCAA
import Cob from "./componentes/cob";
import Fornecedores from "./componentes/fornecedores";
import EsqueciSenha from "./componentes/esquecisenha";
import PrivateRoute from "./privateroute";

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
