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
    const [carregando, setCarregando] = useState(false)
    const [mostrarSenha, setMostrarSenha] = useState(false)

    // ✅ NOVOS ESTADOS para melhor UX
    const [logoCarregado, setLogoCarregado] = useState(false)
    const [logoErro, setLogoErro] = useState(false)
    const [animacaoCompleta, setAnimacaoCompleta] = useState(false)
    const [tentativasLogin, setTentativasLogin] = useState(0)
    const [bloqueado, setBloqueado] = useState(false)
    const [tempoRestante, setTempoRestante] = useState(0)

    const navegar = useNavigate()

    // Refs para gerenciamento de foco
    const refEmail = useRef(null)
    const refSenha = useRef(null)
    const refErro = useRef(null)
    const refPrincipal = useRef(null)

    // ✅ NOVO: Controle de animação
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimacaoCompleta(true)
        }, 600) // Tempo da animação fadeInUp

        return () => clearTimeout(timer)
    }, [])

    // Redireciona se já estiver logado
    useEffect(() => {
        if (usuario) {
            navegar("/logado", { replace: true })
        }
    }, [usuario, navegar])

    // Foca no primeiro erro quando aparece
    useEffect(() => {
        if (erro && refErro.current) {
            refErro.current.focus()
        }
    }, [erro])

    // ✅ NOVO: Sistema de bloqueio por tentativas
    useEffect(() => {
        if (bloqueado && tempoRestante > 0) {
            const timer = setInterval(() => {
                setTempoRestante((prev) => {
                    if (prev <= 1) {
                        setBloqueado(false)
                        setTentativasLogin(0)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)

            return () => clearInterval(timer)
        }
    }, [bloqueado, tempoRestante])

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
    const validarCampos = () => {
        if (!email.trim()) {
            setErro("Por favor, digite seu e-mail.")
            refEmail.current?.focus()
            return false
        }

        // Validação básica de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email.trim())) {
            setErro("Por favor, digite um e-mail válido.")
            refEmail.current?.focus()
            return false
        }

        if (!senha.trim()) {
            setErro("Por favor, digite sua senha.")
            refSenha.current?.focus()
            return false
        }

        if (senha.length < 6) {
            setErro("A senha deve ter pelo menos 6 caracteres.")
            refSenha.current?.focus()
            return false
        }

        return true
    }

    // ✅ MELHORADO: Função de login com melhor tratamento de erro
    const manipularLogin = async (evento) => {
        evento.preventDefault()

        if (bloqueado) {
            setErro(`Muitas tentativas. Aguarde ${tempoRestante} segundos.`)
            return
        }

        if (!validarCampos()) return
        if (carregando) return

        setErro("")
        setCarregando(true)

        try {
            const credencialUsuario = await signInWithEmailAndPassword(auth, email.trim(), senha.trim())
            const usuario = credencialUsuario.user

            let nomeUsuario = usuario.displayName || ""

            // Buscar nome no Firestore
            try {
                const documentoUsuario = await getDoc(doc(db, "usuarios", usuario.uid))
                if (documentoUsuario.exists()) {
                    nomeUsuario = documentoUsuario.data().nome || nomeUsuario
                }
            } catch (firestoreError) {
                console.warn("Erro ao buscar dados do usuário no Firestore:", firestoreError)
                // Continua com o login mesmo se não conseguir buscar o nome
            }

            localStorage.setItem("usuarioNome", nomeUsuario)
            setUsuario({ nome: nomeUsuario, email: usuario.email })

            // Resetar tentativas em caso de sucesso
            setTentativasLogin(0)
            setBloqueado(false)

            // Anunciar sucesso para leitores de tela
            const mensagemSucesso = `Login realizado com sucesso. Bem-vindo, ${nomeUsuario || "usuário"}!`
            anunciarParaLeitorTela(mensagemSucesso)

            // Pequeno delay para mostrar feedback antes de navegar
            setTimeout(() => {
                navegar("/logado", { replace: true })
            }, 500)
        } catch (error) {
            console.error("Erro no login:", error)

            // ✅ NOVO: Controle de tentativas
            const novasTentativas = tentativasLogin + 1
            setTentativasLogin(novasTentativas)

            if (novasTentativas >= 5) {
                setBloqueado(true)
                setTempoRestante(300) // 5 minutos
                setErro("Muitas tentativas de login. Conta bloqueada por 5 minutos.")
            } else {
                const mensagensErro = {
                    "auth/user-not-found": "Usuário não encontrado. Verifique o e-mail digitado.",
                    "auth/wrong-password": "Senha incorreta. Verifique sua senha e tente novamente.",
                    "auth/invalid-email": "Formato de e-mail inválido. Digite um e-mail válido.",
                    "auth/too-many-requests": "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.",
                    "auth/network-request-failed": "Erro de conexão. Verifique sua internet e tente novamente.",
                    "auth/invalid-credential": "Credenciais inválidas. Verifique seu e-mail e senha.",
                    "auth/user-disabled": "Esta conta foi desabilitada. Entre em contato com o suporte.",
                    "auth/operation-not-allowed": "Operação não permitida. Entre em contato com o suporte.",
                }

                const mensagemErro =
                    mensagensErro[error.code] || `Erro inesperado ao fazer login: ${error.message || "Tente novamente."}`

                const tentativasRestantes = 5 - novasTentativas
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

    const alternarVisibilidadeSenha = () => {
        setMostrarSenha(!mostrarSenha)
        // Manter foco no campo de senha após alternar visibilidade
        setTimeout(() => {
            refSenha.current?.focus()
        }, 0)
    }

    // ✅ MELHORADO: Navegação com feedback
    const handleNavegar = async (rota) => {
        try {
            await new Promise((resolve) => setTimeout(resolve, 200))
            navegar(rota)
        } catch (error) {
            console.error("Erro ao navegar:", error)
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

    // Função para anunciar mensagens para leitores de tela
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

    return (
        <>
            <div className="container-pagina">
                <header className="apenas-leitor-tela">
                    <h1>Coffee Grader - Login do Sistema</h1>
                </header>

                <main
                    id="conteudo-principal"
                    className="container-login"
                    ref={refPrincipal}
                    tabIndex="-1"
                    role="main"
                    aria-label="Página de login do Coffee Grader"
                >
                    <div
                        className={`caixa-login ${animacaoCompleta ? "animacao-completa" : ""}`}
                        role="region"
                        aria-labelledby="titulo-login"
                    >
                        {/* ✅ MELHORADO: Container do logo com estados */}
                        <div className="cabecalho-login">
                            {!logoCarregado && !logoErro && (
                                <div className="logo-loading" aria-label="Carregando logo">
                                    <div className="logo-skeleton"></div>
                                </div>
                            )}

                            {logoErro ? (
                                <div className="logo-fallback" aria-label="Logo Coffee Grader">
                                    <Coffee size={60} className="icone-logo-fallback" />
                                    <span className="texto-logo-fallback">Coffee Grader</span>
                                </div>
                            ) : (
                                <img
                                    src={logo || "/placeholder.svg?height=120&width=120"}
                                    alt="Coffee Grader - Sistema de avaliação sensorial de cafés"
                                    className={`logo-login ${logoCarregado ? "logo-carregado" : "logo-carregando"}`}
                                    width="120"
                                    height="120"
                                    onLoad={handleLogoLoad}
                                    onError={handleLogoError}
                                    loading="eager"
                                />
                            )}
                        </div>

                        <h1 id="titulo-login" className="titulo-login">
                            Faça seu Login
                        </h1>

                        <form onSubmit={manipularLogin} className="formulario-login" noValidate>
                            <div className="grupo-input">
                                <label htmlFor="email" className="rotulo-input">
                                    E-mail *
                                </label>
                                <div className="wrapper-input">
                                    <Mail className="icone-input" aria-hidden="true" size={18} />
                                    <input
                                        ref={refEmail}
                                        id="email"
                                        type="email"
                                        placeholder="Digite seu e-mail"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value)
                                            if (erro && erro.includes("e-mail")) {
                                                setErro("")
                                            }
                                        }}
                                        className="input-login"
                                        required
                                        autoComplete="email"
                                        aria-describedby={erro && erro.includes("e-mail") ? "mensagem-erro" : undefined}
                                        aria-invalid={erro && erro.includes("e-mail") ? "true" : "false"}
                                        disabled={carregando || bloqueado}
                                    />
                                </div>
                            </div>

                            <div className="grupo-input">
                                <label htmlFor="senha" className="rotulo-input">
                                    Senha *
                                </label>
                                <div className="container-senha wrapper-input">
                                    <Lock className="icone-input" aria-hidden="true" size={18} />
                                    <input
                                        ref={refSenha}
                                        id="senha"
                                        type={mostrarSenha ? "text" : "password"}
                                        placeholder="Digite sua senha"
                                        value={senha}
                                        onChange={(e) => {
                                            setSenha(e.target.value)
                                            if (erro && erro.includes("senha")) {
                                                setErro("")
                                            }
                                        }}
                                        className="input-login"
                                        required
                                        autoComplete="current-password"
                                        aria-describedby="descricao-alternar-senha"
                                        aria-invalid={erro && erro.includes("senha") ? "true" : "false"}
                                        disabled={carregando || bloqueado}
                                    />
                                    <button
                                        type="button"
                                        className="botao-alternar-senha"
                                        onClick={alternarVisibilidadeSenha}
                                        aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                                        aria-describedby="descricao-alternar-senha"
                                        disabled={carregando || bloqueado}
                                    >
                                        {mostrarSenha ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                                    </button>
                                </div>
                                <div id="descricao-alternar-senha" className="apenas-leitor-tela">
                                    Use este botão para alternar a visibilidade da senha
                                </div>
                            </div>

                            {/* ✅ MELHORADO: Container de erro com mais informações */}
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
                                        <p className="erro-login">{erro}</p>
                                        {bloqueado && tempoRestante > 0 && (
                                            <p className="tempo-bloqueio">Tempo restante: {formatarTempo(tempoRestante)}</p>
                                        )}
                                        {tentativasLogin > 0 && tentativasLogin < 5 && !bloqueado && (
                                            <p className="tentativas-restantes">Tentativas restantes: {5 - tentativasLogin}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="container-botoes">
                                <button
                                    className={`botao-login ${carregando ? "botao-login-carregando" : ""} ${bloqueado ? "botao-bloqueado" : ""
                                        }`}
                                    type="submit"
                                    disabled={carregando || bloqueado}
                                    aria-describedby="descricao-botao-login"
                                >
                                    {carregando ? (
                                        <>
                                            <Loader2 className="icone-botao icone-carregando" aria-hidden="true" size={18} />
                                            <span>Entrando...</span>
                                        </>
                                    ) : bloqueado ? (
                                        <>
                                            <Lock className="icone-botao" aria-hidden="true" size={18} />
                                            <span>Bloqueado</span>
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="icone-botao" aria-hidden="true" size={18} />
                                            <span>Fazer Login</span>
                                        </>
                                    )}
                                </button>

                                <div id="descricao-botao-login" className="apenas-leitor-tela">
                                    {carregando
                                        ? "Processando login, aguarde..."
                                        : bloqueado
                                            ? "Botão bloqueado devido a muitas tentativas"
                                            : "Clique para fazer login no sistema"}
                                </div>

                                <button
                                    className="botao-cadastro"
                                    onClick={() => handleNavegar("/cadastro")}
                                    type="button"
                                    aria-describedby="descricao-botao-cadastro"
                                    disabled={carregando}
                                >
                                    <UserPlus className="icone-botao" aria-hidden="true" size={18} />
                                    <span>Criar Conta</span>
                                </button>

                                <div id="descricao-botao-cadastro" className="apenas-leitor-tela">
                                    Clique para ir para a página de cadastro de nova conta
                                </div>
                            </div>

                            <div className="esqueci-senha">
                                <button
                                    className="link-esqueci-senha"
                                    onClick={() => handleNavegar("/esquecisenha")}
                                    type="button"
                                    aria-describedby="descricao-esqueci-senha"
                                    disabled={carregando}
                                >
                                    Esqueci minha senha
                                </button>
                                <div id="descricao-esqueci-senha" className="apenas-leitor-tela">
                                    Clique para ir para a página de recuperação de senha
                                </div>
                            </div>
                        </form>

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

export default Login
