"use client"

import "./Home.css"
import { useNavigate } from "react-router-dom"
import logo from "../assets/logo.svg"
import { useUser } from "../context/UserContext"
import { useEffect, useRef } from "react"
import { Key, Coffee } from "lucide-react"

const Home = () => {
    const { usuario } = useUser()
    const navegar = useNavigate()
    const refPrincipal = useRef(null)

    useEffect(() => {
        if (usuario) {
            navegar("/logado", { replace: true })
        }
    }, [usuario, navegar])

    // Função para pular para o conteúdo principal
    const pularParaPrincipal = (evento) => {
        evento.preventDefault()
        if (refPrincipal.current) {
            refPrincipal.current.focus()
        }
    }

    return (
        <>
            {/* Link para pular conteúdo - acessibilidade */}
            <a href="#conteudo-principal" className="link-pular" onClick={pularParaPrincipal}>
                Pular para o conteúdo principal
            </a>
            <div className="container-pagina">
                <header className="apenas-leitor-tela">
                    <h1>Coffee Grader - Sistema de Avaliação Sensorial de Cafés</h1>
                </header>
                <main
                    id="conteudo-principal"
                    className="container-inicio"
                    ref={refPrincipal}
                    tabIndex="-1"
                    role="main"
                    aria-label="Página inicial do Coffee Grader"
                >
                    <section className="conteudo-inicio" aria-labelledby="titulo-boas-vindas">
                        <div className="container-logo">
                            <img
                                src={logo || "/placeholder.svg?height=180&width=180"}
                                alt="Coffee Grader - Logotipo do sistema de avaliação sensorial de cafés"
                                className="logo-inicio"
                                width="180"
                                height="180"
                            />
                        </div>
                        <div className="conteudo-boas-vindas">
                            <h1 id="titulo-boas-vindas" className="titulo-inicio">
                                Bem-vindo ao Coffee Grader
                            </h1>
                            <div className="caixa-descricao" role="region" aria-label="Descrição do sistema">
                                <p className="descricao-inicio">
                                    O sistema que vai te ajudar a administrar com praticidade e organização suas avaliações sensoriais de
                                    café.
                                </p>
                            </div>
                            <button
                                onClick={() => navegar("/login")}
                                className="botao-inicio"
                                type="button"
                                aria-describedby="descricao-botao"
                            >
                                <Key className="icone-botao" aria-hidden="true" size={18} />
                                <span>Entrar no Sistema</span>
                            </button>
                            <div id="descricao-botao" className="apenas-leitor-tela">
                                Clique para acessar a página de login do sistema
                            </div>
                        </div>
                        <footer className="versao-aplicativo" role="contentinfo">
                            <p>
                                <Coffee className="icone-versao" aria-hidden="true" size={14} />
                                Coffee Grader versão 1.0
                            </p>
                        </footer>
                    </section>
                </main>
            </div>
        </>
    )
}

export default Home
