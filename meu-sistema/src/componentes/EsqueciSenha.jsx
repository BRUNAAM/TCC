"use client"

import "./EsqueciSenha.css"
import { useState, useEffect, useRef } from "react"
import { auth } from "../config/firebase"
import { sendPasswordResetEmail } from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { useUser } from "../context/UserContext"
import logo from "../assets/logo.svg"
import {
    Mail,
    AlertCircle,
    CheckCircle,
    Loader2,
    X,
    Coffee,
    ArrowLeft,
    RefreshCw,
    Info,
    Clock,
    Shield,
} from "lucide-react"

const EsqueciSenha = () => {
    const { usuario } = useUser()
    const [email, setEmail] = useState("")
    const [mensagem, setMensagem] = useState("")
    const [erro, setErro] = useState("")
    const [carregando, setCarregando] = useState(false)
    const [emailEnviado, setEmailEnviado] = useState(false)
    const [contadorRegressivo, setContadorRegressivo] = useState(0)

    // ✅ NOVOS ESTADOS para melhor UX
    const [logoCarregado, setLogoCarregado] = useState(false)
    const [logoErro, setLogoErro] = useState(false)
    const [animacaoCompleta, setAnimacaoCompleta] = useState(false)
    const [tentativasEnvio, setTentativasEnvio] = useState(0)
    const [bloqueado, setBloqueado] = useState(false)
    const [tempoRestante, setTempoRestante] = useState(0)
    const [navegando, setNavegando] = useState(false)

    const navegar = useNavigate()

    // Refs para gerenciamento de foco
    const refEmail = useRef(null)
    const refErro = useRef(null)
    const refSucesso = useRef(null)
    const refPrincipal = useRef(null)

    // ✅ NOVO: Controle de animação
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimacaoCompleta(true)
        }, 600)

        return () => clearTimeout(timer)
    }, [])

    // Impede usuários logados de acessar
    useEffect(() => {
        if (usuario) {
            navegar("/logado", { replace: true })
        }
    }, [usuario, navegar])

    // Foca no erro quando aparece
    useEffect(() => {
        if (erro && refErro.current) {
            refErro.current.focus()
        }
    }, [erro])

    // Foca na mensagem de sucesso quando aparece
    useEffect(() => {
        if (mensagem && refSucesso.current) {
            refSucesso.current.focus()
        }
    }, [mensagem])

    // ✅ NOVO: Sistema de bloqueio por tentativas
    useEffect(() => {
        if (bloqueado && tempoRestante > 0) {
            const timer = setInterval(() => {
                setTempoRestante((prev) => {
                    if (prev <= 1) {
                        setBloqueado(false)
                        setTentativasEnvio(0)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)

            return () => clearInterval(timer)
        }
    }, [bloqueado, tempoRestante])

    // Countdown para redirecionamento
    useEffect(() => {
        let intervalo = null
        if (emailEnviado && contadorRegressivo > 0) {
            intervalo = setInterval(() => {
                setContadorRegressivo((anterior) => anterior - 1)
            }, 1000)
        } else if (contadorRegressivo === 0 && emailEnviado) {
            navegar("/login")
        }
        return () => {
            if (intervalo) clearInterval(intervalo)
        }
    }, [contadorRegressivo, emailEnviado, navegar])

    // ✅ NOVO: Detectar se é dispositivo móvel
    const isMobile = () => {
        return (
            window.innerWidth <= 768 ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        )
    }

    // ✅ NOVO: Otimizar performance em mobile
    useEffect(() => {
        if (isMobile()) {
            document.documentElement.style.setProperty("--transicao-padrao", "all 0.2s ease")
        }
    }, [])

    // ✅ MELHORADO: Validação mais robusta
    const validarEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return regex.test(email.trim())
    }

    // ✅ MELHORADO: Função com controle de tentativas
    const manipularRedefinirSenha = async (evento) => {
        evento.preventDefault()

        if (bloqueado) {
            setErro(`Muitas tentativas. Aguarde ${formatarTempo(tempoRestante)} para tentar novamente.`)
            return
        }

        if (emailEnviado) return

        setMensagem("")
        setErro("")
        setCarregando(true)

        const emailLimpo = email.trim()

        // Validação de email
        if (!emailLimpo) {
            setErro("Por favor, digite seu e-mail.")
            refEmail.current?.focus()
            setCarregando(false)
            return
        }

        if (!validarEmail(emailLimpo)) {
            setErro("Por favor, digite um e-mail válido.")
            refEmail.current?.focus()
            setCarregando(false)
            return
        }

        try {
            await sendPasswordResetEmail(auth, emailLimpo)

            setMensagem(
                `Um link para redefinir sua senha foi enviado para ${emailLimpo}. Verifique sua caixa de entrada e spam.`,
            )
            setEmailEnviado(true)
            setContadorRegressivo(5) // 5 segundos para redirecionamento

            // Resetar tentativas em caso de sucesso
            setTentativasEnvio(0)
            setBloqueado(false)

            // Anunciar sucesso para leitores de tela
            anunciarParaLeitorTela(
                `E-mail de recuperação enviado com sucesso para ${emailLimpo}. Você será redirecionado para a página de login em 5 segundos.`,
            )
        } catch (error) {
            console.error("Erro ao enviar email de recuperação:", error)

            // ✅ NOVO: Controle de tentativas
            const novasTentativas = tentativasEnvio + 1
            setTentativasEnvio(novasTentativas)

            if (novasTentativas >= 3) {
                setBloqueado(true)
                setTempoRestante(180) // 3 minutos
                setErro("Muitas tentativas de recuperação. Aguarde 3 minutos para tentar novamente.")
            } else {
                const mensagensErro = {
                    "auth/user-not-found": "Este e-mail não está cadastrado em nosso sistema.",
                    "auth/invalid-email": "Por favor, digite um e-mail válido.",
                    "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
                    "auth/network-request-failed": "Erro de conexão. Verifique sua internet e tente novamente.",
                    "auth/quota-exceeded": "Limite de e-mails excedido. Tente novamente mais tarde.",
                }

                const mensagemErro =
                    mensagensErro[error.code] ||
                    `Erro inesperado ao enviar e-mail: ${error.message || "Tente novamente mais tarde."}`

                const tentativasRestantes = 3 - novasTentativas
                if (tentativasRestantes > 0) {
                    setErro(`${mensagemErro} (${tentativasRestantes} tentativas restantes)`)
                } else {
                    setErro(mensagemErro)
                }
            }
        } finally {
            setCarregando(false)
        }
    }

    // ✅ MELHORADO: Navegação com feedback
    const manipularFechar = async () => {
        try {
            setNavegando(true)
            await new Promise((resolve) => setTimeout(resolve, 200))
            navegar("/login")
        } catch (error) {
            console.error("Erro ao navegar:", error)
            setNavegando(false)
        }
    }

    const handleNavegar = async (rota) => {
        try {
            setNavegando(true)
            await new Promise((resolve) => setTimeout(resolve, 200))
            navegar(rota)
        } catch (error) {
            console.error("Erro ao navegar:", error)
            setNavegando(false)
        }
    }

    // ✅ NOVOS: Handlers para o logo
    const handleLogoLoad = () => {
        setLogoCarregado(true)
        setLogoErro(false)
    }

    const handleLogoError = () => {
        setLogoErro(true)
        setLogoCarregado(false)
        console.warn("Erro ao carregar logo, usando fallback")
    }

    const anunciarParaLeitorTela = (mensagem) => {
        const anuncio = document.createElement("div")
        anuncio.setAttribute("aria-live", "polite")
        anuncio.setAttribute("aria-atomic", "true")
        anuncio.className = "apenas-leitor-tela"
        anuncio.textContent = mensagem
        document.body.appendChild(anuncio)
        setTimeout(() => {
            if (document.body.contains(anuncio)) {
                document.body.removeChild(anuncio)
            }
        }, 1000)
    }

    // ✅ NOVO: Formatação do tempo restante
    const formatarTempo = (segundos) => {
        const minutos = Math.floor(segundos / 60)
        const segs = segundos % 60
        return `${minutos}:${segs.toString().padStart(2, "0")}`
    }

    // ✅ NOVO: Limpar erro quando usuário digita
    const handleEmailChange = (e) => {
        setEmail(e.target.value)
        if (erro && (erro.includes("e-mail") || erro.includes("email"))) {
            setErro("")
        }
    }

    return (
        <>
            <div className="container-pagina">
                <header className="apenas-leitor-tela">
                    <h1>Coffee Grader - Recuperação de Senha</h1>
                </header>

                <main
                    id="conteudo-principal"
                    className="container-esqueci"
                    ref={refPrincipal}
                    tabIndex="-1"
                    role="main"
                    aria-label="Página de recuperação de senha do Coffee Grader"
                >
                    <div
                        className={`caixa-esqueci ${animacaoCompleta ? "animacao-completa" : ""}`}
                        role="region"
                        aria-labelledby="titulo-esqueci"
                    >
                        <div className="cabecalho-esqueci">
                            <button
                                className={`botao-fechar ${navegando ? "navegando" : ""}`}
                                onClick={manipularFechar}
                                aria-label="Fechar formulário de recuperação e voltar ao login"
                                type="button"
                                disabled={carregando || navegando}
                            >
                                {navegando ? <Loader2 size={16} className="icone-carregando" /> : <X size={16} aria-hidden="true" />}
                            </button>
                        </div>

                        {/* ✅ MELHORADO: Container do logo com estados */}
                        <div className="container-logo">
                            {!logoCarregado && !logoErro && (
                                <div className="logo-loading" aria-label="Carregando logo">
                                    <div className="logo-skeleton"></div>
                                </div>
                            )}

                            {logoErro ? (
                                <div className="logo-fallback" aria-label="Logo Coffee Grader">
                                    <Coffee size={50} className="icone-logo-fallback" />
                                    <span className="texto-logo-fallback">Coffee Grader</span>
                                </div>
                            ) : (
                                <img
                                    src={logo || "/placeholder.svg?height=100&width=100"}
                                    alt="Coffee Grader - Sistema de avaliação sensorial de cafés"
                                    className={`logo-esqueci ${logoCarregado ? "logo-carregado" : "logo-carregando"}`}
                                    width="100"
                                    height="100"
                                    onLoad={handleLogoLoad}
                                    onError={handleLogoError}
                                    loading="eager"
                                />
                            )}
                        </div>

                        <h1 id="titulo-esqueci" className="titulo-esqueci">
                            Recuperar Senha
                        </h1>

                        {/* Informações sobre o processo */}
                        <div className="caixa-info" role="region" aria-label="Informações sobre recuperação de senha">
                            <Info className="icone-info" aria-hidden="true" size={18} />
                            <p className="texto-info">
                                Digite seu e-mail cadastrado e enviaremos um link seguro para redefinir sua senha.
                            </p>
                        </div>

                        <form onSubmit={manipularRedefinirSenha} className="formulario-esqueci" noValidate>
                            <div className="grupo-input">
                                <label htmlFor="email" className="rotulo-input">
                                    E-mail Cadastrado *
                                </label>
                                <div className="wrapper-input">
                                    <Mail className="icone-input" aria-hidden="true" size={18} />
                                    <input
                                        ref={refEmail}
                                        id="email"
                                        type="email"
                                        placeholder="Digite seu e-mail cadastrado"
                                        className="input-esqueci"
                                        value={email}
                                        onChange={handleEmailChange}
                                        required
                                        autoComplete="email"
                                        aria-describedby="descricao-email"
                                        aria-invalid={erro && erro.includes("e-mail") ? "true" : "false"}
                                        disabled={emailEnviado || carregando || bloqueado}
                                    />
                                </div>
                                <div id="descricao-email" className="apenas-leitor-tela">
                                    Digite o e-mail que você usou para criar sua conta
                                </div>
                            </div>

                            {erro && (
                                <div
                                    ref={refErro}
                                    id="mensagem-erro"
                                    className={`container-erro ${bloqueado ? "erro-bloqueio" : ""}`}
                                    role="alert"
                                    aria-live="assertive"
                                    tabIndex="-1"
                                >
                                    <AlertCircle className="icone-erro" aria-hidden="true" size={18} />
                                    <div className="conteudo-erro">
                                        <p className="mensagem-erro">{erro}</p>
                                        {bloqueado && tempoRestante > 0 && (
                                            <p className="tempo-bloqueio">Tempo restante: {formatarTempo(tempoRestante)}</p>
                                        )}
                                        {tentativasEnvio > 0 && tentativasEnvio < 3 && !bloqueado && (
                                            <p className="tentativas-restantes">Tentativas restantes: {3 - tentativasEnvio}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {mensagem && (
                                <div
                                    ref={refSucesso}
                                    id="mensagem-sucesso"
                                    className="container-sucesso"
                                    role="status"
                                    aria-live="polite"
                                    tabIndex="-1"
                                >
                                    <CheckCircle className="icone-sucesso" aria-hidden="true" size={18} />
                                    <div className="conteudo-sucesso">
                                        <p className="mensagem-sucesso">{mensagem}</p>
                                        {contadorRegressivo > 0 && (
                                            <div className="contador-regressivo" aria-live="polite">
                                                <Clock className="icone-contador" aria-hidden="true" size={14} />
                                                <span>Redirecionando em {contadorRegressivo} segundos...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button
                                className={`botao-esqueci ${carregando ? "botao-esqueci-carregando" : ""} ${bloqueado ? "botao-bloqueado" : ""
                                    }`}
                                type="submit"
                                disabled={carregando || emailEnviado || bloqueado}
                                aria-describedby="descricao-botao"
                            >
                                {carregando ? (
                                    <>
                                        <Loader2 className="icone-botao icone-carregando" aria-hidden="true" size={18} />
                                        <span>Enviando...</span>
                                    </>
                                ) : emailEnviado ? (
                                    <>
                                        <CheckCircle className="icone-botao" aria-hidden="true" size={18} />
                                        <span>E-mail Enviado</span>
                                    </>
                                ) : bloqueado ? (
                                    <>
                                        <Shield className="icone-botao" aria-hidden="true" size={18} />
                                        <span>Bloqueado</span>
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="icone-botao" aria-hidden="true" size={18} />
                                        <span>Enviar Link de Recuperação</span>
                                    </>
                                )}
                            </button>

                            <div id="descricao-botao" className="apenas-leitor-tela">
                                {carregando
                                    ? "Enviando e-mail de recuperação, aguarde..."
                                    : emailEnviado
                                        ? "E-mail de recuperação enviado com sucesso"
                                        : bloqueado
                                            ? "Botão bloqueado devido a muitas tentativas"
                                            : "Clique para enviar o link de recuperação para seu e-mail"}
                            </div>
                        </form>

                        {/* Instruções adicionais */}
                        <div className="instrucoes" role="region" aria-label="Instruções adicionais">
                            <h2 className="titulo-instrucoes">Próximos passos:</h2>
                            <ol className="lista-instrucoes">
                                <li>Verifique sua caixa de entrada</li>
                                <li>Procure também na pasta de spam</li>
                                <li>Clique no link recebido</li>
                                <li>Defina uma nova senha segura</li>
                            </ol>
                        </div>

                        <div className="link-login">
                            <p>
                                Lembrou sua senha?{" "}
                                <button
                                    type="button"
                                    onClick={() => handleNavegar("/login")}
                                    className="botao-link-login"
                                    aria-describedby="descricao-link-login"
                                    disabled={carregando || navegando}
                                >
                                    <ArrowLeft size={14} aria-hidden="true" />
                                    Voltar para login
                                </button>
                            </p>
                            <div id="descricao-link-login" className="apenas-leitor-tela">
                                Clique para voltar à página de login
                            </div>
                        </div>

                        <footer className="versao-aplicativo" role="contentinfo">
                            <p>
                                <Coffee className="icone-versao" aria-hidden="true" size={14} />
                                <span>Coffee Grader versão 1.0</span>
                            </p>
                        </footer>
                    </div>
                </main>
            </div>

            {/* ✅ NOVO: Preloader para melhor UX */}
            {!animacaoCompleta && (
                <div className="preloader" aria-hidden="true">
                    <div className="preloader-content">
                        <Coffee className="preloader-icon" size={40} />
                        <span className="preloader-text">Carregando...</span>
                    </div>
                </div>
            )}
        </>
    )
}

export default EsqueciSenha
