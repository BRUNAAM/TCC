import "./Login.css";
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
        <div className="login-container">
            <h2>FAÇA SEU LOGIN</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="E-mail"
                    className="login-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Senha"
                    className="login-input"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                />
                <button className="login-button" type="submit">Entrar</button>
            </form>

            <button className="login-button secondary" onClick={() => navigate("/cadastro")}>
                Criar Conta
            </button>

            <p className="esqueci-senha" onClick={() => navigate("/esqueci-senha")}>
                Esqueci minha senha
            </p>
        </div>
    );
};

export default Login;
