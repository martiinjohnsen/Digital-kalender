import { useId } from "react";
import type { Theme } from "@/lib/model";
export function Artwork({
  theme = "advent",
  className = "",
}: {
  theme?: Theme;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className={`artwork theme-${theme} ${className}`}
      viewBox="0 0 600 380"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`glow${id}`}>
          <stop stopColor="#f9d49b" stopOpacity=".8" />
          <stop offset="1" stopColor="#f9d49b" stopOpacity="0" />
        </radialGradient>
        <pattern
          id={`dots${id}`}
          width="70"
          height="70"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="12" cy="17" r="1.5" fill="currentColor" opacity=".3" />
          <circle cx="54" cy="49" r="1" fill="currentColor" opacity=".2" />
        </pattern>
      </defs>
      <rect width="600" height="380" fill="var(--scene-bg)" />
      <circle
        cx="320"
        cy="185"
        r="150"
        fill="var(--scene-halo)"
        opacity=".55"
      />
      <rect width="600" height="380" fill={`url(#dots${id})`} color="#faf2d7" />
      <path
        d="M0 324c95-24 132-6 206-12 95-7 133-20 220-5 54 9 104-11 174-3v76H0Z"
        fill="var(--scene-snow)"
      />
      <path
        d="M0 351c104-29 196 1 305-13s208 13 295-2v44H0Z"
        fill="#fcf8ed"
        opacity=".55"
      />
      <g stroke="#dbcaa8" strokeWidth="1.4">
        <path d="M78 80v17m-8-9h16M486 127v15m-7-7h14M430 51v18m-8-9h16M173 128v12m-6-6h12" />
        <path d="m541 76 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z" fill="#dbcaa8" />
      </g>
      <circle cx="512" cy="66" r="18" fill="#f4e4bb" />
      <circle cx="519" cy="60" r="16" fill="var(--scene-bg)" />
      <g fill="var(--scene-tree)">
        <path d="m105 171-40 69h20l-30 45h35l-28 35h85l-27-35h32l-30-45h20Z" />
        <path d="m495 160-37 62h16l-25 43h26l-26 40h92l-29-40h28l-29-43h17Z" />
        <path d="m547 217-25 45h14l-20 35h19l-19 29h62l-19-29h19l-22-35h14Z" />
      </g>
      <path
        d="M105 294v38m390-45v36m52-16v25"
        stroke="var(--scene-tree)"
        strokeWidth="8"
      />
      <g>
        <path d="M203 173h197v146H203Z" fill="#d4b494" />
        <path d="M215 182h173v137H215Z" fill="#ead5b8" />
        <path d="m181 180 119-99 122 99Z" fill="var(--scene-roof)" />
        <path
          d="m179 176 121-99 124 99"
          stroke="#f6efe0"
          strokeWidth="12"
          strokeLinejoin="round"
        />
        <path d="M357 111V74h24v58Z" fill="var(--scene-roof)" />
        <path
          d="M352 72h34"
          stroke="#f6efe0"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path d="M299 131v35m-18-18h36" stroke="#c3a085" strokeWidth="3" />
        <circle
          cx="299"
          cy="149"
          r="22"
          fill="#f0ca7f"
          stroke="var(--scene-roof)"
          strokeWidth="7"
        />
        <path
          d="M299 130v38m-20-19h40"
          stroke="var(--scene-roof)"
          strokeWidth="3"
        />
        <circle
          cx="301"
          cy="235"
          r="86"
          fill={`url(#glow${id})`}
          opacity=".5"
        />
        <rect
          x="233"
          y="205"
          width="41"
          height="48"
          rx="2"
          fill="#f6d790"
          stroke="var(--scene-roof)"
          strokeWidth="6"
        />
        <path
          d="M253 206v47m-20-24h41"
          stroke="var(--scene-roof)"
          strokeWidth="3"
        />
        <rect
          x="328"
          y="205"
          width="41"
          height="48"
          rx="2"
          fill="#f6d790"
          stroke="var(--scene-roof)"
          strokeWidth="6"
        />
        <path
          d="M348 206v47m-20-24h41"
          stroke="var(--scene-roof)"
          strokeWidth="3"
        />
        <path d="M281 319v-57a20 20 0 0 1 40 0v57Z" fill="var(--scene-roof)" />
        <path d="M288 309v-47a13 13 0 0 1 26 0v47Z" fill="#e0a96f" />
        <circle cx="309" cy="282" r="2" fill="#fff4d9" />
        <path
          d="M196 189h210"
          stroke="var(--scene-tree)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {Array.from({ length: 10 }, (_, i) => (
          <circle
            key={i}
            cx={207 + i * 21}
            cy={190 + (i % 2) * 5}
            r="3.2"
            fill="#ffe6a3"
          />
        ))}
        <path
          d="M201 320h201"
          stroke="#faf5e9"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <text
          x="300"
          y="230"
          textAnchor="middle"
          fill="var(--scene-roof)"
          fontFamily="Georgia,serif"
          fontSize="15"
        >
          24
        </text>
      </g>
      <g>
        <rect x="391" y="292" width="39" height="33" rx="2" fill="#bc795b" />
        <rect x="387" y="288" width="47" height="8" rx="2" fill="#cb8b69" />
        <path
          d="M409 289v36m0-37c-25 0-12-18 0 0Zm0 0c25 0 12-18 0 0Z"
          stroke="#ebd8b1"
          strokeWidth="4"
        />
        <rect x="168" y="302" width="30" height="24" rx="2" fill="#c9a66a" />
        <path d="M181 301v25m-15-20h34" stroke="#f1e6cd" strokeWidth="4" />
      </g>
      <path
        d="M288 333c-15 8-15 17-22 24"
        stroke="#d5c4a1"
        strokeWidth="2"
        strokeDasharray="5 9"
        strokeLinecap="round"
      />
      <g fill="#fff8e9" opacity=".8">
        <circle cx="164" cy="67" r="2" />
        <circle cx="243" cy="53" r="2" />
        <circle cx="393" cy="40" r="1.5" />
        <circle cx="457" cy="213" r="2" />
        <circle cx="156" cy="224" r="2" />
        <circle cx="56" cy="162" r="1.5" />
      </g>
    </svg>
  );
}
