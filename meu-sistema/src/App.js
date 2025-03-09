import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./componentes/Home";
import Login from "./componentes/Login";
import Cadastro from "./componentes/Cadastro";
import Logado from "./componentes/Logado";
import EsqueciSenha from "./componentes/EsqueciSenha";
import Cob from "./componentes/Cob";  // Importando a Tela COB
import Scaa from "./componentes/Scaa";  // Importando a Tela SCAA
import CadastroFornecedores from "./componentes/CadastroFornecedores"; // Importando Cadastro de Fornecedores

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/logado" element={<Logado />} />
        <Route path="/esquecisenha" element={<EsqueciSenha />} />
        <Route path="/cob" element={<Cob />} />
        <Route path="/scaa" element={<Scaa />} />
        <Route path="/cadastrofornecedores" element={<CadastroFornecedores />} />
      </Routes>
    </Router>
  );
}

export default App;
