import "./Cadastro.css";
import { useState } from "react";
import { auth, db } from "../config/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Cadastro = () => {
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const validarCampos = () => {
        if (!nome.trim()) return "O nome não pode estar vazio.";
        if (!email.includes("@")) return "Digite um e-mail válido.";
        if (senha.length < 6) return "A senha deve ter pelo menos 6 caracteres.";
        return null;
    };

    const handleCadastro = async (e) => {
        e.preventDefault();
        setErro("");
        setLoading(true);

        const erroValidacao = validarCampos();
        if (erroValidacao) {
            setErro(erroValidacao);
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
            const user = userCredential.user;

            await updateProfile(user, { displayName: nome });

            await setDoc(doc(db, "usuarios", user.uid), {
                nome,
                email,
                dataCadastro: new Date().toISOString(),
            });

            localStorage.setItem("usuarioNome", nome);

            alert("Cadastro realizado com sucesso!");

            // Limpa os campos
            setNome("");
            setEmail("");
            setSenha("");

            navigate("/login");
        } catch (error) {
            console.error("Erro no cadastro:", error);
            switch (error.code) {
                case "auth/email-already-in-use":
                    setErro("Este e-mail já está cadastrado. Faça login ou redefina sua senha.");
                    break;
                case "auth/weak-password":
                    setErro("A senha deve ter pelo menos 6 caracteres.");
                    break;
                case "auth/invalid-email":
                    setErro("Digite um e-mail válido.");
                    break;
                default:
                    setErro("Ocorreu um erro inesperado. Tente novamente mais tarde.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => navigate(-1);

    return (
        <div className="cadastro-container">
            <div className="cadastro-box">
                <div className="cadastro-header">
                    <h2>CADASTRO</h2>
                    <button className="fechar" onClick={handleClose}>✖</button>
                </div>

                <form onSubmit={handleCadastro} className="cadastro-form">
                    <label htmlFor="nome">NOME:</label>
                    <input
                        id="nome"
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Digite seu nome completo"
                        required
                    />

                    <label htmlFor="email">EMAIL:</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Digite seu e-mail"
                        required
                    />

                    <label htmlFor="senha">SENHA:</label>
                    <input
                        id="senha"
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="Crie uma senha segura"
                        required
                    />

                    <button className="cadastro-button" type="submit" disabled={loading}>
                        {loading ? "Cadastrando..." : "SALVAR"}
                    </button>

                    {erro && <p className="erro">{erro}</p>}
                </form>
            </div>
        </div>
    );
};

export default Cadastro;
