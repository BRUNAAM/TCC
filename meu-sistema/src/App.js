import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./componentes/home";
import Login from "./componentes/login";
import Cadastro from "./componentes/cadastro";
import Logado from "./componentes/logado";
import Scaa from "./componentes/scaa"; // Adicionando SCAA
import Cob from "./componentes/cob";
import Fornecedores from "./componentes/fornecedores";
import EsqueciSenha from "./componentes/esquecisenha";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/logado" element={<Logado />} />
        <Route path="/esqueciSenha" element={<EsqueciSenha />} />
        <Route path="/cob" element={<Cob />} />
        <Route path="/scaa" element={<Scaa />} />
        <Route path="/fornecedores" element={<Fornecedores />} />
      </Routes>
    </Router>
  );
}

export default App;
