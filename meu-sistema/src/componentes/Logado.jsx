"use client"

import "./Logado.css"
import { useEffect, useState, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth } from "../config/firebase"
import { useUser } from "../context/UserContext"
import { useData } from "../context/DataContext"
import logo from "../assets/logo.svg"
import {
    Coffee,
    Users,
    ClipboardList,
    BarChart3,
    LogOut,
    Loader2,
    User,
    Award,
    TrendingUp,
    Settings,
    HelpCircle,
    RefreshCw,
    Database,
    WifiOff,
    Wifi,
} from "lucide-react"

const Logado = () => {
    const { usuario, setUsuario } = useUser()
    const {
        fornecedores,
        avaliacoesCOB,
        avaliacoesSCAA,
        loading: carregandoDados,
        lastSync,
        refreshData,
        isOnline,
    } = useData()
    const navegar = useNavigate()
    const [mostrarConfirmacaoLogout, setMostrarConfirmacaoLogout] = useState(false)
    const [carregando, setCarregando] = useState(false)

    // Refs para gerenciamento de foco
    const refPrincipal = useRef(null)
    const refConfirmacaoLogout = useRef(null)
    const refBoasVindas = useRef(null)

    // Estado para controlar os atalhos de teclado
    const [atalhosTeclado] = useState(true)

    const anunciarParaLeitorTela = useCallback((mensagem) => {
        const anuncio = document.createElement("div")
        anuncio.setAttribute("aria-live", "polite")
        anuncio.setAttribute("aria-atomic", "true")
        anuncio.className = "apenas-leitor-tela"
        anuncio.textContent = mensagem
        document.body.appendChild(anuncio)

        setTimeout(() => {
            document.body.removeChild(anuncio)
        }, 1000)
    }, [])

    const manipularLogout = useCallback(async () => {
        setCarregando(true)
        try {
            await signOut(auth)
            setUsuario(null)
            localStorage.removeItem("usuarioNome")

            // Limpa dados específicos do usuário
            const chaves = Object.keys(localStorage)
            chaves.forEach((chave) => {
                if (chave.startsWith("coffeeGraderData_")) {
                    localStorage.removeItem(chave)
                }
            })

            anunciarParaLeitorTela("Logout realizado com sucesso. Redirecionando para a página de login.")
            navegar("/login", { replace: true })
        } catch (error) {
            console.error("Erro ao sair:", error)
            anunciarParaLeitorTela("Erro ao fazer logout. Tente novamente.")
        } finally {
            setCarregando(false)
            setMostrarConfirmacaoLogout(false)
        }
    }, [setUsuario, navegar, anunciarParaLeitorTela])

    // Proteção extra: redireciona se não estiver logado
    useEffect(() => {
        if (!usuario) {
            const nomeSalvo = localStorage.getItem("usuarioNome")
            if (nomeSalvo) {
                setUsuario({ nome: nomeSalvo })
            } else {
                navegar("/login", { replace: true })
            }
        }
    }, [usuario, navegar, setUsuario])

    // Proteção contra navegação acidental do browser
    useEffect(() => {
        const manipularAntesDescarregar = (e) => {
            e.preventDefault()
            e.returnValue = "Tem certeza que deseja sair do Coffee Grader? Suas alterações não salvas serão perdidas."
            return "Tem certeza que deseja sair do Coffee Grader?"
        }

        const manipularEstadoPopulacao = (e) => {
            e.preventDefault()
            // Força o usuário a permanecer na página atual
            window.history.pushState(null, "", window.location.pathname)
            // Mostra confirmação personalizada
            const confirmarSaida = window.confirm(
                "Você está tentando sair do Coffee Grader.\n\n" +
                'Para sair com segurança, use o botão "Sair do Sistema" na parte inferior da tela.\n\n' +
                "Deseja realmente sair agora?",
            )

            if (confirmarSaida) {
                // Se confirmar, faz logout adequado
                manipularLogout()
            }
        }

        // Adiciona estado ao histórico para interceptar navegação
        window.history.pushState(null, "", window.location.pathname)

        // Adiciona listeners
        window.addEventListener("beforeunload", manipularAntesDescarregar)
        window.addEventListener("popstate", manipularEstadoPopulacao)

        // Cleanup
        return () => {
            window.removeEventListener("beforeunload", manipularAntesDescarregar)
            window.removeEventListener("popstate", manipularEstadoPopulacao)
        }
    }, [manipularLogout])

    // Foca na mensagem de boas-vindas quando carrega
    useEffect(() => {
        if (usuario && refBoasVindas.current) {
            refBoasVindas.current.focus()
        }
    }, [usuario])

    const cancelarLogout = useCallback(() => {
        setMostrarConfirmacaoLogout(false)
    }, [])

    // Adicionar listeners para atalhos de teclado
    useEffect(() => {
        const manipularTeclaPressionada = (e) => {
            if (atalhosTeclado && e.altKey) {
                const mapaAtalhos = {
                    1: "/cob",
                    2: "/scaa",
                    3: "/fornecedores",
                    4: "/historico-cob",
                    5: "/historico-scaa",
                }

                if (mapaAtalhos[e.key]) {
                    e.preventDefault()
                    navegar(mapaAtalhos[e.key])
                }
            }

            // Esc para cancelar logout
            if (e.key === "Escape" && mostrarConfirmacaoLogout) {
                cancelarLogout()
            }

            // F5 ou Ctrl+R para atualizar dados
            if ((e.key === "F5" || (e.ctrlKey && e.key === "r")) && !carregandoDados) {
                e.preventDefault()
                refreshData()
                anunciarParaLeitorTela("Dados atualizados do servidor")
            }
        }

        document.addEventListener("keydown", manipularTeclaPressionada)
        return () => document.removeEventListener("keydown", manipularTeclaPressionada)
    }, [
        navegar,
        mostrarConfirmacaoLogout,
        atalhosTeclado,
        carregandoDados,
        refreshData,
        anunciarParaLeitorTela,
        cancelarLogout,
    ])

    const confirmarLogout = useCallback(() => {
        setMostrarConfirmacaoLogout(true)
        setTimeout(() => {
            if (refConfirmacaoLogout.current) {
                refConfirmacaoLogout.current.focus()
            }
        }, 100)
    }, [])

    // Ainda carregando contexto
    if (!usuario) {
        return (
            <div className="container-carregamento" role="status" aria-live="polite">
                <Loader2 className="spinner-carregamento" aria-hidden="true" size={40} />
                <p>Carregando painel principal...</p>
                <span className="apenas-leitor-tela">Aguarde enquanto carregamos suas informações</span>
            </div>
        )
    }

    const itensNavegacao = [
        {
            id: "avaliacao-cob",
            path: "/cob",
            icon: Coffee,
            title: "Avaliação COB",
            description: "Iniciar nova avaliação pelo método COB (Cup of Excellence)",
            count: avaliacoesCOB.length,
            category: "avaliacao",
        },
        {
            id: "avaliacao-scaa",
            path: "/scaa",
            icon: Award,
            title: "Avaliação SCAA",
            description: "Iniciar nova avaliação pelo método SCAA (Specialty Coffee Association)",
            count: avaliacoesSCAA.length,
            category: "avaliacao",
        },
        {
            id: "fornecedores",
            path: "/fornecedores",
            icon: Users,
            title: "Fornecedores",
            description: "Gerenciar cadastro de produtores e fornecedores de café",
            count: fornecedores.length,
            category: "gerenciamento",
        },
        {
            id: "historico-cob",
            path: "/historico-cob",
            icon: ClipboardList,
            title: "Histórico COB",
            description: "Visualizar histórico de avaliações COB realizadas",
            count: avaliacoesCOB.length,
            category: "gerenciamento",
        },
        {
            id: "historico-scaa",
            path: "/historico-scaa",
            icon: BarChart3,
            title: "Histórico SCAA",
            description: "Visualizar histórico de avaliações SCAA realizadas",
            count: avaliacoesSCAA.length,
            category: "gerenciamento",
        },
    ]

    const itensAvaliacao = itensNavegacao.filter((item) => item.category === "avaliacao")
    const itensGerenciamento = itensNavegacao.filter((item) => item.category === "gerenciamento")

    return (
        <>
            <div className="container-pagina">
                <header className="cabecalho-pagina" role="banner">
                    <div className="conteudo-cabecalho">
                        <div className="cabecalho-esquerda">
                            <img
                                src={logo || "/placeholder.svg?height=50&width=50"}
                                alt="Coffee Grader"
                                className="logo-cabecalho"
                                width="50"
                                height="50"
                            />
                            <div className="info-cabecalho">
                                <h1 className="apenas-leitor-tela">Coffee Grader - Painel Principal</h1>
                                <div className="info-usuario">
                                    <User className="icone-usuario" aria-hidden="true" size={16} />
                                    <span className="nome-usuario">{usuario.nome}</span>
                                </div>
                            </div>
                        </div>

                        <div className="cabecalho-direita">
                            {/* Status de sincronização e conexão */}
                            <div className="status-sincronizacao">
                                <div className="status-conexao">
                                    {isOnline ? (
                                        <Wifi className="icone-conexao online" size={14} title="Online" />
                                    ) : (
                                        <WifiOff className="icone-conexao offline" size={14} title="Offline" />
                                    )}
                                </div>

                                {carregandoDados ? (
                                    <div className="carregamento-sincronizacao">
                                        <Loader2 className="icone-sincronizacao" size={14} />
                                        <span>Sincronizando...</span>
                                    </div>
                                ) : (
                                    <div className="sucesso-sincronizacao">
                                        <Database className="icone-sincronizacao" size={14} />
                                        <span>
                                            {lastSync
                                                ? `${new Date(lastSync).toLocaleTimeString()}`
                                                : isOnline
                                                    ? "Dados carregados"
                                                    : "Modo offline"}
                                        </span>
                                        <button
                                            onClick={refreshData}
                                            className="botao-atualizar"
                                            title="Atualizar dados (F5)"
                                            disabled={carregandoDados || !isOnline}
                                        >
                                            <RefreshCw size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main
                    id="conteudo-principal"
                    className="container-logado"
                    ref={refPrincipal}
                    tabIndex="-1"
                    role="main"
                    aria-label="Painel principal do Coffee Grader"
                >
                    <div className="caixa-logado">
                        <div className="secao-boas-vindas" role="region" aria-labelledby="titulo-boas-vindas">
                            <h2 id="titulo-boas-vindas" className="titulo-boas-vindas" ref={refBoasVindas} tabIndex="-1">
                                Bem-vindo(a), {usuario.nome}!
                            </h2>
                            <p className="subtitulo-boas-vindas">
                                Escolha uma das opções abaixo para começar suas avaliações
                                {carregandoDados && <span className="texto-carregamento"> (Carregando dados...)</span>}
                                {!isOnline && <span className="texto-offline"> (Modo offline)</span>}
                            </p>
                        </div>

                        <nav
                            id="navegacao-principal"
                            className="container-navegacao"
                            role="navigation"
                            aria-label="Menu principal de navegação"
                            tabIndex="-1"
                        >
                            {/* Seção de Avaliações */}
                            <div className="secao-navegacao">
                                <h3 className="titulo-secao-navegacao">
                                    <TrendingUp className="icone-secao" aria-hidden="true" size={18} />
                                    Avaliações Sensoriais
                                </h3>
                                <div className="grade-cartoes-navegacao">
                                    {itensAvaliacao.map((item) => {
                                        const ComponenteIcone = item.icon
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => navegar(item.path)}
                                                className="cartao-navegacao cartao-navegacao-primario"
                                                aria-describedby={`${item.id}-desc`}
                                                title={item.description}
                                            >
                                                <div className="container-icone-cartao">
                                                    <ComponenteIcone className="icone-cartao" aria-hidden="true" size={24} />
                                                </div>
                                                <div className="conteudo-cartao">
                                                    <h4 className="titulo-cartao">{item.title}</h4>
                                                    <p className="descricao-cartao">{item.description}</p>
                                                    <div className="rodape-cartao">
                                                        <span className="contador-cartao">{item.count} registros</span>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Seção de Gerenciamento */}
                            <div className="secao-navegacao">
                                <h3 className="titulo-secao-navegacao">
                                    <Settings className="icone-secao" aria-hidden="true" size={18} />
                                    Gerenciamento e Histórico
                                </h3>
                                <div className="grade-cartoes-navegacao">
                                    {itensGerenciamento.map((item) => {
                                        const ComponenteIcone = item.icon
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => navegar(item.path)}
                                                className="cartao-navegacao cartao-navegacao-secundario"
                                                aria-describedby={`${item.id}-desc`}
                                                title={item.description}
                                            >
                                                <div className="container-icone-cartao">
                                                    <ComponenteIcone className="icone-cartao" aria-hidden="true" size={24} />
                                                </div>
                                                <div className="conteudo-cartao">
                                                    <h4 className="titulo-cartao">{item.title}</h4>
                                                    <p className="descricao-cartao">{item.description}</p>
                                                    <div className="rodape-cartao">
                                                        <span className="contador-cartao">{item.count} registros</span>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Descrições ocultas para leitores de tela */}
                            {itensNavegacao.map((item) => (
                                <div key={`${item.id}-desc`} id={`${item.id}-desc`} className="apenas-leitor-tela">
                                    {item.description}
                                </div>
                            ))}
                        </nav>

                        <div className="secao-inferior">
                            <div className="secao-ajuda" role="region" aria-label="Ajuda e informações">
                                <button className="botao-ajuda" title="Ajuda e atalhos de teclado" aria-describedby="desc-ajuda">
                                    <HelpCircle className="icone-ajuda" aria-hidden="true" size={16} />
                                    <span>Atalhos: Alt+1 a Alt+5 para navegação rápida | F5 para atualizar dados</span>
                                </button>
                                <div id="desc-ajuda" className="apenas-leitor-tela">
                                    Use Alt + número (1 a 5) para navegar rapidamente entre as seções. Use F5 para atualizar os dados do
                                    servidor.
                                </div>
                            </div>

                            <div className="secao-logout">
                                <button
                                    className="botao-logout"
                                    onClick={confirmarLogout}
                                    aria-describedby="desc-logout"
                                    disabled={carregando}
                                >
                                    <LogOut className="icone-logout" aria-hidden="true" size={18} />
                                    <span>{carregando ? "Saindo..." : "Sair do Sistema"}</span>
                                </button>
                                <div id="desc-logout" className="apenas-leitor-tela">
                                    Clique para sair do sistema e voltar à página de login
                                </div>
                            </div>
                        </div>

                        <footer className="versao-aplicativo" role="contentinfo">
                            <p>
                                <Coffee className="icone-versao" aria-hidden="true" size={14} />
                                Coffee Grader v1.0 | {fornecedores.length} fornecedores, {avaliacoesCOB.length + avaliacoesSCAA.length}{" "}
                                avaliações
                                {!isOnline && " (offline)"}
                            </p>
                        </footer>
                    </div>
                </main>

                {/* Modal de confirmação de logout */}
                {mostrarConfirmacaoLogout && (
                    <div
                        className="sobreposicao-modal-logout"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-modal-logout"
                        aria-describedby="desc-modal-logout"
                    >
                        <div className="modal-logout">
                            <h3 id="titulo-modal-logout" className="titulo-modal">
                                Confirmar Saída
                            </h3>
                            <p id="desc-modal-logout" className="descricao-modal">
                                Tem certeza de que deseja sair do sistema? Você precisará fazer login novamente para acessar suas
                                avaliações.
                            </p>

                            <div className="botoes-modal">
                                <button
                                    ref={refConfirmacaoLogout}
                                    className="botao-modal botao-modal-perigo"
                                    onClick={manipularLogout}
                                    disabled={carregando}
                                >
                                    {carregando ? (
                                        <>
                                            <Loader2 className="icone-botao icone-carregando" aria-hidden="true" size={16} />
                                            <span>Saindo...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LogOut className="icone-botao" aria-hidden="true" size={16} />
                                            <span>Sim, Sair</span>
                                        </>
                                    )}
                                </button>
                                <button className="botao-modal botao-modal-secundario" onClick={cancelarLogout} disabled={carregando}>
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default Logado
