import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import "./Login.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setErro("");

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, senha);
            const user = userCredential.user;

            // Buscar o nome do usuário no Firestore
            const userDoc = await getDoc(doc(db, "usuarios", user.uid));
            if (userDoc.exists()) {
                const nomeUsuario = userDoc.data().nome;

                // Armazena o nome no LocalStorage para acesso em outras telas
                localStorage.setItem("usuarioNome", nomeUsuario);
            }

            navigate("/logado"); // Redireciona para a tela Logado
        } catch (error) {
            setErro("Email ou senha incorretos.");
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>FAÇA SEU LOGIN</h2>
                <form onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="Email"
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

                    {erro && <p className="erro">{erro}</p>}

                    <button className="login-button" type="submit">ENTRAR</button>

                    <button className="register-button" onClick={() => navigate("/cadastro")} type="button">
                        CRIAR CONTA
                    </button>

                    <p className="forgot-password">
                        <button
                            className="forgot-password-link"
                            onClick={() => navigate("/esquecisenha")}
                        >
                            Esqueci minha senha
                        </button>
                    </p>

                </form>
            </div>
        </div>
    );
};

export default Login;
