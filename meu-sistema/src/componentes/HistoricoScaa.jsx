import React, { useState, useEffect } from "react";
import { auth, db } from "../config/firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./HistoricoScaa.css"; // Opcional: para estilização

const HistoricoScaa = () => {
    const [avaliacoes, setAvaliacoes] = useState([]);
    const navigate = useNavigate();

    // Função para buscar as avaliações do usuário autenticado
    const fetchAvaliacoes = async () => {
        if (auth.currentUser) {
            const q = query(
                collection(db, "avaliacoes_scaa"),
                where("userId", "==", auth.currentUser.uid)
            );
            const querySnapshot = await getDocs(q);
            const avaliacoesList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAvaliacoes(avaliacoesList);
        }
    };

    useEffect(() => {
        fetchAvaliacoes();
    }, []);

    // Função para excluir uma avaliação
    const handleDelete = async (id) => {
        if (window.confirm("Deseja realmente excluir esta avaliação?")) {
            await deleteDoc(doc(db, "avaliacoes_scaa", id));
            fetchAvaliacoes();
        }
    };

    // Função para imprimir as avaliações
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="historico-scaa-container">
            <div className="historico-header">
                <h2>Histórico de Avaliações SCAA</h2>
                <button onClick={() => navigate(-1)}>Voltar</button>
            </div>

            <div className="historico-actions">
                <button onClick={handlePrint}>Imprimir Avaliações</button>
            </div>

            {avaliacoes.length > 0 ? (
                <table className="avaliacoes-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Fornecedor</th>
                            <th>N° Amostra</th>
                            <th>Torra</th>
                            <th>Pontuação Final</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {avaliacoes.map(avaliacao => (
                            <tr key={avaliacao.id}>
                                <td>{avaliacao.data}</td>
                                <td>{avaliacao.fornecedor}</td>
                                <td>{avaliacao.numeroAmostra}</td>
                                <td>{avaliacao.torra}</td>
                                <td>{avaliacao.pontuacaoFinal}</td>
                                <td>
                                    <button onClick={() => handleDelete(avaliacao.id)}>Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>Nenhuma avaliação encontrada.</p>
            )}
        </div>
    );
};

export default HistoricoScaa;
