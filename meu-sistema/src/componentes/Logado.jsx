"use client"

import "./Logado.css"
import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth } from "../config/firebase"
import { useUser } from "../context/UserContext"
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
} from "lucide-react"

const Logado = () => {
    const { usuario, setUsuario } = useUser()
    const navigate = useNavigate()
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
    const [loading, setLoading] = useState(false)

    // Refs para gerenciamento de foco
    const mainRef = useRef(null)
    const logoutConfirmRef = useRef(null)
    const welcomeRef = useRef(null)

    // Estado para controlar os atalhos de teclado
    const [shortcutsEnabled] = useState(true)

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

    // Foca na mensagem de boas-vindas quando carrega
    useEffect(() => {
        if (usuario && welcomeRef.current) {
            welcomeRef.current.focus()
        }
    }, [usuario])

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
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [navigate, showLogoutConfirm, shortcutsEnabled])

    const skipToMain = (e) => {
        e.preventDefault()
        if (mainRef.current) {
            mainRef.current.focus()
        }
    }

    const skipToNav = (e) => {
        e.preventDefault()
        const navElement = document.getElementById("main-navigation")
        if (navElement) {
            navElement.focus()
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            await signOut(auth)
            setUsuario(null)
            localStorage.removeItem("usuarioNome")

            // Anunciar logout para leitores de tela
            announceToScreenReader("Logout realizado com sucesso. Redirecionando para a página de login.")

            navigate("/login", { replace: true })
        } catch (error) {
            console.error("Erro ao sair:", error)
            announceToScreenReader("Erro ao fazer logout. Tente novamente.")
        } finally {
            setLoading(false)
            setShowLogoutConfirm(false)
        }
    }

    const confirmLogout = () => {
        setShowLogoutConfirm(true)
        setTimeout(() => {
            if (logoutConfirmRef.current) {
                logoutConfirmRef.current.focus()
            }
        }, 100)
    }

    const cancelLogout = () => {
        setShowLogoutConfirm(false)
    }

    const announceToScreenReader = (message) => {
        const announcement = document.createElement("div")
        announcement.setAttribute("aria-live", "polite")
        announcement.setAttribute("aria-atomic", "true")
        announcement.className = "sr-only"
        announcement.textContent = message
        document.body.appendChild(announcement)
        setTimeout(() => {
            document.body.removeChild(announcement)
        }, 1000)
    }

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
            shortcut: "Alt+1",
        },
        {
            id: "scaa-evaluation",
            path: "/scaa",
            icon: Award,
            title: "Avaliação SCAA",
            description: "Iniciar nova avaliação pelo método SCAA (Specialty Coffee Association)",
            shortcut: "Alt+2",
        },
        {
            id: "suppliers",
            path: "/fornecedores",
            icon: Users,
            title: "Produtores e Fornecedores",
            description: "Gerenciar cadastro de produtores e fornecedores de café",
            shortcut: "Alt+3",
        },
        {
            id: "cob-history",
            path: "/historico-cob",
            icon: ClipboardList,
            title: "Histórico COB",
            description: "Visualizar histórico de avaliações COB realizadas",
            shortcut: "Alt+4",
        },
        {
            id: "scaa-history",
            path: "/historico-scaa",
            icon: BarChart3,
            title: "Histórico SCAA",
            description: "Visualizar histórico de avaliações SCAA realizadas",
            shortcut: "Alt+5",
        },
    ]

    return (
        <>
            {/* Skip Links */}
            <div className="skip-links">
                <a href="#main-content" className="skip-link" onClick={skipToMain}>
                    Pular para o conteúdo principal
                </a>
                <a href="#main-navigation" className="skip-link" onClick={skipToNav}>
                    Pular para a navegação
                </a>
            </div>

            <div className="page-wrapper">
                <header className="page-header" role="banner">
                    <div className="header-content">
                        <img
                            src={logo || "/placeholder.svg?height=60&width=60"}
                            alt="Coffee Grader"
                            className="header-logo"
                            width="60"
                            height="60"
                        />
                        <div className="header-info">
                            <h1 className="sr-only">Coffee Grader - Painel Principal</h1>
                            <div className="user-info">
                                <User className="user-icon" aria-hidden="true" size={18} />
                                <span className="user-label">Usuário:</span>
                                <span className="user-name">{usuario.nome}</span>
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
                            <h2 id="welcome-title" className="logado-h2" ref={welcomeRef} tabIndex="-1">
                                Bem-vindo(a), {usuario.nome}!
                            </h2>
                            <p className="welcome-subtitle">Escolha uma das opções abaixo para começar:</p>
                        </div>

                        <nav
                            id="main-navigation"
                            className="botoes-container"
                            role="navigation"
                            aria-label="Menu principal de navegação"
                            tabIndex="-1"
                        >
                            <div className="nav-section">
                                <h3 className="nav-section-title">
                                    <TrendingUp className="section-icon" aria-hidden="true" size={18} />
                                    Avaliações
                                </h3>
                                <div className="nav-buttons-group">
                                    {navigationItems.slice(0, 2).map((item) => {
                                        const IconComponent = item.icon
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => navigate(item.path)}
                                                className="nav-button"
                                                aria-describedby={`${item.id}-desc`}
                                                title={`${item.description} (${item.shortcut})`}
                                            >
                                                <IconComponent className="button-icon" aria-hidden="true" size={20} />
                                                <div className="button-content">
                                                    <span className="button-title">{item.title}</span>
                                                    <span className="button-shortcut" aria-label={`Atalho: ${item.shortcut}`}>
                                                        {item.shortcut}
                                                    </span>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="nav-section">
                                <h3 className="nav-section-title">
                                    <Settings className="section-icon" aria-hidden="true" size={18} />
                                    Gerenciamento
                                </h3>
                                <div className="nav-buttons-group">
                                    {navigationItems.slice(2).map((item) => {
                                        const IconComponent = item.icon
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => navigate(item.path)}
                                                className="nav-button"
                                                aria-describedby={`${item.id}-desc`}
                                                title={`${item.description} (${item.shortcut})`}
                                            >
                                                <IconComponent className="button-icon" aria-hidden="true" size={20} />
                                                <div className="button-content">
                                                    <span className="button-title">{item.title}</span>
                                                    <span className="button-shortcut" aria-label={`Atalho: ${item.shortcut}`}>
                                                        {item.shortcut}
                                                    </span>
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

                        <div className="help-section" role="region" aria-label="Ajuda e informações">
                            <button className="help-button" title="Ajuda e atalhos de teclado" aria-describedby="help-desc">
                                <HelpCircle className="help-icon" aria-hidden="true" size={16} />
                                <span>Atalhos: Alt+1 a Alt+5 para navegação rápida</span>
                            </button>
                            <div id="help-desc" className="sr-only">
                                Use Alt + número (1 a 5) para navegar rapidamente entre as seções
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

                        <footer className="app-version" role="contentinfo">
                            <p>
                                <Coffee className="version-icon" aria-hidden="true" size={14} />
                                Coffee Grader versão 1.0
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
