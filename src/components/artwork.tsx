import { useId, type CSSProperties } from "react";
import { DEFAULT_SCENE, type SceneSettings, type Theme } from "@/lib/model";
import { ChristmasTree, Lanterns, Reindeer, Santa, Skis, SkyClouds, SkyFireworks, Sleigh } from "./scene-details";

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
  fit = "contain",
}: {
  theme?: Theme;
  scene?: SceneSettings;
  className?: string;
  fit?: "contain" | "cover";
}) {
  const settings = { ...DEFAULT_SCENE, ...scene };
  const id = useId().replace(/:/g, "");
  const tall = settings.house === "townhouse",
    cabin = settings.house === "cabin";
  return (
    <svg
      className={`artwork theme-${theme} ${settings.wind || settings.storm ? "has-wind" : ""} ${settings.storm ? "is-storm" : ""} ${className}`}
      viewBox="0 0 600 380"
      preserveAspectRatio={fit === "cover" ? "xMidYMax slice" : "xMidYMid meet"}
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
      {((settings.sky !== "clear" && settings.sky !== "cloudy") || settings.twinkle) && (
        <g
          className={settings.twinkle ? "scene-twinkle" : ""}
          fill="#f9ead1"
          opacity=".8"
        >
          {Array.from({ length: settings.twinkle ? 30 : 10 }, (_, i) => (
            <circle
              key={i}
              cx={24 + ((i * 137 + i * i * 11) % 552)}
              cy={22 + ((i * 61 + i * i * 7) % 210)}
              r={i % 5 === 0 ? 2.7 : i % 3 === 0 ? 2 : 1.2}
              style={{
                animationDelay: `${-((i * 1.37) % 7)}s`,
                animationDuration: `${1.5 + ((i * 17) % 23) / 10}s`,
              }}
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
      {settings.sky === "fullmoon" && (
        <g>
          <circle cx="491" cy="66" r="48" fill="#f5e4b9" opacity=".1" />
          <circle cx="491" cy="66" r="34" fill="#f5e4b9" />
          <circle cx="481" cy="55" r="7" fill="#dac598" opacity=".45" />
          <circle cx="504" cy="75" r="9" fill="#dac598" opacity=".35" />
          <circle cx="480" cy="80" r="4" fill="#dac598" opacity=".4" />
        </g>
      )}
      {settings.sky === "cloudy" && <SkyClouds />}
      {settings.shootingStars && (
        <g className="scene-shooting-stars" stroke="#fff0cf" strokeWidth="2" strokeLinecap="round">
          {[25, 70, 110, 45].map((y, i) => <path key={y} className="shooting-star" d={`M-70 ${y}l-45-12`} style={{ animationDelay: `${-i * 2.3}s`, animationDuration: `${8 + i * 1.2}s` }} />)}
        </g>
      )}
      {settings.sleigh && <Sleigh />}
      {settings.fireworks && <SkyFireworks />}
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
      {["classic", "cabin", "townhouse"].includes(settings.house) && (
        <>
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
        </>
      )}
      {settings.house === "park" && (
        <g>
          <ellipse
            cx="303"
            cy="325"
            rx="100"
            ry="11"
            fill="var(--scene-roof)"
            opacity=".09"
          />
          <path
            d="M225 259v63m146-63v63M218 284h162M231 284v-55m136 55v-55"
            stroke="var(--scene-tree)"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {[233, 248, 263].map((y) => (
            <rect
              key={y}
              x="220"
              y={y}
              width="158"
              height="10"
              rx="3"
              fill="#c69c79"
            />
          ))}
          <path
            d="M220 284h158"
            stroke="#fcf3e4"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M410 316V155m-15 0h30l-5-30h-20Z"
            stroke="var(--scene-tree)"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <path d="M397 127h26l-4 25h-18Z" fill="#f2d593" />
          <circle cx="410" cy="140" r="49" fill={`url(#glow${id})`} />
          {settings.lights && (
            <g fill="#ffe7a5">
              {Array.from({ length: 9 }, (_, i) => (
                <circle
                  key={i}
                  cx={231 + i * 17}
                  cy={227 + (i % 2) * 3}
                  r="2.5"
                />
              ))}
            </g>
          )}
        </g>
      )}
      {settings.house === "forest" && (
        <g>
          <Pine x={244} y={286} scale={1.5} />
          <Pine x={342} y={297} scale={1.85} />
          <Pine x={417} y={298} scale={1.1} />
          <path
            d="m192 243 26-2-13-19m90 3 23-2-13-22m31-48 14 2-11-24m50 92 16-1-8-15"
            stroke="#eee9dc"
            strokeWidth="5"
            strokeLinecap="round"
            opacity=".85"
          />
          <path
            d="M286 300v-33m-9 0h18l-3 20h-12Z"
            stroke="#aa8e68"
            strokeWidth="3"
            fill="#f1d497"
          />
          <circle cx="286" cy="277" r="42" fill={`url(#glow${id})`} />
          {settings.lights && (
            <g fill="#ffe7a5">
              {Array.from({ length: 15 }, (_, i) => (
                <circle
                  key={i}
                  cx={309 + (i % 5) * 16}
                  cy={180 + Math.floor(i / 5) * 32 + ((i % 5) % 2) * 7}
                  r="2.5"
                />
              ))}
            </g>
          )}
        </g>
      )}
      {settings.house === "village" && (
        <g>
          {[
            [220, 241, 0.75],
            [309, 215, 1],
            [395, 243, 0.72],
          ].map(([x, y, scale], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${scale})`}>
              <path
                d="M-44 15h88v85h-88Z"
                fill={i === 1 ? "#ead4b6" : "#d5b998"}
              />
              <path d="m-53 20 53-54 53 54Z" fill="var(--scene-roof)" />
              <path
                d="m-53 17 53-54 53 54"
                stroke="#f8efdd"
                strokeWidth="6"
                strokeLinejoin="round"
              />
              <Window x={-30} y={37} width={20} height={25} />
              <Window x={10} y={37} width={20} height={25} />
              <path
                d="M-9 100V75a9 9 0 0 1 18 0v25Z"
                fill="var(--scene-roof)"
              />
              {settings.lights && (
                <g fill="#ffe7a5">
                  {Array.from({ length: 6 }, (_, j) => (
                    <circle
                      key={j}
                      cx={-37 + j * 15}
                      cy={23 + (j % 2) * 3}
                      r="2.5"
                    />
                  ))}
                </g>
              )}
            </g>
          ))}
        </g>
      )}
      {["classic", "cabin", "townhouse"].includes(settings.house) && (
        <path
          d="M199 322h208"
          stroke="#faf5eb"
          strokeWidth="7"
          strokeLinecap="round"
        />
      )}
      {settings.snowman && (
        <g transform="translate(148 307)">
          <ellipse
            cy="22"
            rx="25"
            ry="5"
            fill="var(--scene-roof)"
            opacity=".1"
          />
          <path
            d="m-14-20-20-20m7 7-1-10m7 9-10 1m45 12 20-20m-7 7 1-10m-7 9 10 1"
            stroke="#aa8665"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle r="22" fill="#f6f3ed" />
          <circle cy="-24" r="17" fill="#faf8f1" />
          <circle cy="-47" r="13" fill="#fffaf2" />
          <path
            d="M-15-59h30m-24-1v-15H9v15"
            stroke="var(--scene-tree)"
            strokeWidth="3"
            fill="var(--scene-tree)"
            strokeLinejoin="round"
          />
          <circle cx="-5" cy="-50" r="1.4" fill="#554657" />
          <circle cx="3" cy="-50" r="1.4" fill="#554657" />
          <path d="m2-46 15 3-15 3Z" fill="#ce925f" />
          <path
            d="m-5-40 3 1 3-1"
            stroke="#806779"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path d="M-15-35q15 6 30 0v7q-15 5-30-1Z" fill="var(--scene-roof)" />
          <path d="M8-29v18l7-3-1-18" fill="var(--scene-roof)" />
          <circle cy="-22" r="2" fill="#756479" />
          <circle cy="-10" r="2" fill="#756479" />
          <circle cy="3" r="2" fill="#756479" />
        </g>
      )}
      {settings.reindeer && <Reindeer />}
      {settings.presents !== false && (
        <g>
          <rect x="388" y="296" width="35" height="27" rx="2" fill="#bd806b" />
          <path
            d="M405 296v27m-20-23h41m-21-4c-20-5-8-15 0 0Zm0 0c20-5 8-15 0 0Z"
            stroke="#eee0c4"
            strokeWidth="3"
          />
          <g transform={settings.skis ? "translate(54 7)" : undefined}>
            <rect x="177" y="304" width="25" height="20" rx="2" fill="#bfa06d" />
            <path d="M188 304v20m-13-16h29" stroke="#f4ead4" strokeWidth="3" />
          </g>
        </g>
      )}
      {settings.christmasTree && <ChristmasTree />}
      {settings.santa && <Santa />}
      {settings.skis && <Skis />}
      {settings.lanterns && <Lanterns />}
      {(settings.wind || settings.storm) && (
        <g
          className="scene-wind"
          stroke="#fff5e2"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          {Array.from({ length: settings.storm ? 16 : 9 }, (_, index) => {
            const y = 48 + ((index * 83) % 245);
            const length = 50 + ((index * 31) % 70);
            return (
              <path
                key={index}
                className="wind-trail"
                d={`M-145 ${y}q${length / 2} ${index % 2 ? 8 : -9} ${length} 0q16-5 10-15t-15-1`}
                style={
                  {
                    animationDelay: `${-((index * 1.73) % 7)}s`,
                    animationDuration: `${(settings.storm ? 1.1 : 3.1) + ((index * 13) % 26) / 10}s`,
                    "--wind-rise": `${-9 - ((index * 11) % 30)}px`,
                  } as CSSProperties
                }
              />
            );
          })}
        </g>
      )}
      {(settings.snowfall || settings.storm) && (
        <g
          className={`scene-snowfall ${settings.wind || settings.storm ? "snow-in-wind" : ""}`}
          fill="#fffaf1"
        >
          {Array.from({ length: settings.storm ? 90 : 32 }, (_, i) => (
            <circle
              key={i}
              cx={10 + ((i * 83) % 580)}
              cy={(i * 47) % 380}
              r={i % 4 === 0 ? 2.7 : 1.6}
              style={{
                animationDelay: `${-i * 0.73}s`,
                animationDuration: `${settings.storm ? 1.1 + (i % 7) * .15 : 5 + (i % 5) * 0.8}s`,
              }}
            />
          ))}
        </g>
      )}
    </svg>
  );
}
