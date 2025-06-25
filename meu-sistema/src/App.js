import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./componentes/Home";
import Login from "./componentes/Login";
import Cadastro from "./componentes/Cadastro";
import Logado from "./componentes/Logado";
import Scaa from "./componentes/Scaa";
import Cob from "./componentes/Cob";
import Fornecedores from "./componentes/Fornecedores";
import EsqueciSenha from "./componentes/EsqueciSenha";
import HistoricoScaa from "./componentes/HistoricoScaa";
import HistoricoCob from "./componentes/HistoricoCob";
import PrivateRoute from "./routes/PrivateRoute";
import { UserProvider } from "./context/UserContext"; // <-- IMPORTANTE
import { DataProvider } from "./context/DataContext";

function App() {
  return (
    <UserProvider> {/* Envolve tudo */}
      <DataProvider>  {/* <-- ADICIONE ESTA LINHA */}
        <Router>
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/esquecisenha" element={<EsqueciSenha />} />

            {/* Rotas Protegidas */}
            <Route element={<PrivateRoute />}>
              <Route path="/logado" element={<Logado />} />
              <Route path="/cob" element={<Cob />} />
              <Route path="/scaa" element={<Scaa />} />
              <Route path="/fornecedores" element={<Fornecedores />} />
              <Route path="/historico-scaa" element={<HistoricoScaa />} />
              <Route path="/historico-cob" element={<HistoricoCob />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<h1>Página não encontrada</h1>} />
          </Routes>
        </Router>
      </DataProvider>  {/* <-- E ESTA LINHA */}
    </UserProvider>
  );
}

export default App;
