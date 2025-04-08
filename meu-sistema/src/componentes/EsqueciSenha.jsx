import "./EsqueciSenha.css";
import { useState } from "react";
import { auth } from "../config/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const EsqueciSenha = () => {
    const [email, setEmail] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setMensagem("");
        setErro("");
        setLoading(true);

        if (!email.includes("@")) {
            setErro("Digite um e-mail válido.");
            setLoading(false);
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            setMensagem("Um link para redefinir sua senha foi enviado para o seu e-mail.");
            setTimeout(() => navigate("/login"), 3000); // Redireciona após 3 segundos
        } catch (error) {
            if (error.code === "auth/user-not-found") {
                setErro("Este e-mail não está cadastrado.");
            } else if (error.code === "auth/invalid-email") {
                setErro("Digite um e-mail válido.");
            } else {
                setErro("Erro ao enviar e-mail. Tente novamente mais tarde.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="esqueci-container">
            <div className="esqueci-header">
                <form onSubmit={handleResetPassword} className="esqueci-form">
                    <h2>RECUPERAR SENHA</h2>
                    <button className="fechar" onClick={() => navigate("/login")}>
                        X
                    </button>
                    <input
                        type="email"
                        placeholder="Digite seu e-mail"
                        className="esqueci-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <button className="esqueci-botao" type="submit" disabled={loading}>
                        {loading ? "ENVIANDO..." : "ENVIAR LINK DE RECUPERAÇÃO "}
                    </button>
                </form>
            </div>
            {mensagem && <p className="mensagem-sucesso">{mensagem}</p>}
            {erro && <p className="mensagem-erro">{erro}</p>}

        </div>
    );
};

export default EsqueciSenha;
