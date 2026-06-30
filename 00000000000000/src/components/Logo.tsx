import { motion } from "motion/react";

export default function Logo() {
  // Helper to render perfectly curved text using circular coordinates and letter-by-letter rotation
  const renderCurvedText = (
    text: string,
    radius: number,
    startAngle: number,
    endAngle: number,
    direction: 1 | -1 = 1
  ) => {
    const characters = text.split("");
    const angleStep = (endAngle - startAngle) / (characters.length - 1 || 1);
    
    return characters.map((char, i) => {
      const angle = startAngle + i * angleStep;
      const rad = (angle * Math.PI) / 180;
      const x = 100 + radius * Math.cos(rad);
      const y = 100 + radius * Math.sin(rad);
      
      // Calculate rotation so characters' bases face the center of the badge
      const rotation = angle + 90 + (direction === -1 ? 180 : 0);
      
      return (
        <text
          key={i}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          transform={`rotate(${rotation}, ${x}, ${y})`}
          className="fill-red-wine font-display uppercase font-extrabold text-[9px] tracking-widest select-none"
        >
          {char}
        </text>
      );
    });
  };

  return (
    <div id="logo-container" className="flex flex-col items-center justify-center py-6 select-none relative z-20">
      <motion.div
        id="logo-circle"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        whileHover={{ scale: 1.04 }}
        className="w-40 h-40 flex items-center justify-center cursor-pointer relative"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 200 200"
          className="w-full h-full text-red-wine"
        >
          <defs>
            {/* Soft, elegant lavender-periwinkle gradient exactly like the physical brush in the logo */}
            <linearGradient id="brush-body-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E9F0FD" />
              <stop offset="40%" stopColor="#D9E5FC" />
              <stop offset="100%" stopColor="#C4D7FA" />
            </linearGradient>
            <linearGradient id="brush-cushion-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F1F5F9" />
            </linearGradient>
          </defs>

          {/* Outer elegant thin ring */}
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="opacity-15"
          />

          {/* Inner dashed detail ring */}
          <circle
            cx="100"
            cy="100"
            r="84"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeDasharray="2 3"
            className="opacity-25"
          />

          {/* Curved Text: SMOOZICE at top arc */}
          {renderCurvedText("SMOOZICE", 72, -145, -35, 1)}

          {/* Curved Text: HAIR CARE at bottom arc */}
          {renderCurvedText("HAIR CARE", 72, 145, 35, -1)}

          {/* Center Brush Graphic */}
          <g className="filter drop-shadow-[0_1.5px_3px_rgba(196,214,250,0.35)]">
            {/* Brush main body (paddle head and handle) */}
            <path
              d="M 100,53 C 78,53 77,109 94,115 L 95,161 C 95,165 105,165 105,161 L 106,115 C 123,109 122,53 100,53 Z"
              fill="url(#brush-body-grad)"
              stroke="#B3C8F2"
              strokeWidth="0.75"
            />

            {/* Hanging loop hole at the handle tip */}
            <circle
              cx="100"
              cy="155"
              r="2"
              fill="#FFFFFF"
              stroke="#B3C8F2"
              strokeWidth="0.5"
            />

            {/* Cushion / Pad */}
            <ellipse
              cx="100"
              cy="83"
              rx="16"
              ry="23"
              fill="url(#brush-cushion-grad)"
              stroke="#B3C8F2"
              strokeWidth="0.5"
            />

            {/* Plotted Bristles Dots */}
            {/* Center Row */}
            <circle cx="100" cy="68" r="1" fill="#8FA9E4" />
            <circle cx="100" cy="76" r="1" fill="#8FA9E4" />
            <circle cx="100" cy="84" r="1" fill="#8FA9E4" />
            <circle cx="100" cy="92" r="1" fill="#8FA9E4" />
            <circle cx="100" cy="100" r="1" fill="#8FA9E4" />

            {/* Left Column 1 */}
            <circle cx="94" cy="72" r="1" fill="#8FA9E4" />
            <circle cx="94" cy="80" r="1" fill="#8FA9E4" />
            <circle cx="94" cy="88" r="1" fill="#8FA9E4" />
            <circle cx="94" cy="96" r="1" fill="#8FA9E4" />

            {/* Right Column 1 */}
            <circle cx="106" cy="72" r="1" fill="#8FA9E4" />
            <circle cx="106" cy="80" r="1" fill="#8FA9E4" />
            <circle cx="106" cy="88" r="1" fill="#8FA9E4" />
            <circle cx="106" cy="96" r="1" fill="#8FA9E4" />

            {/* Left Column 2 */}
            <circle cx="88" cy="78" r="1" fill="#8FA9E4" />
            <circle cx="88" cy="86" r="1" fill="#8FA9E4" />
            <circle cx="88" cy="94" r="1" fill="#8FA9E4" />

            {/* Right Column 2 */}
            <circle cx="112" cy="78" r="1" fill="#8FA9E4" />
            <circle cx="112" cy="86" r="1" fill="#8FA9E4" />
            <circle cx="112" cy="94" r="1" fill="#8FA9E4" />
          </g>
        </svg>
      </motion.div>
    </div>
  );
}
