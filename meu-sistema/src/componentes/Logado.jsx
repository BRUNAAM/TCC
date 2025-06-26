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
        loading: dataLoading,
        lastSync,
        refreshData,
        isOnline,
    } = useData()
    const navigate = useNavigate()
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
    const [loading, setLoading] = useState(false)

    // Refs para gerenciamento de foco
    const mainRef = useRef(null)
    const logoutConfirmRef = useRef(null)
    const welcomeRef = useRef(null)

    // Estado para controlar os atalhos de teclado
    const [shortcutsEnabled] = useState(true)

    const announceToScreenReader = useCallback((message) => {
        const announcement = document.createElement("div")
        announcement.setAttribute("aria-live", "polite")
        announcement.setAttribute("aria-atomic", "true")
        announcement.className = "sr-only"
        announcement.textContent = message
        document.body.appendChild(announcement)
        setTimeout(() => {
            document.body.removeChild(announcement)
        }, 1000)
    }, [])

    const handleLogout = useCallback(async () => {
        setLoading(true)
        try {
            await signOut(auth)
            setUsuario(null)
            localStorage.removeItem("usuarioNome")

            // Limpa dados específicos do usuário
            const keys = Object.keys(localStorage)
            keys.forEach((key) => {
                if (key.startsWith("coffeeGraderData_")) {
                    localStorage.removeItem(key)
                }
            })

            announceToScreenReader("Logout realizado com sucesso. Redirecionando para a página de login.")
            navigate("/login", { replace: true })
        } catch (error) {
            console.error("Erro ao sair:", error)
            announceToScreenReader("Erro ao fazer logout. Tente novamente.")
        } finally {
            setLoading(false)
            setShowLogoutConfirm(false)
        }
    }, [setUsuario, navigate, announceToScreenReader])

    // Proteção extra: redireciona se não estiver logado
    useEffect(() => {
        if (!usuario) {
            const nomeSalvo = localStorage.getItem("usuarioNome")
            if (nomeSalvo) {
                setUsuario({ nome: nomeSalvo })
            } else {
                navigate("/login", { replace: true })
            }
        }
    }, [usuario, navigate, setUsuario])

    // Proteção contra navegação acidental do browser
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault()
            e.returnValue = "Tem certeza que deseja sair do Coffee Grader? Suas alterações não salvas serão perdidas."
            return "Tem certeza que deseja sair do Coffee Grader?"
        }

        const handlePopState = (e) => {
            e.preventDefault()

            // Força o usuário a permanecer na página atual
            window.history.pushState(null, "", window.location.pathname)

            // Mostra confirmação personalizada
            const confirmExit = window.confirm(
                "Você está tentando sair do Coffee Grader.\n\n" +
                'Para sair com segurança, use o botão "Sair do Sistema" na parte inferior da tela.\n\n' +
                "Deseja realmente sair agora?",
            )

            if (confirmExit) {
                // Se confirmar, faz logout adequado
                handleLogout()
            }
        }

        // Adiciona estado ao histórico para interceptar navegação
        window.history.pushState(null, "", window.location.pathname)

        // Adiciona listeners
        window.addEventListener("beforeunload", handleBeforeUnload)
        window.addEventListener("popstate", handlePopState)

        // Cleanup
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload)
            window.removeEventListener("popstate", handlePopState)
        }
    }, [handleLogout])

    // Foca na mensagem de boas-vindas quando carrega
    useEffect(() => {
        if (usuario && welcomeRef.current) {
            welcomeRef.current.focus()
        }
    }, [usuario])

    const cancelLogout = useCallback(() => {
        setShowLogoutConfirm(false)
    }, [])

    // Adicionar listeners para atalhos de teclado
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (shortcutsEnabled && e.altKey) {
                const shortcutMap = {
                    1: "/cob",
                    2: "/scaa",
                    3: "/fornecedores",
                    4: "/historico-cob",
                    5: "/historico-scaa",
                }

                if (shortcutMap[e.key]) {
                    e.preventDefault()
                    navigate(shortcutMap[e.key])
                }
            }

            // Esc para cancelar logout
            if (e.key === "Escape" && showLogoutConfirm) {
                cancelLogout()
            }

            // F5 ou Ctrl+R para atualizar dados
            if ((e.key === "F5" || (e.ctrlKey && e.key === "r")) && !dataLoading) {
                e.preventDefault()
                refreshData()
                announceToScreenReader("Dados atualizados do servidor")
            }
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [navigate, showLogoutConfirm, shortcutsEnabled, dataLoading, refreshData, announceToScreenReader, cancelLogout])

    const confirmLogout = useCallback(() => {
        setShowLogoutConfirm(true)
        setTimeout(() => {
            if (logoutConfirmRef.current) {
                logoutConfirmRef.current.focus()
            }
        }, 100)
    }, [])

    // Ainda carregando contexto
    if (!usuario) {
        return (
            <div className="loading-container" role="status" aria-live="polite">
                <Loader2 className="loading-spinner" aria-hidden="true" size={40} />
                <p>Carregando painel principal...</p>
                <span className="sr-only">Aguarde enquanto carregamos suas informações</span>
            </div>
        )
    }

    const navigationItems = [
        {
            id: "cob-evaluation",
            path: "/cob",
            icon: Coffee,
            title: "Avaliação COB",
            description: "Iniciar nova avaliação pelo método COB (Cup of Excellence)",
            count: avaliacoesCOB.length,
            category: "evaluation",
        },
        {
            id: "scaa-evaluation",
            path: "/scaa",
            icon: Award,
            title: "Avaliação SCAA",
            description: "Iniciar nova avaliação pelo método SCAA (Specialty Coffee Association)",
            count: avaliacoesSCAA.length,
            category: "evaluation",
        },
        {
            id: "suppliers",
            path: "/fornecedores",
            icon: Users,
            title: "Fornecedores",
            description: "Gerenciar cadastro de produtores e fornecedores de café",
            count: fornecedores.length,
            category: "management",
        },
        {
            id: "cob-history",
            path: "/historico-cob",
            icon: ClipboardList,
            title: "Histórico COB",
            description: "Visualizar histórico de avaliações COB realizadas",
            count: avaliacoesCOB.length,
            category: "management",
        },
        {
            id: "scaa-history",
            path: "/historico-scaa",
            icon: BarChart3,
            title: "Histórico SCAA",
            description: "Visualizar histórico de avaliações SCAA realizadas",
            count: avaliacoesSCAA.length,
            category: "management",
        },
    ]

    const evaluationItems = navigationItems.filter((item) => item.category === "evaluation")
    const managementItems = navigationItems.filter((item) => item.category === "management")

    return (
        <>
            <div className="page-wrapper">
                <header className="page-header" role="banner">
                    <div className="header-content">
                        <div className="header-left">
                            <img
                                src={logo || "/placeholder.svg?height=50&width=50"}
                                alt="Coffee Grader"
                                className="header-logo"
                                width="50"
                                height="50"
                            />
                            <div className="header-info">
                                <h1 className="sr-only">Coffee Grader - Painel Principal</h1>
                                <div className="user-info">
                                    <User className="user-icon" aria-hidden="true" size={16} />
                                    <span className="user-name">{usuario.nome}</span>
                                </div>
                            </div>
                        </div>

                        <div className="header-right">
                            {/* Status de sincronização e conexão */}
                            <div className="sync-status">
                                <div className="connection-status">
                                    {isOnline ? (
                                        <Wifi className="connection-icon online" size={14} title="Online" />
                                    ) : (
                                        <WifiOff className="connection-icon offline" size={14} title="Offline" />
                                    )}
                                </div>

                                {dataLoading ? (
                                    <div className="sync-loading">
                                        <Loader2 className="sync-icon" size={14} />
                                        <span>Sincronizando...</span>
                                    </div>
                                ) : (
                                    <div className="sync-success">
                                        <Database className="sync-icon" size={14} />
                                        <span>
                                            {lastSync
                                                ? `${new Date(lastSync).toLocaleTimeString()}`
                                                : isOnline
                                                    ? "Dados carregados"
                                                    : "Modo offline"}
                                        </span>
                                        <button
                                            onClick={refreshData}
                                            className="refresh-button"
                                            title="Atualizar dados (F5)"
                                            disabled={dataLoading || !isOnline}
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
                    id="main-content"
                    className="logado-container"
                    ref={mainRef}
                    tabIndex="-1"
                    role="main"
                    aria-label="Painel principal do Coffee Grader"
                >
                    <div className="logado-box">
                        <div className="welcome-section" role="region" aria-labelledby="welcome-title">
                            <h2 id="welcome-title" className="welcome-title" ref={welcomeRef} tabIndex="-1">
                                Bem-vindo(a), {usuario.nome}!
                            </h2>
                            <p className="welcome-subtitle">
                                Escolha uma das opções abaixo para começar suas avaliações
                                {dataLoading && <span className="loading-text"> (Carregando dados...)</span>}
                                {!isOnline && <span className="offline-text"> (Modo offline)</span>}
                            </p>
                        </div>

                        <nav
                            id="main-navigation"
                            className="navigation-container"
                            role="navigation"
                            aria-label="Menu principal de navegação"
                            tabIndex="-1"
                        >
                            {/* Seção de Avaliações */}
                            <div className="nav-section">
                                <h3 className="nav-section-title">
                                    <TrendingUp className="section-icon" aria-hidden="true" size={18} />
                                    Avaliações Sensoriais
                                </h3>
                                <div className="nav-cards-grid">
                                    {evaluationItems.map((item) => {
                                        const IconComponent = item.icon
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => navigate(item.path)}
                                                className="nav-card nav-card-primary"
                                                aria-describedby={`${item.id}-desc`}
                                                title={item.description}
                                            >
                                                <div className="card-icon-container">
                                                    <IconComponent className="card-icon" aria-hidden="true" size={24} />
                                                </div>
                                                <div className="card-content">
                                                    <h4 className="card-title">{item.title}</h4>
                                                    <p className="card-description">{item.description}</p>
                                                    <div className="card-footer">
                                                        <span className="card-count">{item.count} registros</span>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Seção de Gerenciamento */}
                            <div className="nav-section">
                                <h3 className="nav-section-title">
                                    <Settings className="section-icon" aria-hidden="true" size={18} />
                                    Gerenciamento e Histórico
                                </h3>
                                <div className="nav-cards-grid">
                                    {managementItems.map((item) => {
                                        const IconComponent = item.icon
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => navigate(item.path)}
                                                className="nav-card nav-card-secondary"
                                                aria-describedby={`${item.id}-desc`}
                                                title={item.description}
                                            >
                                                <div className="card-icon-container">
                                                    <IconComponent className="card-icon" aria-hidden="true" size={24} />
                                                </div>
                                                <div className="card-content">
                                                    <h4 className="card-title">{item.title}</h4>
                                                    <p className="card-description">{item.description}</p>
                                                    <div className="card-footer">
                                                        <span className="card-count">{item.count} registros</span>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Descrições ocultas para leitores de tela */}
                            {navigationItems.map((item) => (
                                <div key={`${item.id}-desc`} id={`${item.id}-desc`} className="sr-only">
                                    {item.description}
                                </div>
                            ))}
                        </nav>

                        <div className="bottom-section">
                            <div className="help-section" role="region" aria-label="Ajuda e informações">
                                <button className="help-button" title="Ajuda e atalhos de teclado" aria-describedby="help-desc">
                                    <HelpCircle className="help-icon" aria-hidden="true" size={16} />
                                    <span>Atalhos: Alt+1 a Alt+5 para navegação rápida | F5 para atualizar dados</span>
                                </button>
                                <div id="help-desc" className="sr-only">
                                    Use Alt + número (1 a 5) para navegar rapidamente entre as seções. Use F5 para atualizar os dados do
                                    servidor.
                                </div>
                            </div>

                            <div className="logout-section">
                                <button
                                    className="logout-button"
                                    onClick={confirmLogout}
                                    aria-describedby="logout-desc"
                                    disabled={loading}
                                >
                                    <LogOut className="logout-icon" aria-hidden="true" size={18} />
                                    <span>{loading ? "Saindo..." : "Sair do Sistema"}</span>
                                </button>
                                <div id="logout-desc" className="sr-only">
                                    Clique para sair do sistema e voltar à página de login
                                </div>
                            </div>
                        </div>

                        <footer className="app-version" role="contentinfo">
                            <p>
                                <Coffee className="version-icon" aria-hidden="true" size={14} />
                                Coffee Grader v1.0 | {fornecedores.length} fornecedores, {avaliacoesCOB.length + avaliacoesSCAA.length}{" "}
                                avaliações
                                {!isOnline && " (offline)"}
                            </p>
                        </footer>
                    </div>
                </main>

                {/* Modal de confirmação de logout */}
                {showLogoutConfirm && (
                    <div
                        className="logout-modal-overlay"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="logout-modal-title"
                        aria-describedby="logout-modal-desc"
                    >
                        <div className="logout-modal">
                            <h3 id="logout-modal-title" className="modal-title">
                                Confirmar Saída
                            </h3>
                            <p id="logout-modal-desc" className="modal-description">
                                Tem certeza de que deseja sair do sistema? Você precisará fazer login novamente para acessar suas
                                avaliações.
                            </p>
                            <div className="modal-buttons">
                                <button
                                    ref={logoutConfirmRef}
                                    className="modal-button modal-button-danger"
                                    onClick={handleLogout}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="button-icon loading-icon" aria-hidden="true" size={16} />
                                            <span>Saindo...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LogOut className="button-icon" aria-hidden="true" size={16} />
                                            <span>Sim, Sair</span>
                                        </>
                                    )}
                                </button>
                                <button className="modal-button modal-button-secondary" onClick={cancelLogout} disabled={loading}>
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
