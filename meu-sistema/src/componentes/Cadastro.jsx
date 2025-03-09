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
    const navigate = useNavigate();

    const handleCadastro = async (e) => {
        e.preventDefault();
        setErro("");

        try {
            // Criar usuário no Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
            const user = userCredential.user;

            // Atualiza o nome do usuário no Firebase Auth
            await updateProfile(user, { displayName: nome });

            // Salva os dados no Firestore
            await setDoc(doc(db, "usuarios", user.uid), {
                nome: nome,
                email: email
            });

            // Armazena o nome do usuário no LocalStorage para exibir na Home
            localStorage.setItem("usuarioNome", nome);

            alert("Cadastro realizado com sucesso!");
            navigate("/home"); // Redireciona para a tela inicial
        } catch (error) {
            setErro("Erro ao cadastrar usuário. Verifique os dados e tente novamente.");
            console.error("Erro no cadastro:", error.message);
        }
    };

    return (
        <div className="cadastro-container">
            <h2>Cadastro</h2>
            <form onSubmit={handleCadastro}>
                <label>Nome:</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />

                <label>Email:</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

                <label>Senha:</label>
                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />

                <button type="submit">Cadastrar</button>

                {erro && <p className="erro">{erro}</p>}
            </form>
        </div>
    );
};

export default Cadastro;
