import "./esquecisenha.css";
import { useState } from "react";
import { auth } from "../config/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const esquecisenha = () => {
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
            setTimeout(() => navigate("/Login"), 5000); // Redireciona após 5 segundos
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
        <div className="">
            <h2 className="">Recuperar Senha</h2>
            <form onSubmit={handleResetPassword} className="">
                <input
                    type="email"
                    placeholder="Digite seu e-mail"
                    className=""
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <button className="enviar" type="submit" disabled={loading}>
                    {loading ? "Enviando..." : "Enviar link de recuperação"}
                </button>
            </form>

            {mensagem && <p className="mensagem-sucesso">{mensagem}</p>}
            {erro && <p className="mensagem-erro">{erro}</p>}

            <p className="lembrou">
                Lembrou a senha? <button className="voltar" onClick={() => navigate("/")}>Voltar</button>
            </p>
        </div>
    );
};

export default esquecisenha;
