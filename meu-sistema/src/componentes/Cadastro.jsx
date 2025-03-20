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

    const handleCadastro = async (e) => {
        e.preventDefault();
        setErro("");
        setLoading(true);

        if (nome.trim() === "") {
            setErro("O nome não pode estar vazio.");
            setLoading(false);
            return;
        }
        if (!email.includes("@")) {
            setErro("Digite um e-mail válido.");
            setLoading(false);
            return;
        }
        if (senha.length < 6) {
            setErro("A senha deve ter pelo menos 6 caracteres.");
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
            const user = userCredential.user;

            await updateProfile(user, { displayName: nome });

            await setDoc(doc(db, "usuarios", user.uid), {
                nome: nome,
                email: email
            });

            localStorage.setItem("usuarioNome", nome);

            alert("Cadastro realizado com sucesso!");
            navigate("/login");
        } catch (error) {
            console.error("Erro no cadastro:", error);

            if (error.code === "auth/email-already-in-use") {
                setErro("Este e-mail já está cadastrado. Faça login ou redefina sua senha.");
            } else if (error.code === "auth/weak-password") {
                setErro("A senha deve ter pelo menos 6 caracteres.");
            } else if (error.code === "auth/invalid-email") {
                setErro("Digite um e-mail válido.");
            } else {
                setErro("Erro ao cadastrar usuário. Verifique os dados e tente novamente.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        navigate(-1); // Volta para a página anterior
    };

    return (
        <div className="cadastro-container">
            <div className="cadastro-header">
                <h2>Cadastro</h2>
                <button className="close-button" onClick={handleClose}>✖</button>
            </div>
            <form onSubmit={handleCadastro}>
                <label>Nome:</label>
                <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                />

                <label>Email:</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <label>Senha:</label>
                <input
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
