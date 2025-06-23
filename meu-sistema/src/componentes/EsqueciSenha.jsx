"use client"

import "./EsqueciSenha.css"
import { useState, useEffect, useRef } from "react"
import { auth } from "../config/firebase"
import { sendPasswordResetEmail } from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { useUser } from "../context/UserContext"
import logo from "../assets/logo.svg"
import { Mail, AlertCircle, CheckCircle, Loader2, X, Coffee, ArrowLeft, RefreshCw, Info, Clock } from "lucide-react"

const EsqueciSenha = () => {
    const { usuario } = useUser()
    const [email, setEmail] = useState("")
    const [mensagem, setMensagem] = useState("")
    const [erro, setErro] = useState("")
    const [loading, setLoading] = useState(false)
    const [emailEnviado, setEmailEnviado] = useState(false)
    const [countdown, setCountdown] = useState(0)
    const navigate = useNavigate()

    // Refs para gerenciamento de foco
    const emailRef = useRef(null)
    const erroRef = useRef(null)
    const sucessoRef = useRef(null)
    const mainRef = useRef(null)

    // Impede usuários logados de acessar
    useEffect(() => {
        if (usuario) {
            navigate("/logado", { replace: true })
        }
    }, [usuario, navigate])

    // Foca no erro quando aparece
    useEffect(() => {
        if (erro && erroRef.current) {
            erroRef.current.focus()
        }
    }, [erro])

    // Foca na mensagem de sucesso quando aparece
    useEffect(() => {
        if (mensagem && sucessoRef.current) {
            sucessoRef.current.focus()
        }
    }, [mensagem])

    // Countdown para redirecionamento
    useEffect(() => {
        let interval = null
        if (emailEnviado && countdown > 0) {
            interval = setInterval(() => {
                setCountdown((prev) => prev - 1)
            }, 1000)
        } else if (countdown === 0 && emailEnviado) {
            navigate("/login")
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [countdown, emailEnviado, navigate])

    const skipToMain = (e) => {
        e.preventDefault()
        if (mainRef.current) {
            mainRef.current.focus()
        }
    }

    const validarEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return regex.test(email)
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        setMensagem("")
        setErro("")
        setLoading(true)

        const emailTrimmed = email.trim()

        // Validação de email
        if (!emailTrimmed) {
            setErro("Por favor, digite seu e-mail.")
            emailRef.current?.focus()
            setLoading(false)
            return
        }

        if (!validarEmail(emailTrimmed)) {
            setErro("Por favor, digite um e-mail válido.")
            emailRef.current?.focus()
            setLoading(false)
            return
        }

        try {
            await sendPasswordResetEmail(auth, emailTrimmed)
            setMensagem(
                `Um link para redefinir sua senha foi enviado para ${emailTrimmed}. Verifique sua caixa de entrada e spam.`,
            )
            setEmailEnviado(true)
            setCountdown(5) // 5 segundos para redirecionamento

            // Anunciar sucesso para leitores de tela
            announceToScreenReader(
                `E-mail de recuperação enviado com sucesso para ${emailTrimmed}. Você será redirecionado para a página de login em 5 segundos.`,
            )
        } catch (error) {
            console.error("Erro ao enviar email de recuperação:", error)
            const mensagensErro = {
                "auth/user-not-found": "Este e-mail não está cadastrado em nosso sistema.",
                "auth/invalid-email": "Por favor, digite um e-mail válido.",
                "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
                "auth/network-request-failed": "Erro de conexão. Verifique sua internet e tente novamente.",
            }
            setErro(mensagensErro[error.code] || "Erro inesperado ao enviar e-mail. Tente novamente mais tarde.")
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        navigate("/login")
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

    return (
        <>
            {/* Skip Link */}
            <a href="#main-content" className="skip-link" onClick={skipToMain}>
                Pular para o formulário de recuperação de senha
            </a>

            <div className="page-wrapper">
                <header className="sr-only">
                    <h1>Coffee Grader - Recuperação de Senha</h1>
                </header>

                <main
                    id="main-content"
                    className="esqueci-container"
                    ref={mainRef}
                    tabIndex="-1"
                    role="main"
                    aria-label="Página de recuperação de senha do Coffee Grader"
                >
                    <div className="esqueci-box" role="region" aria-labelledby="esqueci-title">
                        <div className="esqueci-header">
                            <button
                                className="fechar"
                                onClick={handleClose}
                                aria-label="Fechar formulário de recuperação e voltar ao login"
                                type="button"
                            >
                                <X size={16} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="logo-container">
                            <img
                                src={logo || "/placeholder.svg?height=120&width=120"}
                                alt="Coffee Grader - Sistema de avaliação sensorial de cafés"
                                className="esqueci-logo"
                                width="120"
                                height="120"
                            />
                        </div>

                        <h1 id="esqueci-title" className="esqueci-title">
                            Recuperar Senha
                        </h1>

                        {/* Informações sobre o processo */}
                        <div className="info-box" role="region" aria-label="Informações sobre recuperação de senha">
                            <Info className="info-icon" aria-hidden="true" size={18} />
                            <p className="info-text">
                                Digite seu e-mail cadastrado e enviaremos um link seguro para redefinir sua senha.
                            </p>
                        </div>

                        <form onSubmit={handleResetPassword} className="esqueci-form" noValidate>
                            <div className="input-group">
                                <label htmlFor="email" className="input-label">
                                    E-mail Cadastrado *
                                </label>
                                <div className="input-wrapper">
                                    <Mail className="input-icon" aria-hidden="true" size={18} />
                                    <input
                                        ref={emailRef}
                                        id="email"
                                        type="email"
                                        placeholder="Digite seu e-mail cadastrado"
                                        className="esqueci-input"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                        aria-describedby="email-desc"
                                        aria-invalid={erro && erro.includes("e-mail") ? "true" : "false"}
                                        disabled={emailEnviado}
                                    />
                                </div>
                                <div id="email-desc" className="sr-only">
                                    Digite o e-mail que você usou para criar sua conta
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
                                    <p className="erro-mensagem">{erro}</p>
                                </div>
                            )}

                            {mensagem && (
                                <div
                                    ref={sucessoRef}
                                    id="success-message"
                                    className="sucesso-container"
                                    role="status"
                                    aria-live="polite"
                                    tabIndex="-1"
                                >
                                    <CheckCircle className="sucesso-icon" aria-hidden="true" size={18} />
                                    <div className="sucesso-content">
                                        <p className="sucesso-mensagem">{mensagem}</p>
                                        {countdown > 0 && (
                                            <div className="countdown" aria-live="polite">
                                                <Clock className="countdown-icon" aria-hidden="true" size={14} />
                                                <span>Redirecionando em {countdown} segundos...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button
                                className={`esqueci-botao ${loading ? "esqueci-botao-loading" : ""}`}
                                type="submit"
                                disabled={loading || emailEnviado}
                                aria-describedby="botao-desc"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="button-icon loading-icon" aria-hidden="true" size={18} />
                                        <span>Enviando...</span>
                                    </>
                                ) : emailEnviado ? (
                                    <>
                                        <CheckCircle className="button-icon" aria-hidden="true" size={18} />
                                        <span>E-mail Enviado</span>
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="button-icon" aria-hidden="true" size={18} />
                                        <span>Enviar Link de Recuperação</span>
                                    </>
                                )}
                            </button>

                            <div id="botao-desc" className="sr-only">
                                {loading
                                    ? "Enviando e-mail de recuperação, aguarde..."
                                    : emailEnviado
                                        ? "E-mail de recuperação enviado com sucesso"
                                        : "Clique para enviar o link de recuperação para seu e-mail"}
                            </div>
                        </form>

                        {/* Instruções adicionais */}
                        <div className="instructions" role="region" aria-label="Instruções adicionais">
                            <h2 className="instructions-title">Próximos passos:</h2>
                            <ol className="instructions-list">
                                <li>Verifique sua caixa de entrada</li>
                                <li>Procure também na pasta de spam</li>
                                <li>Clique no link recebido</li>
                                <li>Defina uma nova senha segura</li>
                            </ol>
                        </div>

                        <div className="login-link">
                            <p>
                                Lembrou sua senha?{" "}
                                <button
                                    type="button"
                                    onClick={() => navigate("/login")}
                                    className="login-link-button"
                                    aria-describedby="login-link-desc"
                                >
                                    <ArrowLeft size={14} aria-hidden="true" />
                                    Voltar para login
                                </button>
                            </p>
                            <div id="login-link-desc" className="sr-only">
                                Clique para voltar à página de login
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
            </div>
        </>
    )
}

export default EsqueciSenha
