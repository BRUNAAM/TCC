import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./componentes/Home";
import Login from "./Componentes/Login";
import Cadastro from "./Componentes/Cadastro";
import Logado from "./Componentes/Logado";
import EsqueciSenha from "./Componentes/EsqueciSenha";
import Cob from "./Componentes/Cob";  // Importando a Tela COB
import Scaa from "./Componentes/Scaa";  // Importando a Tela SCAA
import Fornecedores from "./Componentes/Fornecedores"; // Importando Cadastro de Fornecedores

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
