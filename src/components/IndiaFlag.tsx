const IndiaFlag = ({ className = "w-5 h-3.5" }: { className?: string }) => (
  <svg viewBox="0 0 900 600" className={className} aria-label="India Flag">
    <rect width="900" height="200" fill="#FF9933" />
    <rect y="200" width="900" height="200" fill="#FFFFFF" />
    <rect y="400" width="900" height="200" fill="#138808" />
    <circle cx="450" cy="300" r="60" fill="none" stroke="#000080" strokeWidth="4" />
    <circle cx="450" cy="300" r="8" fill="#000080" />
    {Array.from({ length: 24 }).map((_, i) => {
      const angle = (i * 15 * Math.PI) / 180;
      return (
        <line
          key={i}
          x1={450 + 12 * Math.cos(angle)}
          y1={300 + 12 * Math.sin(angle)}
          x2={450 + 56 * Math.cos(angle)}
          y2={300 + 56 * Math.sin(angle)}
          stroke="#000080"
          strokeWidth="2"
        />
      );
    })}
  </svg>
);

export default IndiaFlag;
