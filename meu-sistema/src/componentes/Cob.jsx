import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../config/firebase";
import { collection, addDoc } from "firebase/firestore";
import "./Cob.css";

// --------------- FUNÇÕES DE CÁLCULO (conforme tabela oficial) ---------------
function calcGraoPreto(qtd) {
    if (qtd < 1) return 0;
    return qtd;
}
function calcGraoArdido(qtd) {
    return Math.floor(qtd / 2);
}
function calcConchas(qtd) {
    return Math.floor(qtd / 3);
}
function calcGraoVerde(qtd) {
    return Math.floor(qtd / 5);
}
function calcGraoQuebrado(qtd) {
    return Math.floor(qtd / 5);
}
function calcMalGranadoChocho(qtd) {
    return Math.floor(qtd / 5);
}
/**
 * Brocado: 2..5 = 1 defeito; 6..10 = 2 defeitos, etc.
 * Lógica: se qtd < 2 => 0, se 2..5 => 1,
 * se 6..10 => 2, 11..15 => 3 ...
 */
function calcGraoBrocado(qtd) {
    if (qtd < 2) return 0;
    // Exemplo de chunk: 2..5 => 1, 6..10 => 2, 11..15 => 3 ...
    // A forma mais simples é:
    //  1 p/ 2..5
    // +1 p/ cada bloco de 5
    let blocos = 1; // primeiramente 2..5 => 1
    let resto = qtd - 5;
    if (resto <= 0) return 1;
    // cada 5 a mais => +1
    return blocos + Math.ceil(resto / 5);
}

// Impurezas
function calcCoco(qtd) {
    if (qtd < 1) return 0;
    return qtd;
}
function calcMarinheiros(qtd) {
    return Math.floor(qtd / 2);
}
function calcPauPedraTorraoGrande(qtd) {
    return qtd * 5; // 1 = 5 defeitos
}
function calcPauPedraTorraoRegular(qtd) {
    return qtd * 2; // 1 = 2 defeitos
}
function calcPauPedraTorraoPequeno(qtd) {
    return qtd; // 1 = 1 defeito
}
function calcCascaGrande(qtd) {
    return qtd; // 1 = 1 defeito
}
function calcCascaPequena(qtd) {
    // 2..3 => 1, 4..5 => 2, ...
    return Math.floor(qtd / 2);
}

// --------------- LISTAS DE DEFEITOS ---------------
const defeitosIntrinsecos = [
    { id: "graoPreto", nome: "Grão Preto", descricao: "1 grão preto = 1 defeito", calcFn: calcGraoPreto },
    { id: "graoArdido", nome: "Grão Ardido", descricao: "2 grãos ardidos = 1 defeito", calcFn: calcGraoArdido },
    { id: "graoBrocado", nome: "Grão Brocado", descricao: "2 a 5 grãos brocados = 1 defeito", calcFn: calcGraoBrocado },
    { id: "graoConcha", nome: "Grão Concha", descricao: "3 grãos concha = 1 defeito", calcFn: calcConchas },
    { id: "graoVerde", nome: "Grão Verde", descricao: "5 grãos verdes = 1 defeito", calcFn: calcGraoVerde },
    { id: "graoQuebrado", nome: "Grão Quebrado", descricao: "5 grãos quebrados = 1 defeito", calcFn: calcGraoQuebrado },
    { id: "graoChocho", nome: "Grão Chocho", descricao: "5 grãos chochos = 1 defeito", calcFn: calcMalGranadoChocho },
];

const defeitosExtrinsecos = [
    { id: "coco", nome: "Coco", descricao: "1 grão coco = 1 defeito", calcFn: calcCoco },
    { id: "marinheiros", nome: "Marinheiros", descricao: "2 marinheiros = 1 defeito", calcFn: calcMarinheiros },
    { id: "pauPedraTorraoGrande", nome: "Pau/Pedra/Torrão Grande", descricao: "1 = 5 defeitos", calcFn: calcPauPedraTorraoGrande },
    { id: "pauPedraTorraoRegular", nome: "Pau/Pedra/Torrão Regular", descricao: "1 = 2 defeitos", calcFn: calcPauPedraTorraoRegular },
    { id: "pauPedraTorraoPequeno", nome: "Pau/Pedra/Torrão Pequeno", descricao: "1 = 1 defeito", calcFn: calcPauPedraTorraoPequeno },
    { id: "cascaGrande", nome: "Casca Grande", descricao: "1 casca grande = 1 defeito", calcFn: calcCascaGrande },
    { id: "cascaPequena", nome: "Casca Pequena", descricao: "2 a 3 cascas pequenas = 1 defeito", calcFn: calcCascaPequena },
];

const categorias = {
    subcategoria: ["15 AC", "16 AC", "17 AC", "18 AC", "19", "Bica Corrida"],
    tipo: ["Chato", "Moca"],
    grupo: ["Arábica", "Robusta"],
    subgrupo: ["Estritamente Mole", "Mole", "Apenas Mole", "Duro", "Riado", "Rio", "Rio Zona"],
    caracteristica: ["Excelente", "Boa", "Regular", "Anormal"],
    classe: ["Verde Azulado", "Verde Cana", "Verde", "Esverdeada", "Amarelada", "Amarela", "Marrom", "Chumbado", "Esbranquiçada", "Discrepante"]
};

export default function Cob() {
    const [classificador, setClassificador] = useState("");
    const [produtor, setProdutor] = useState("");
    const [cidade, setCidade] = useState("");
    const [amostra, setAmostra] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [defeitos, setDefeitos] = useState({});
    const [categoriaSelecionada, setCategoriaSelecionada] = useState({});
    const navegar = useNavigate();

    // Atualiza a quantidade digitada de cada defeito
    const handleChangeDefeito = (id, valorDigitado) => {
        const qtd = parseInt(valorDigitado, 10);
        setDefeitos((prev) => ({
            ...prev,
            [id]: isNaN(qtd) ? 0 : qtd,
        }));
    };

    // Calcula a soma das equivalências
    const calcularTotalDefeitos = () => {
        let total = 0;

        [...defeitosIntrinsecos, ...defeitosExtrinsecos].forEach((defeito) => {
            const qtd = defeitos[defeito.id] || 0;
            total += defeito.calcFn(qtd);
        });

        return total;
    };

    // Seleciona a categoria (subcategoria, tipo, grupo, etc.)
    const selecionarCategoria = (tipo, valor) => {
        setCategoriaSelecionada((prev) => ({
            ...prev,
            [tipo]: valor,
        }));
    };

    // Envio dos dados para o Firestore
    const handleSalvar = async (e) => {
        e.preventDefault();
        setMensagem("");

        if (!classificador || !produtor || !cidade || !amostra) {
            setMensagem("Preencha todos os campos!");
            return;
        }

        try {
            await addDoc(collection(db, "avaliacoesCOB"), {
                classificador,
                produtor,
                cidade,
                amostra,
                defeitos, // quantidades que o usuário digitou
                totalDefeitos: calcularTotalDefeitos(),
                categoria: categoriaSelecionada,
                data: new Date(),
            });

            setMensagem("Avaliação salva com sucesso!");
            setClassificador("");
            setProdutor("");
            setCidade("");
            setAmostra("");
            setDefeitos({});
            setCategoriaSelecionada({});
        } catch (error) {
            console.error("Erro ao salvar avaliação:", error);
            setMensagem("Erro ao salvar avaliação. Tente novamente.");
        }
    };

    return (
        <div className="cob-container">
            <h2>Avaliação COB</h2>
            <form onSubmit={handleSalvar}>
                {/* Campos iniciais */}
                <label>Nome do Classificador:</label>
                <input
                    type="text"
                    value={classificador}
                    onChange={(e) => setClassificador(e.target.value)}
                    required
                />

                <label>Nome do Produtor:</label>
                <input
                    type="text"
                    value={produtor}
                    onChange={(e) => setProdutor(e.target.value)}
                    required
                />

                <label>Cidade:</label>
                <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    required
                />

                <label>Dados da Amostra:</label>
                <textarea
                    value={amostra}
                    onChange={(e) => setAmostra(e.target.value)}
                    required
                />

                {/* Seleção de defeitos */}
                <h3>Classificação Física - Defeitos (Intrínsecos e Extrínsecos)</h3>
                {[...defeitosIntrinsecos, ...defeitosExtrinsecos].map((defeito) => {
                    const qtd = defeitos[defeito.id] || 0;
                    const eqv = defeito.calcFn(qtd);

                    return (
                        <div key={defeito.id} className="defeito-item">
                            <div className="defeito-texto">
                                <strong>{defeito.nome}</strong>
                                <p>{defeito.descricao}</p>
                            </div>
                            {/* Campo para digitar a quantidade */}
                            <input
                                type="number"
                                min="0"
                                value={qtd === 0 ? "" : qtd}
                                onChange={(e) => handleChangeDefeito(defeito.id, e.target.value)}
                                placeholder="0"
                            />
                            {/* Exibe a equivalência calculada para o defeito */}
                            <span className="defeito-equivalente">
                                = {eqv}
                            </span>
                        </div>
                    );
                })}

                {/* Seleção de Categoria */}
                <h3>Categoria</h3>
                {Object.keys(categorias).map((tipo) => (
                    <div key={tipo}>
                        <label>{tipo.toUpperCase()}:</label>
                        <select
                            value={categoriaSelecionada[tipo] || ""}
                            onChange={(e) => selecionarCategoria(tipo, e.target.value)}
                        >
                            <option value="">Selecione</option>
                            {categorias[tipo].map((opcao) => (
                                <option key={opcao} value={opcao}>
                                    {opcao}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}

                <h3>Total de Defeitos: {calcularTotalDefeitos()}</h3>

                <button type="submit">Salvar</button>
                <button type="button" onClick={() => navegar("/logado")}>
                    Voltar
                </button>

                {mensagem && <p className="mensagem">{mensagem}</p>}
            </form>
        </div>
    );
}
