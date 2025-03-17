import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../componentes/Home";
import Login from "../componentes/Login";
import Cadastro from "../componentes/Cadastro";
import Logado from "../componentes/Logado";
import Scaa from "../componentes/Scaa"; // Adicionando SCAA
import Cob from "../componentes/Cob";
import Fornecedores from "../componentes/Fornecedores";
import EsqueciSenha from "../componentes/EsqueciSenha";

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
