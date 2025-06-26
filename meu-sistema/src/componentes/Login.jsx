"use client"

import "./Login.css"
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { auth, db } from "../config/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import logo from "../assets/logo.svg"
import { useUser } from "../context/UserContext"
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, UserPlus, Coffee } from "lucide-react"

const Login = () => {
    const { usuario, setUsuario } = useUser()
    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")
    const [erro, setErro] = useState("")
    const [loading, setLoading] = useState(false)
    const [mostrarSenha, setMostrarSenha] = useState(false)
    const navigate = useNavigate()

    // Refs para gerenciamento de foco
    const emailRef = useRef(null)
    const senhaRef = useRef(null)
    const erroRef = useRef(null)
    const mainRef = useRef(null)

    // Redireciona se já estiver logado
    useEffect(() => {
        if (usuario) {
            navigate("/logado", { replace: true })
        }
    }, [usuario, navigate])

    // Foca no primeiro erro quando aparece
    useEffect(() => {
        if (erro && erroRef.current) {
            erroRef.current.focus()
        }
    }, [erro])

    const skipToMain = (e) => {
        e.preventDefault()
        if (mainRef.current) {
            mainRef.current.focus()
        }
    }

    const handleLogin = async (e) => {
        e.preventDefault()

        // Validação de campos vazios
        if (!email.trim()) {
            setErro("Por favor, digite seu e-mail.")
            emailRef.current?.focus()
            return
        }

        if (!senha.trim()) {
            setErro("Por favor, digite sua senha.")
            senhaRef.current?.focus()
            return
        }

        if (loading) return

        setErro("")
        setLoading(true)

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email.trim(), senha.trim())
            const user = userCredential.user

            let usuarioNome = user.displayName || ""

            const userDoc = await getDoc(doc(db, "usuarios", user.uid))
            if (userDoc.exists()) {
                usuarioNome = userDoc.data().nome
            }

            localStorage.setItem("usuarioNome", usuarioNome)
            setUsuario({ nome: usuarioNome, email: user.email })

            // Anunciar sucesso para leitores de tela
            const successMessage = `Login realizado com sucesso. Bem-vindo, ${usuarioNome || "usuário"}!`
            announceToScreenReader(successMessage)

            navigate("/logado", { replace: true })
        } catch (error) {
            const mensagensErro = {
                "auth/user-not-found": "Usuário não encontrado. Verifique o e-mail digitado.",
                "auth/wrong-password": "Senha incorreta. Verifique sua senha e tente novamente.",
                "auth/invalid-email": "Formato de e-mail inválido. Digite um e-mail válido.",
                "auth/too-many-requests": "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.",
                "auth/network-request-failed": "Erro de conexão. Verifique sua internet e tente novamente.",
                "auth/invalid-credential": "Credenciais inválidas. Verifique seu e-mail e senha.",
            }
            setErro(mensagensErro[error.code] || "Erro inesperado ao fazer login. Tente novamente.")
        } finally {
            setLoading(false)
        }
    }

    const alternarVisibilidadeSenha = () => {
        setMostrarSenha(!mostrarSenha)
        // Manter foco no campo de senha após alternar visibilidade
        setTimeout(() => {
            senhaRef.current?.focus()
        }, 0)
    }

    // Função para anunciar mensagens para leitores de tela
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

    return (
        <>
            {/* Skip Link */}
            <a href="#main-content" className="skip-link" onClick={skipToMain}>
                Pular para o formulário de login
            </a>

            <div className="page-wrapper">
                <header className="sr-only">
                    <h1>Coffee Grader - Login do Sistema</h1>
                </header>

                <main
                    id="main-content"
                    className="login-container"
                    ref={mainRef}
                    tabIndex="-1"
                    role="main"
                    aria-label="Página de login do Coffee Grader"
                >
                    <div className="login-box" role="region" aria-labelledby="login-title">
                        <div className="login-header">
                            <img
                                src={logo || "/placeholder.svg?height=120&width=120"}
                                alt="Coffee Grader - Sistema de avaliação sensorial de cafés"
                                className="login-logo"
                                width="120"
                                height="120"
                            />
                        </div>

                        <h1 id="login-title" className="login-title">
                            Faça seu Login
                        </h1>

                        <form onSubmit={handleLogin} className="login-form" noValidate>
                            <div className="input-group">
                                <label htmlFor="email" className="input-label">
                                    E-mail *
                                </label>
                                <div className="input-wrapper">
                                    <Mail className="input-icon" aria-hidden="true" size={18} />
                                    <input
                                        ref={emailRef}
                                        id="email"
                                        type="email"
                                        placeholder="Digite seu e-mail"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="login-input"
                                        required
                                        autoComplete="email"
                                        aria-describedby={erro && erro.includes("e-mail") ? "error-message" : undefined}
                                        aria-invalid={erro && erro.includes("e-mail") ? "true" : "false"}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label htmlFor="senha" className="input-label">
                                    Senha *
                                </label>
                                <div className="senha-container input-wrapper">
                                    <Lock className="input-icon" aria-hidden="true" size={18} />
                                    <input
                                        ref={senhaRef}
                                        id="senha"
                                        type={mostrarSenha ? "text" : "password"}
                                        placeholder="Digite sua senha"
                                        value={senha}
                                        onChange={(e) => setSenha(e.target.value)}
                                        className="login-input"
                                        required
                                        autoComplete="current-password"
                                        aria-describedby="password-toggle-desc"
                                        aria-invalid={erro && erro.includes("senha") ? "true" : "false"}
                                    />
                                    <button
                                        type="button"
                                        className="toggle-senha-btn"
                                        onClick={alternarVisibilidadeSenha}
                                        aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                                        aria-describedby="password-toggle-desc"
                                    >
                                        {mostrarSenha ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                                    </button>
                                </div>
                                <div id="password-toggle-desc" className="sr-only">
                                    Use este botão para alternar a visibilidade da senha
                                </div>
                            </div>

                            {erro && (
                                <div
                                    ref={erroRef}
                                    id="error-message"
                                    className="erro-container"
                                    role="alert"
                                    aria-live="assertive"
                                    tabIndex="-1"
                                >
                                    <AlertCircle className="erro-icon" aria-hidden="true" size={18} />
                                    <p className="login-erro">{erro}</p>
                                </div>
                            )}

                            <div className="buttons-container">
                                <button
                                    className={`login-button ${loading ? "login-button-loading" : ""}`}
                                    type="submit"
                                    disabled={loading}
                                    aria-describedby="login-button-desc"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="button-icon loading-icon" aria-hidden="true" size={18} />
                                            <span>Entrando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="button-icon" aria-hidden="true" size={18} />
                                            <span>Fazer Login</span>
                                        </>
                                    )}
                                </button>

                                <div id="login-button-desc" className="sr-only">
                                    {loading ? "Processando login, aguarde..." : "Clique para fazer login no sistema"}
                                </div>

                                <button
                                    className="register-button"
                                    onClick={() => navigate("/cadastro")}
                                    type="button"
                                    aria-describedby="register-button-desc"
                                >
                                    <UserPlus className="button-icon" aria-hidden="true" size={18} />
                                    <span>Criar Conta</span>
                                </button>

                                <div id="register-button-desc" className="sr-only">
                                    Clique para ir para a página de cadastro de nova conta
                                </div>
                            </div>

                            <div className="forgot-password">
                                <button
                                    className="forgot-password-link"
                                    onClick={() => navigate("/esquecisenha")}
                                    type="button"
                                    aria-describedby="forgot-password-desc"
                                >
                                    Esqueci minha senha
                                </button>
                                <div id="forgot-password-desc" className="sr-only">
                                    Clique para ir para a página de recuperação de senha
                                </div>
                            </div>
                        </form>

                        <footer className="app-version" role="contentinfo">
                            <p>
                                <Coffee className="version-icon" aria-hidden="true" size={14} />
                                Coffee Grader versão 1.0
                            </p>
                        </footer>
                    </div>
                </main>
            </div>
        </>
    )
}

export default Login
