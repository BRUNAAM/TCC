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
    const navegar = useNavigate()

    // Refs para gerenciamento de foco
    const refEmail = useRef(null)
    const refSenha = useRef(null)
    const refErro = useRef(null)
    const refPrincipal = useRef(null)

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

    const pularParaPrincipal = (evento) => {
        evento.preventDefault()
        if (refPrincipal.current) {
            refPrincipal.current.focus()
        }
    }

    const manipularLogin = async (evento) => {
        evento.preventDefault()

        // Validação de campos vazios
        if (!email.trim()) {
            setErro("Por favor, digite seu e-mail.")
            refEmail.current?.focus()
            return
        }

        if (!senha.trim()) {
            setErro("Por favor, digite sua senha.")
            refSenha.current?.focus()
            return
        }

        if (carregando) return

        setErro("")
        setCarregando(true)

        try {
            const credencialUsuario = await signInWithEmailAndPassword(auth, email.trim(), senha.trim())
            const usuario = credencialUsuario.user

            let nomeUsuario = usuario.displayName || ""

            const documentoUsuario = await getDoc(doc(db, "usuarios", usuario.uid))

            if (documentoUsuario.exists()) {
                nomeUsuario = documentoUsuario.data().nome
            }

            localStorage.setItem("usuarioNome", nomeUsuario)
            setUsuario({ nome: nomeUsuario, email: usuario.email })

            // Anunciar sucesso para leitores de tela
            const mensagemSucesso = `Login realizado com sucesso. Bem-vindo, ${nomeUsuario || "usuário"}!`
            anunciarParaLeitorTela(mensagemSucesso)

            navegar("/logado", { replace: true })
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

    // Função para anunciar mensagens para leitores de tela
    const anunciarParaLeitorTela = (mensagem) => {
        const anuncio = document.createElement("div")
        anuncio.setAttribute("aria-live", "polite")
        anuncio.setAttribute("aria-atomic", "true")
        anuncio.className = "apenas-leitor-tela"
        anuncio.textContent = mensagem
        document.body.appendChild(anuncio)

        setTimeout(() => {
            document.body.removeChild(anuncio)
        }, 1000)
    }

    return (
        <>
            {/* Link para pular conteúdo */}
            <a href="#conteudo-principal" className="link-pular" onClick={pularParaPrincipal}>
                Pular para o formulário de login
            </a>

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
                    <div className="caixa-login" role="region" aria-labelledby="titulo-login">
                        <div className="cabecalho-login">
                            <img
                                src={logo || "/placeholder.svg?height=120&width=120"}
                                alt="Coffee Grader - Sistema de avaliação sensorial de cafés"
                                className="logo-login"
                                width="120"
                                height="120"
                            />
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
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="input-login"
                                        required
                                        autoComplete="email"
                                        aria-describedby={erro && erro.includes("e-mail") ? "mensagem-erro" : undefined}
                                        aria-invalid={erro && erro.includes("e-mail") ? "true" : "false"}
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
                                        onChange={(e) => setSenha(e.target.value)}
                                        className="input-login"
                                        required
                                        autoComplete="current-password"
                                        aria-describedby="descricao-alternar-senha"
                                        aria-invalid={erro && erro.includes("senha") ? "true" : "false"}
                                    />
                                    <button
                                        type="button"
                                        className="botao-alternar-senha"
                                        onClick={alternarVisibilidadeSenha}
                                        aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                                        aria-describedby="descricao-alternar-senha"
                                    >
                                        {mostrarSenha ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                                    </button>
                                </div>
                                <div id="descricao-alternar-senha" className="apenas-leitor-tela">
                                    Use este botão para alternar a visibilidade da senha
                                </div>
                            </div>

                            {erro && (
                                <div
                                    ref={refErro}
                                    id="mensagem-erro"
                                    className="container-erro"
                                    role="alert"
                                    aria-live="assertive"
                                    tabIndex="-1"
                                >
                                    <AlertCircle className="icone-erro" aria-hidden="true" size={18} />
                                    <p className="erro-login">{erro}</p>
                                </div>
                            )}

                            <div className="container-botoes">
                                <button
                                    className={`botao-login ${carregando ? "botao-login-carregando" : ""}`}
                                    type="submit"
                                    disabled={carregando}
                                    aria-describedby="descricao-botao-login"
                                >
                                    {carregando ? (
                                        <>
                                            <Loader2 className="icone-botao icone-carregando" aria-hidden="true" size={18} />
                                            <span>Entrando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="icone-botao" aria-hidden="true" size={18} />
                                            <span>Fazer Login</span>
                                        </>
                                    )}
                                </button>

                                <div id="descricao-botao-login" className="apenas-leitor-tela">
                                    {carregando ? "Processando login, aguarde..." : "Clique para fazer login no sistema"}
                                </div>

                                <button
                                    className="botao-cadastro"
                                    onClick={() => navegar("/cadastro")}
                                    type="button"
                                    aria-describedby="descricao-botao-cadastro"
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
                                    onClick={() => navegar("/esquecisenha")}
                                    type="button"
                                    aria-describedby="descricao-esqueci-senha"
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
