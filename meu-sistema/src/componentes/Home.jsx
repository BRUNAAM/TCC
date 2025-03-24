import { useNavigate } from "react-router-dom";
import "./Home.css";
import logo from "../assets/logo.svg";

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <div className="home-content">
                <img src={logo} alt="Coffee Grader" className="home-logo" />
                <h1>Bem-vindo ao Coffee Grader</h1>
                <p>
                    O SISTEMA QUE VAI TE AJUDAR ADMINISTRAR <br />
                    COM PRATICIDADE E ORGANIZAÇÃO <br />
                    SUAS AVALIAÇÕES.
                </p>
                <button onClick={() => navigate("/login")} className="home-button">
                    Entrar no Sistema
                </button>
            </div>
        </div>
    );
};

export default Home;
