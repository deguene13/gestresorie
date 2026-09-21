type DiperflоLogoProps = {
  variant?: "full" | "icon" | "wordmark";
  iconSize?: number;
  onDark?: boolean;
  className?: string;
};

export function DiperflоLogo({
  variant = "full",
  iconSize = 40,
  onDark = false,
  className = "",
}: DiperflоLogoProps) {
  const textColor = onDark ? "#FFFFFF" : "#0F3D91";

  const Icon = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="9" fill="#0F3D91" />
      {/* D left bar */}
      <rect x="9" y="9" width="5" height="22" rx="1.5" fill="white" />
      {/* D top arm */}
      <rect x="9" y="9" width="14" height="4.5" rx="1.5" fill="white" />
      {/* D bottom arm */}
      <rect x="9" y="26.5" width="14" height="4.5" rx="1.5" fill="white" />
      {/* D right curve */}
      <path d="M22 9 Q34 9 34 20 Q34 31 22 31" stroke="white" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      {/* Financial trend arrow inside D's bowl */}
      <polyline points="17,27 22,21 26,24 31,16" stroke="#2D9CDB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <polyline points="28,15 31,16 30,19" stroke="#2D9CDB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );

  const Wordmark = (
    <div className="flex flex-col leading-none">
      <span style={{ fontFamily: "'Inter','Segoe UI',sans-serif", fontWeight: 700, fontSize: iconSize * 0.45, letterSpacing: "0.08em", color: textColor, lineHeight: 1.1 }}>
        DIPERFLO
      </span>
      <span style={{ fontFamily: "'Inter','Segoe UI',sans-serif", fontWeight: 400, fontSize: iconSize * 0.175, letterSpacing: "0.04em", color: onDark ? "rgba(255,255,255,0.6)" : "#2D9CDB", lineHeight: 1.2, marginTop: 2 }}>
        Gestion de Trésorerie
      </span>
    </div>
  );

  if (variant === "icon") return <span className={className}>{Icon}</span>;
  if (variant === "wordmark") return <span className={className}>{Wordmark}</span>;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {Icon}
      {Wordmark}
    </div>
  );
}
