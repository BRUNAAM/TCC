import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./componentes/Home";
import Login from "./componentes/Login";
import Cadastro from "./componentes/Cadastro";
import Logado from "./componentes/Logado";
import EsqueciSenha from "./componentes/EsqueciSenha";
import Cob from "./componentes/Cob";  // Importando a Tela COB
import Scaa from "./componentes/Scaa";  // Importando a Tela SCAA
import Fornecedores from "./componentes/Fornecedores"; // Importando Cadastro de Fornecedores

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Cadastro" element={<Cadastro />} />
        <Route path="/Logado" element={<Logado />} />
        <Route path="/EsqueciSenha" element={<EsqueciSenha />} />
        <Route path="/Cob" element={<Cob />} />
        <Route path="/Scaa" element={<Scaa />} />
        <Route path="/Fornecedores" element={<Fornecedores />} />
      </Routes>
    </Router>
  );
}

export default App;
