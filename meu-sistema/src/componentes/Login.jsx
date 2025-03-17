import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import "./login.css";

const login = () => {
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

            let usuarioNome = user.displayName || ""; // Se o nome já estiver salvo no Firebase Auth

            // Buscar nome salvo no Firestore
            const userDoc = await getDoc(doc(db, "usuarios", user.uid)); // Corrigido de "usuario" para "usuarios"
            if (userDoc.exists()) {
                usuarioNome = userDoc.data().nome;
            }

            // Armazena o nome no LocalStorage para acesso em outras telas
            localStorage.setItem("usuarioNome", usuarioNome);

            navigate("/logado"); // Redireciona para a tela Logado
        } catch (error) {
            if (error.code === "auth/user-not-found") {
                setErro("Usuário não encontrado. Verifique o e-mail e tente novamente.");
            } else if (error.code === "auth/wrong-password") {
                setErro("Senha incorreta. Tente novamente.");
            } else {
                setErro("Erro ao fazer login. Tente novamente mais tarde.");
            }
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

export default login;
