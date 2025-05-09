const GraoCafe = ({ cor = "#6f4e37" }) => {
    // Calcula cores para sombreamento e destaque baseadas na cor principal
    const corEscura = adjustColor(cor, -30);
    const corClara = adjustColor(cor, 30);

    return (
        <svg
            className="grao-svg"
            viewBox="0 0 100 160"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Sombra do grão */}
            <ellipse
                cx="50"
                cy="80"
                rx="40"
                ry="70"
                fill={corEscura}
                filter="blur(4px)"
                opacity="0.3"
                transform="translate(5,5)"
            />

            {/* Corpo principal do grão */}
            <ellipse
                cx="50"
                cy="80"
                rx="40"
                ry="70"
                fill={cor}
            />

            {/* Gradiente de destaque */}
            <ellipse
                cx="40"
                cy="70"
                rx="30"
                ry="60"
                fill={corClara}
                opacity="0.2"
            />

            {/* Fenda central do grão */}
            <path
                d="M50 10 C40 40, 40 120, 50 150 C60 120, 60 40, 50 10"
                fill={corEscura}
            />

            {/* Linha de destaque na fenda */}
            <path
                d="M50 10 C40 40, 40 120, 50 150"
                stroke="#ffffff"
                strokeWidth="2"
                fill="none"
                opacity="0.7"
            />

            {/* Textura do grão - linhas sutis */}
            <g opacity="0.1" stroke={corEscura} strokeWidth="1">
                <path d="M30 40 Q50 50 70 40" />
                <path d="M25 60 Q50 70 75 60" />
                <path d="M20 80 Q50 90 80 80" />
                <path d="M25 100 Q50 110 75 100" />
                <path d="M30 120 Q50 130 70 120" />
            </g>

            {/* Brilho no topo */}
            <ellipse
                cx="35"
                cy="30"
                rx="10"
                ry="15"
                fill="#ffffff"
                opacity="0.2"
            />
        </svg>
    );
};

// Função auxiliar para ajustar a cor (escurecer ou clarear)
function adjustColor(color, amount) {
    // Remove o # se existir
    color = color.replace(/^#/, '');

    // Converte para RGB
    let r = parseInt(color.substring(0, 2), 16);
    let g = parseInt(color.substring(2, 4), 16);
    let b = parseInt(color.substring(4, 6), 16);

    // Ajusta os valores
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));

    // Converte de volta para hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default GraoCafe;
