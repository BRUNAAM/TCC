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
                nome: nome,
                email: email,
                dataCadastro: new Date().toISOString()
            });

            localStorage.setItem("usuarioNome", nome);

            alert("Cadastro realizado com sucesso!");
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
                    setErro("Erro ao cadastrar usuário. Verifique os dados e tente novamente.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        navigate(-1); // Voltar à página anterior
    };

    return (
        <div className="cadastro-container">
            <div className="cadastro-header">
                <h2>Cadastro</h2>
                <button className="close-button" onClick={handleClose}>✖</button>
            </div>

            <form onSubmit={handleCadastro}>
                <label htmlFor="nome">Nome:</label>
                <input
                    id="nome"
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                />

                <label htmlFor="email">Email:</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <label htmlFor="senha">Senha:</label>
                <input
                    id="senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                />

                <button className="cadastro-button" type="submit" disabled={loading}>
                    {loading ? "Cadastrando..." : "Cadastrar"}
                </button>

                {erro && <p className="erro">{erro}</p>}
            </form>
        </div>
    );
};

export default Cadastro;
