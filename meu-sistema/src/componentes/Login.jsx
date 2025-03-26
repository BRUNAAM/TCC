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
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setErro("");
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, senha);
            const user = userCredential.user;

            let usuarioNome = user.displayName || "";

            const userDoc = await getDoc(doc(db, "usuarios", user.uid));
            if (userDoc.exists()) {
                usuarioNome = userDoc.data().nome;
            }

            localStorage.setItem("usuarioNome", usuarioNome);

            navigate("/logado");
        } catch (error) {
            const mensagensErro = {
                "auth/user-not-found": "Usuário não encontrado. Verifique o e-mail.",
                "auth/wrong-password": "Senha incorreta. Tente novamente.",
            };
            setErro(mensagensErro[error.code] || "Erro ao fazer login. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>FAÇA SEU LOGIN</h2>
                <form onSubmit={handleLogin}>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <label htmlFor="senha">Senha</label>
                    <input
                        id="senha"
                        type="password"
                        placeholder="Senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                    />

                    {erro && <p className="erro">{erro}</p>}

                    <button className="login-button" type="submit" disabled={loading}>
                        {loading ? "Entrando..." : "ENTRAR"}
                    </button>

                    <button
                        className="register-button"
                        onClick={() => navigate("/cadastro")}
                        type="button"
                    >
                        CRIAR CONTA
                    </button>

                    <p className="forgot-password">
                        <button
                            className="forgot-password-link"
                            onClick={() => navigate("/esquecisenha")}
                            type="button"
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
