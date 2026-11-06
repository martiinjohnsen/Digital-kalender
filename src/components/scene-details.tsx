/** Small vector details share the main illustration's muted winter palette. */
export function Reindeer({ x = 474, y = 323, scale = 1, grounded = true }: { x?: number; y?: number; scale?: number; grounded?: boolean }) {
  const antlers = "m25-36-8-18m5 11-10-4m14 10 4-21m-2 11 10-6";
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {grounded && <ellipse cy="25" rx="35" ry="5" fill="var(--scene-roof)" opacity=".13" />}
      <path d="m-17 0-5 22m17-18-2 19m17-20 4 20m8-25 7 23" stroke="#79543e" strokeWidth="4.5" strokeLinecap="round" />
      <path d="m-22-8-10-8" stroke="#f8ecd8" strokeWidth="6" strokeLinecap="round" />
      <path d="m-22-8-10-8" stroke="#a47951" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M-24-7c2-18 34-19 46-5l8-24 11 2-7 30c-9 13-44 12-54 4Z" fill="#a47951" stroke="#f5e8d1" strokeWidth="1.8" />
      <path d="m21-7 7-21 7 3-7 25Z" fill="#e4cba3" />
      <path d={antlers} stroke="#f8ecd8" strokeWidth="5" strokeLinecap="round" />
      <path d={antlers} stroke="#72513c" strokeWidth="2.4" strokeLinecap="round" />
      <path d="m25-36-8-7 11 1m10 8 10-7-5 10" fill="#b99068" stroke="#f5e8d1" strokeWidth="1.2" />
      <path d="M23-36c3-10 20-8 21 0l9 5c2 5-4 8-13 6l-13-2Z" fill="#b99068" stroke="#f5e8d1" strokeWidth="1.5" />
      <ellipse cx="46" cy="-29" rx="6" ry="4.3" fill="#e5c7a0" />
      <circle cx="51" cy="-30" r="3.4" fill="#b65d69" />
      <circle cx="36" cy="-35" r="1.8" fill="#3f3544" />
      <circle cx="36.5" cy="-35.5" r=".6" fill="white" />
      <path d="m-23 22 4 1m10 0 4 1m16-1 4 1m9-2 5 1" stroke="#524251" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}
export function Santa() {
  return (
    <g transform="translate(105 322)">
      <ellipse cy="10" rx="21" ry="4" fill="var(--scene-roof)" opacity=".12" />
      <path d="m-11-2-2 9h11l1-11m8 2 1 9h12l-7-11" fill="#51434f" />
      <path d="M-15-37c-7 6-9 24-4 30h39c3-10-1-24-8-30Z" fill="#b6616e" stroke="#f7ead4" strokeWidth="1.5" />
      <path d="M-14-31q14 8 27 0m-29 17h33" stroke="#f9edd9" strokeWidth="5" />
      <path d="M-16-16h33" stroke="#64505a" strokeWidth="4" />
      <rect x="-3" y="-19" width="7" height="6" rx="1" stroke="#e8c77e" strokeWidth="1.7" />
      <path d="m-16-32-8 14m37-15 9 13" stroke="#b6616e" strokeWidth="8" strokeLinecap="round" />
      <circle cx="-25" cy="-16" r="4" fill="#f2d8b9" /><circle cx="23" cy="-18" r="4" fill="#f2d8b9" />
      <circle cy="-45" r="12" fill="#f0d1ae" />
      <path d="M-12-46q0 24 12 26 14-8 12-26l-7 8-5-3-5 3Z" fill="#fff5e5" />
      <circle cx="-4" cy="-47" r="1.2" fill="#51434f" /><circle cx="4" cy="-47" r="1.2" fill="#51434f" />
      <circle cy="-43" r="2.6" fill="#d99b8e" />
      <path d="M-13-54q4-25 23-18l8 14-12-6 5 12Z" fill="#b6616e" />
      <path d="M-13-53h25" stroke="#fff5e5" strokeWidth="5" strokeLinecap="round" />
      <circle cx="19" cy="-57" r="4" fill="#fff5e5" />
    </g>
  );
}
export function ChristmasTree() {
  return (
    <g transform="translate(49 327)">
      <ellipse cy="8" rx="32" ry="5" fill="var(--scene-roof)" opacity=".12" />
      <path d="M-10-14h20l-3 21H-7Z" fill="#b78069" />
      <path d="m0-128-21 39h11l-21 36h13l-23 38h82L18-53h13L10-89h11Z" fill="#466c60" stroke="#d1d9bd" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="m-10-89 22 8m-30 24 36 9m-45 23 52 6" stroke="#dfc78f" strokeWidth="2.5" strokeLinecap="round" />
      {[[-6,-99],[7,-77],[-12,-62],[18,-45],[-19,-29],[4,-21]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="4" fill={i%2 ? "#dfbd75" : "#c47d81"} stroke="#f7e9cc" strokeWidth=".8" />)}
      <path d="m0-140 3 8 9 1-7 5 2 9-7-5-7 5 2-9-7-5 9-1Z" fill="#efd092" stroke="#fff1cf" strokeWidth="1" />
    </g>
  );
}
export function Skis() {
  return (
    <g transform="translate(196 324)" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cy="3" rx="21" ry="3" fill="var(--scene-roof)" opacity=".1" />
      <path d="M-15-82q-9-9-10 2L-3 0h8Zm19-3q-4-11-9-4L8-1h9Z" fill="#c17a7a" stroke="#f7e9d2" strokeWidth="2" />
      <path d="m-18-73 16 57m1-63 12 63" stroke="#e6c38e" strokeWidth="2" />
      <path d="m-4-80-17 81m36-77-2 77" stroke="#716077" strokeWidth="2" />
      <path d="m-6-80 5 1m11 2 8 1m-42 68 9 2m2-1h9" stroke="#e6d8be" strokeWidth="3" />
      <path d="m-9-30 7-2m8 3 8-1" stroke="#5f4b61" strokeWidth="4" />
    </g>
  );
}
export function Lanterns() {
  return (
    <g>
      {[[354,335,1],[551,333,.8]].map(([x,y,scale],i)=>(
        <g key={i} transform={`translate(${x} ${y}) scale(${scale})`}>
          <circle cy="-16" r="23" fill="#f1d39b" opacity=".12" />
          <ellipse cy="1" rx="12" ry="3" fill="var(--scene-roof)" opacity=".1" />
          <path d="M-8-22h16L10 0h-20Z" fill="#f4d491" stroke="#6e5967" strokeWidth="2.5" />
          <path d="M-10-23h20l-5-7H-5Z" fill="#6e5967" />
          <path d="M-4-30v-3a4 4 0 0 1 8 0v3m-4 12v17" stroke="#6e5967" strokeWidth="2" />
          <path d="M-2-5q-4-6 2-11 5 5 2 11Z" fill="#fff8dd" />
        </g>
      ))}
    </g>
  );
}
export function Sleigh() {
  return (
    <g className="scene-sleigh-flight">
      <g transform="translate(32 83) scale(.65)">
        <path d="M-10-5q20 16 71 5l4-24H43l-8 13H2l-6-14h-13Z" fill="#b56a75" stroke="#f6e2bb" strokeWidth="2" />
        <path d="M-6 7q16 8 69 0 13-2 16-10M3-3l5 12m39-13 3 11" stroke="#e9c987" strokeWidth="3" strokeLinecap="round" />
        <path d="M16-13v-16q12-14 24 0v17" fill="#b55b69" />
        <circle cx="28" cy="-34" r="9" fill="#efd0ad" />
        <path d="m20-35 8 16 9-16" fill="#fff2dc" />
        <path d="M17-41q4-17 18-9l5 8H18Z" fill="#b55b69" />
        <path d="M18-40h18" stroke="#fff2dc" strokeWidth="4" strokeLinecap="round" />
        <path d="M51-22q15-28 21 3v15H46Z" fill="#b79c71" />
        <path d="M39-18q34 9 71-6" stroke="#e5d0aa" strokeWidth="1.8" />
        <Reindeer x={127} y={-13} scale={.7} grounded={false} />
        <path d="M-32-7h8m-20 10h5" stroke="#f8e6bf" strokeWidth="2" strokeLinecap="round" />
      </g>
    </g>
  );
}
export function SkyClouds() {
  return (
    <g fill="#ddd8e7" stroke="#f5edf3" strokeWidth="1.1">
      <path d="M42 77c-25-4-25-30 0-32 3-24 40-24 46-4 24-10 45 5 40 22 25 3 24 22 3 25H48Z" opacity=".62" />
      <path d="M239 63c-21-1-23-23-4-28 8-24 39-20 44-1 20-7 38 6 35 19 24 1 25 20 6 22h-73Z" opacity=".48" />
      <path d="M423 104c-28-1-30-27-7-33 3-32 47-35 59-9 25-10 47 5 44 23 27-2 31 24 8 28h-90Z" opacity=".56" />
    </g>
  );
}
