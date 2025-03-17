import "./Cadastro.css";
import { useState } from "react";
import { auth, db } from "../config/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const cadastro = () => {
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

        // Validações antes de enviar ao Firebase
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
            // Criar usuário no Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
            const user = userCredential.user;

            // Atualiza o nome do usuário no Firebase Auth
            await updateProfile(user, { displayName: nome });

            // Salva os dados do usuário no Firestore (sem a senha)
            await setDoc(doc(db, "usuarios", user.uid), {
                nome: nome,
                email: email
            });

            // Armazena o nome do usuário no LocalStorage para exibição nas telas
            localStorage.setItem("usuarioNome", nome);

            alert("Cadastro realizado com sucesso!");
            navigate("/login"); // Redireciona para a tela de login
        } catch (error) {
            console.error("Erro no cadastro:", error.message);

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

    return (
        <div className="cadastro-container">
            <h2>Cadastro</h2>
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

export default cadastro;
