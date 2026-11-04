import { useId } from "react";
import { DEFAULT_SCENE, type SceneSettings, type Theme } from "@/lib/model";

function Window({
  x,
  y,
  width = 35,
  height = 44,
}: {
  x: number;
  y: number;
  width?: number;
  height?: number;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="3"
        fill="#f5d89a"
        stroke="var(--scene-roof)"
        strokeWidth="5"
      />
      <path
        d={`M${x + width / 2} ${y}v${height}M${x} ${y + height / 2}h${width}`}
        stroke="var(--scene-roof)"
        strokeWidth="2.5"
      />
    </g>
  );
}
function Pine({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      fill="var(--scene-tree)"
    >
      <path d="m0-125-35 59h17l-26 44h27l-26 35h86L18-22h26L18-66h17Z" />
      <path d="M0 8v20" stroke="var(--scene-tree)" strokeWidth="7" />
    </g>
  );
}
export function Artwork({
  theme = "advent",
  scene,
  className = "",
}: {
  theme?: Theme;
  scene?: SceneSettings;
  className?: string;
}) {
  const settings = { ...DEFAULT_SCENE, ...scene };
  const id = useId().replace(/:/g, "");
  const tall = settings.house === "townhouse",
    cabin = settings.house === "cabin";
  return (
    <svg
      className={`artwork theme-${theme} ${className}`}
      viewBox="0 0 600 380"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`glow${id}`}>
          <stop stopColor="#f9d49b" stopOpacity=".6" />
          <stop offset="1" stopColor="#f9d49b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="600" height="380" fill="var(--scene-bg)" />
      <circle
        cx="315"
        cy="180"
        r="154"
        fill="var(--scene-halo)"
        opacity=".42"
      />
      {settings.sky !== "clear" && (
        <g fill="#f9ead1" opacity=".65">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <circle
              key={i}
              cx={35 + ((i * 73) % 530)}
              cy={30 + ((i * 37) % 165)}
              r={i % 3 === 0 ? 1.6 : 1}
            />
          ))}
        </g>
      )}
      {settings.sky === "stars" && (
        <g stroke="#e3d1b4" strokeWidth="1.2">
          <path d="M95 68v15m-7-8h14M464 115v13m-6-7h12M408 43v17m-8-8h16M164 140v10m-5-5h10" />
          <path d="m537 69 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="#e3d1b4" />
        </g>
      )}
      {settings.sky === "moon" && (
        <g>
          <circle cx="494" cy="65" r="24" fill="#f5e4b9" />
          <circle cx="503" cy="57" r="22" fill="var(--scene-bg)" />
        </g>
      )}
      <path
        d="M0 318c90-19 150 1 222-8s132-19 214-2c52 11 103-10 164-5v77H0Z"
        fill="var(--scene-snow)"
      />
      <path
        d="M0 348c99-25 196 4 305-8s209 11 295-5v45H0Z"
        fill="#fcf8ee"
        opacity=".58"
      />
      {settings.trees && (
        <g>
          <Pine x={88} y={296} scale={1.1} />
          <Pine x={496} y={284} scale={1.1} />
          <Pine x={548} y={308} scale={0.72} />
        </g>
      )}
      {cabin ? (
        <g>
          <path d="m196 319 104-202 108 202Z" fill="#ead4b5" />
          <path
            d="m183 321 117-220 121 220"
            stroke="var(--scene-roof)"
            strokeWidth="17"
            strokeLinejoin="round"
          />
          <path
            d="m180 315 120-221 123 221"
            stroke="#f7efdf"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <Window x={260} y={237} width={30} height={37} />
          <Window x={317} y={237} width={30} height={37} />
          <path
            d="M290 320v-31a14 14 0 0 1 28 0v31Z"
            fill="var(--scene-roof)"
          />
          <path d="M296 320v-31a8 8 0 0 1 16 0v31Z" fill="#e1ac74" />
          <circle
            cx="304"
            cy="202"
            r="15"
            fill="#f1d18b"
            stroke="var(--scene-roof)"
            strokeWidth="5"
          />
          {settings.lights && (
            <g fill="#ffe9b4">
              {Array.from({ length: 9 }, (_, i) => (
                <circle
                  key={i}
                  cx={210 + i * 23}
                  cy={300 - Math.min(i, 8 - i) * 40}
                  r="2.5"
                />
              ))}
            </g>
          )}
        </g>
      ) : (
        <g>
          <path
            d={tall ? "M230 137h149v183H230Z" : "M206 175h193v145H206Z"}
            fill="#ead4b6"
          />
          <path
            d={tall ? "M231 138h16v181h-16Z" : "M207 176h14v144h-14Z"}
            fill="#c7a488"
            opacity=".55"
          />
          <path
            d={tall ? "m211 144 93-68 94 68Z" : "m185 181 117-98 120 98Z"}
            fill="var(--scene-roof)"
          />
          <path
            d={tall ? "m209 141 95-70 96 70" : "m182 178 120-100 123 100"}
            stroke="#f7efdf"
            strokeWidth="10"
            strokeLinejoin="round"
          />
          <path
            d={tall ? "M348 106V67h19v53Z" : "M355 117V79h23v57Z"}
            fill="var(--scene-roof)"
          />
          <path
            d={tall ? "M344 67h27" : "M351 78h31"}
            stroke="#f7efdf"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {tall ? (
            <>
              <Window x={250} y={161} width={35} height={41} />
              <Window x={322} y={161} width={35} height={41} />
              <Window x={250} y={227} width={35} height={41} />
              <Window x={322} y={227} width={35} height={41} />
              <path
                d="M293 320v-41a12 12 0 0 1 24 0v41Z"
                fill="var(--scene-roof)"
              />
              <path d="M297 320v-40a8 8 0 0 1 16 0v40Z" fill="#dfaa72" />
            </>
          ) : (
            <>
              <circle
                cx="302"
                cy="149"
                r="21"
                fill="#f0cb83"
                stroke="var(--scene-roof)"
                strokeWidth="6"
              />
              <path
                d="M302 129v39m-19-19h38"
                stroke="var(--scene-roof)"
                strokeWidth="2.5"
              />
              <Window x={235} y={206} />
              <Window x={334} y={206} />
              <path
                d="M284 320v-55a19 19 0 0 1 38 0v55Z"
                fill="var(--scene-roof)"
              />
              <path d="M290 320v-55a13 13 0 0 1 26 0v55Z" fill="#dfa66d" />
              <circle cx="311" cy="285" r="2" fill="#fff3d7" />
            </>
          )}
          <circle
            cx="302"
            cy="246"
            r="71"
            fill={`url(#glow${id})`}
            opacity=".28"
          />
          {settings.lights && (
            <g>
              <path
                d={tall ? "M230 146h148" : "M207 187h192"}
                stroke="var(--scene-tree)"
                strokeWidth="5"
                strokeLinecap="round"
              />
              {Array.from({ length: 9 }, (_, i) => (
                <circle
                  key={i}
                  cx={(tall ? 236 : 216) + i * (tall ? 17 : 22)}
                  cy={(tall ? 147 : 188) + (i % 2) * 4}
                  r="2.6"
                  fill="#ffe3a0"
                />
              ))}
            </g>
          )}
        </g>
      )}
      <path
        d="M199 322h208"
        stroke="#faf5eb"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {settings.snowman && (
        <g transform="translate(151 295)">
          <ellipse cy="12" rx="23" ry="25" fill="#f9f6ef" />
          <circle cy="-17" r="16" fill="#fffaf2" />
          <path d="m3-20 14 4-14 3Z" fill="#cb8c59" />
          <circle cx="-5" cy="-22" r="1.7" fill="#5d4c65" />
          <path d="M-12-3h26l-2 8h-23Z" fill="var(--scene-roof)" />
          <path d="M9 2v16h7V3" fill="var(--scene-roof)" />
          <path
            d="M-19 0-33-13m52 16 15-14"
            stroke="#9e8065"
            strokeWidth="2.7"
            strokeLinecap="round"
          />
          <path
            d="M-17-32h34m-27 0v-16h20v16Z"
            fill="var(--scene-tree)"
            stroke="var(--scene-tree)"
            strokeWidth="3"
          />
          <circle cy="13" r="2" fill="#7e6b84" />
          <circle cy="23" r="2" fill="#7e6b84" />
        </g>
      )}
      {settings.reindeer && (
        <g transform="translate(443 304)">
          <ellipse cx="0" cy="0" rx="24" ry="12" fill="#b68a64" />
          <path
            d="m-17 4-4 23m14-18-3 18m20-20 1 20m8-26 3 26"
            stroke="#9f7858"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path d="m15-3 9-21 7 2-5 28" fill="#b68a64" />
          <ellipse cx="29" cy="-24" rx="11" ry="8" fill="#ba916b" />
          <circle cx="37" cy="-24" r="2.5" fill="#ae6f75" />
          <path
            d="m25-30-5-14m3 8-9-4m13 9 3-15m-2 8 9-5"
            stroke="#9f7858"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="31" cy="-27" r="1.3" fill="#4f4051" />
          <path
            d="m-21-4-10-9"
            stroke="#b68a64"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      )}
      <g>
        <rect x="388" y="296" width="35" height="27" rx="2" fill="#bd806b" />
        <path
          d="M405 296v27m-20-23h41m-21-4c-20-5-8-15 0 0Zm0 0c20-5 8-15 0 0Z"
          stroke="#eee0c4"
          strokeWidth="3"
        />
        <rect x="177" y="304" width="25" height="20" rx="2" fill="#bfa06d" />
        <path d="M188 304v20m-13-16h29" stroke="#f4ead4" strokeWidth="3" />
      </g>
      {settings.snowfall && (
        <g className="scene-snowfall" fill="#fff7ef" opacity=".7">
          {Array.from({ length: 20 }, (_, i) => (
            <circle
              key={i}
              cx={17 + ((i * 83) % 570)}
              cy={14 + ((i * 47) % 293)}
              r={i % 3 === 0 ? 2 : 1.3}
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </g>
      )}
    </svg>
  );
}
