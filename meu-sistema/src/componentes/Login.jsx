import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import "./Login.css";
import logo from "../assets/logo.svg";
import { useUser } from "../context/UserContext";

const Login = () => {
    const { usuario, setUsuario } = useUser();
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // ⛔ Redireciona se já estiver logado
    useEffect(() => {
        if (usuario) {
            navigate("/logado", { replace: true });
        }
    }, [usuario, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !senha) {
            setErro("Preencha todos os campos.");
            return;
        }
        if (loading) return;

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
            setUsuario({ nome: usuarioNome, email: user.email });

            navigate("/logado", { replace: true }); // ← Impede botão voltar

        } catch (error) {
            const mensagensErro = {
                "auth/user-not-found": "Usuário não encontrado. Verifique o e-mail.",
                "auth/wrong-password": "Senha incorreta. Tente novamente.",
                "auth/invalid-email": "Formato de e-mail inválido.",
                "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
                "auth/network-request-failed": "Erro de rede. Verifique sua conexão.",
            };
            setErro(mensagensErro[error.code] || "Erro ao fazer login. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <img src={logo} alt="Logotipo do sistema" className="login-logo" />
                <h2 className="login-title">FAÇA SEU LOGIN</h2>
                <form onSubmit={handleLogin} className="login-form">
                    <input
                        autoFocus
                        id="email"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.trim())}
                        className="login-input"
                        required
                        aria-label="Digite seu e-mail"
                    />
                    <input
                        id="senha"
                        type="password"
                        placeholder="Senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value.trim())}
                        className="login-input"
                        required
                        aria-label="Digite sua senha"
                    />

                    {erro && <p className="login-erro" aria-live="assertive">{erro}</p>}

                    <button className="login-button" type="submit" disabled={loading}>
                        {loading ? <i className="bi bi-arrow-repeat spinner"></i> : "FAZER LOGIN"}
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
                            Esqueci minha senha!
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
