import React, { useState, useEffect } from "react";
import { auth, db } from "../config/firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./HistoricoCob.css";

const HistoricoCob = () => {
    const [avaliacoes, setAvaliacoes] = useState([]);
    const navigate = useNavigate();

    const fetchAvaliacoes = async () => {
        const user = auth.currentUser;
        if (user) {
            const q = query(collection(db, "avaliacoes_cob"), where("userId", "==", user.uid));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAvaliacoes(data);
        }
    };

    useEffect(() => {
        fetchAvaliacoes();
    }, []);

    const handleDelete = async (id) => {
        const confirm = window.confirm("Deseja realmente excluir esta avaliação?");
        if (confirm) {
            await deleteDoc(doc(db, "avaliacoes_cob", id));
            fetchAvaliacoes();
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="historico-cob-container">
            <div className="historico-header">
                <h2>Histórico de Avaliações COB</h2>
                <div className="botoes-topo">
                    <button className="botao-voltar" onClick={() => navigate(-1)}>Voltar</button>
                    <button className="botao-imprimir" onClick={handlePrint}>Imprimir</button>
                </div>
            </div>

            {avaliacoes.length > 0 ? (
                <table className="avaliacoes-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Fornecedor</th>
                            <th>Nº Amostra</th>
                            <th>Torra</th>
                            <th>Pontuação</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {avaliacoes.map(({ id, data, fornecedor, numeroAmostra, torra, pontuacaoFinal }) => (
                            <tr key={id}>
                                <td>{new Date(data).toLocaleDateString("pt-BR")}</td>
                                <td>{fornecedor}</td>
                                <td>{numeroAmostra}</td>
                                <td>{torra}</td>
                                <td>{pontuacaoFinal}</td>
                                <td>
                                    <button className="botao-excluir" onClick={() => handleDelete(id)}>
                                        Excluir
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="sem-avaliacoes">Nenhuma avaliação encontrada.</p>
            )}
        </div>
    );
};

export default HistoricoCob;
