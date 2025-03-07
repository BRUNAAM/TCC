import { useState } from "react";
import { auth } from "../config/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const EsqueciSenha = () => {
    const [email, setEmail] = useState("");
    const [mensagem, setMensagem] = useState("");
    const navigate = useNavigate();

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setMensagem(""); // Limpa a mensagem anterior

        try {
            await sendPasswordResetEmail(auth, email);
            setMensagem("Um link para redefinir sua senha foi enviado para o seu e-mail.");
        } catch (error) {
            setMensagem("Erro ao enviar e-mail. Verifique se o e-mail está correto.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h2 className="text-2xl font-bold">Recuperar Senha</h2>
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4 p-6 shadow-md">
                <input 
                    type="email" 
                    placeholder="Digite seu e-mail" 
                    className="border p-2 rounded"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                />
                <button className="bg-blue-500 text-white p-2 rounded" type="submit">
                    Enviar link de recuperação
                </button>
            </form>
            {mensagem && <p className="mt-4 text-green-500">{mensagem}</p>}
            <p className="mt-4">
                Lembrou a senha? <button className="text-blue-500" onClick={() => navigate("/")}>Fazer Login</button>
            </p>
        </div>
    );
};

export default EsqueciSenha;
