import "./Scaa.css";
import { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, getDocs } from "firebase/firestore";

const Scaa = () => {
    const [avaliador, setAvaliador] = useState("");
    const [fornecedores, setFornecedores] = useState([]);
    const [fornecedorSelecionado, setFornecedorSelecionado] = useState("");
    const [numeroAmostra, setNumeroAmostra] = useState("");
    const [observacoes, setObservacoes] = useState("");

    useEffect(() => {
        carregarAvaliador();
        carregarFornecedores();
    }, []);

    const carregarAvaliador = () => {
        const usuarioNome = localStorage.getItem("usuarioNome");
        if (usuarioNome) {
            setAvaliador(usuarioNome);
        }
    };

    const carregarFornecedores = async () => {
        const querySnapshot = await getDocs(collection(db, "fornecedores"));
        const listaFornecedores = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFornecedores(listaFornecedores);
    };

    return (
        <div className="cob-container">
            <h2>Avaliação Scaa</h2>
            <div className="cob-form">
                <label>Avaliador:</label>
                <input type="text" value={avaliador} disabled />

                <label>Fornecedor:</label>
                <select value={fornecedorSelecionado} onChange={(e) => setFornecedorSelecionado(e.target.value)}>
                    <option value="">Selecione um fornecedor</option>
                    {fornecedores.map(fornecedor => (
                        <option key={fornecedor.id} value={fornecedor.nome}>{fornecedor.nome}</option>
                    ))}
                </select>
<br /><br />
                <label>N° da Amostra:</label>
                <input type="text" value={numeroAmostra} onChange={(e) => setNumeroAmostra(e.target.value)} placeholder="Digite o número da amostra" />

                <label>Observações</label>
                <input type="text" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Digite o número da amostra" />
            </div>
        </div>
    );
};

export default Scaa;
