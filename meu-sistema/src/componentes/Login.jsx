import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

const Login = () => {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, senha);
            navigate("/logado");
        } catch (error) {
            alert("Erro ao fazer login: " + error.message);
        }
    };

    return (
        <div className="container">
            <h2>FAÇA SEU LOGIN</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                />
                <button className="btn-primary" type="submit">Entrar</button>
            </form>
            <button className="btn-primary" onClick={() => navigate("/cadastro")}>
                Criar Conta
            </button>
            <button className="btn-danger" onClick={() => navigate("/esqueci-senha")}>
                Esqueci minha senha
            </button>
        </div>
    );
};

export default Login;
