const GraoCafe = ({ cor = "#6f4e37" }) => (
    <svg
        className="grao-svg"
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
    >
        <ellipse cx="32" cy="32" rx="20" ry="30" fill={cor} />
        <path
            d="M32 2 C24 16, 24 48, 32 62"
            stroke="#fff"
            strokeWidth="4"
            fill="none"
        />
    </svg>
);

export default GraoCafe;
