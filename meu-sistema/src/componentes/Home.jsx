"use client"

import "./Home.css"
import { useNavigate } from "react-router-dom"
import logo from "../assets/logo.svg"
import { useUser } from "../context/UserContext"
import { useEffect, useRef } from "react"
import { Key, Coffee } from "lucide-react"

const Home = () => {
    const { usuario } = useUser()
    const navigate = useNavigate()
    const mainRef = useRef(null)

    useEffect(() => {
        if (usuario) {
            navigate("/logado", { replace: true })
        }
    }, [usuario, navigate])

    // Função para pular para o conteúdo principal
    const skipToMain = (e) => {
        e.preventDefault()
        if (mainRef.current) {
            mainRef.current.focus()
        }
    }

    return (
        <>
            {/* Skip Link para acessibilidade */}
            <a href="#main-content" className="skip-link" onClick={skipToMain}>
                Pular para o conteúdo principal
            </a>

            <div className="page-wrapper">
                <header className="sr-only">
                    <h1>Coffee Grader - Sistema de Avaliação Sensorial de Cafés</h1>
                </header>

                <main
                    id="main-content"
                    className="home-container"
                    ref={mainRef}
                    tabIndex="-1"
                    role="main"
                    aria-label="Página inicial do Coffee Grader"
                >
                    <section className="home-content" aria-labelledby="welcome-title">
                        <div className="logo-container">
                            <img
                                src={logo || "/placeholder.svg?height=180&width=180"}
                                alt="Coffee Grader - Logotipo do sistema de avaliação sensorial de cafés"
                                className="home-logo"
                                width="180"
                                height="180"
                            />
                        </div>

                        <div className="welcome-content">
                            <h1 id="welcome-title" className="home-title">
                                Bem-vindo ao Coffee Grader
                            </h1>

                            <div className="description-box" role="region" aria-label="Descrição do sistema">
                                <p className="home-description">
                                    O sistema que vai te ajudar a administrar com praticidade e organização suas avaliações sensoriais de
                                    café.
                                </p>
                            </div>

                            <button
                                onClick={() => navigate("/login")}
                                className="home-button"
                                type="button"
                                aria-describedby="button-description"
                            >
                                <Key className="button-icon" aria-hidden="true" size={18} />
                                <span>Entrar no Sistema</span>
                            </button>

                            <div id="button-description" className="sr-only">
                                Clique para acessar a página de login do sistema
                            </div>
                        </div>

                        <footer className="app-version" role="contentinfo">
                            <p>
                                <Coffee className="version-icon" aria-hidden="true" size={14} />
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
