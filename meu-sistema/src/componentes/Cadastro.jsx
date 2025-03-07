import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const Cadastro = () => {
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const navigate = useNavigate();

    const handleCadastro = async (e) => {
        e.preventDefault();

        try {
            // Criar conta no Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
            const user = userCredential.user;

            // Salvar usuário no Firestore
            await setDoc(doc(db, "users", user.uid), {
                nome: nome,
                email: email,
                uid: user.uid
            });

            alert("Usuário cadastrado com sucesso!");
            navigate("/");
        } catch (error) {
            alert("Erro ao cadastrar: " + error.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h2 className="text-2xl font-bold">Cadastro</h2>
            <form onSubmit={handleCadastro} className="flex flex-col gap-4 p-6 shadow-md">
                <input type="text" placeholder="Nome" className="border p-2 rounded" value={nome} onChange={(e) => setNome(e.target.value)} required />
                <input type="email" placeholder="E-mail" className="border p-2 rounded" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Senha" className="border p-2 rounded" value={senha} onChange={(e) => setSenha(e.target.value)} required />
                <button className="bg-green-500 text-white p-2 rounded" type="submit">Cadastrar</button>
            </form>
            <p className="mt-2">
                Já tem uma conta? <button className="text-blue-500" onClick={() => navigate("/")}>Faça login</button>
            </p>
        </div>
    );
};

export default Cadastro;
