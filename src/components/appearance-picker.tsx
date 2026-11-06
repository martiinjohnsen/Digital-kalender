"use client";
import { THEMES, themeInfo, type SceneSettings, type Theme } from "@/lib/model";
import { Artwork } from "./artwork";
import { Icon } from "./icons";
export interface AppearanceValue {
  theme: Theme;
  scene: SceneSettings;
}
export function AppearancePicker({
  value,
  onChange,
  title = "",
}: {
  value: AppearanceValue;
  onChange: (value: AppearanceValue) => void;
  title?: string;
}) {
  function scene(change: Partial<SceneSettings>) {
    onChange({ ...value, scene: { ...value.scene, ...change } });
  }
  const groups = [
    {
      title: "Gjenstander",
      options: [
        ["snowman", "Snømann"],
        ["reindeer", "Reinsdyr"],
        ["trees", "Grantrær"],
        ["lights", "Julelys"],
        ["santa", "Julenisse"],
        ["skis", "Ski og staver"],
        ["christmasTree", "Pyntet juletre"],
        ["lanterns", "Lykter"],
        ["presents", "Presanger"],
      ] as const,
    },
    {
      title: "Animasjoner",
      options: [
        ["snowfall", "Snøfall"],
        ["sleigh", "Nissens slede"],
        ["wind", "Vinterbris"],
        ["twinkle", "Blinkende stjerner"],
        ["storm", "Snøstorm"],
        ["shootingStars", "Stjerneskudd"],
        ["fireworks", "Fyrverkeri"],
      ] as const,
    },
  ];
  return (
    <div className="appearance-picker">
      <figure className="appearance-preview">
        <Artwork theme={value.theme} scene={value.scene} />
        {title && <figcaption>{title}</figcaption>}
      </figure>
      <fieldset className="appearance-fieldset">
        <legend>Farger</legend>
        <div className="color-options">
          {THEMES.map((theme) => (
            <button
              type="button"
              key={theme}
              className={`color-option ${value.theme === theme ? "selected" : ""}`}
              aria-pressed={value.theme === theme}
              onClick={() => onChange({ ...value, theme })}
            >
              <span style={{ background: themeInfo[theme].color }}>
                {theme === value.theme && <Icon name="check" size={15} />}
              </span>
              {themeInfo[theme].name}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="appearance-fieldset">
        <legend>Motiv</legend>
        <div className="house-options">
          {(
            [
              ["classic", "Hus"],
              ["cabin", "Hytte"],
              ["townhouse", "Byhus"],
              ["park", "Vinterpark"],
              ["forest", "Granskog"],
              ["village", "Juleby"],
            ] as const
          ).map(([house, label]) => (
            <button
              type="button"
              key={house}
              aria-pressed={value.scene.house === house}
              className={`house-option ${value.scene.house === house ? "selected" : ""}`}
              onClick={() => scene({ house })}
            >
              <Artwork theme={value.theme} scene={{ ...value.scene, house }} />
              <span>
                {label}
                {value.scene.house === house && <Icon name="check" size={14} />}
              </span>
            </button>
          ))}
        </div>
      </fieldset>
      {groups.map((group) => (
        <fieldset key={group.title} className="appearance-fieldset">
          <legend>{group.title}</legend>
          <div className="scene-toggles">
            {group.options.map(([key, label]) => (
              <label className="scene-toggle" key={key}>
                <span>{label}</span>
                <span className="switch-label">
                  <input
                    type="checkbox"
                    aria-label={label}
                    checked={key === "presents" ? value.scene.presents !== false : Boolean(value.scene[key])}
                    onChange={(event) => scene({ [key]: event.target.checked })}
                  />
                  <span className="switch" />
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <fieldset className="appearance-fieldset">
        <legend>Himmel</legend>
        <div className="sky-options">
          {(
            [
              ["stars", "Stjernehimmel"],
              ["moon", "Halvmåne"],
              ["fullmoon", "Fullmåne"],
              ["cloudy", "Overskyet"],
              ["clear", "Rolig himmel"],
            ] as const
          ).map(([sky, label]) => (
            <button
              type="button"
              key={sky}
              aria-pressed={value.scene.sky === sky}
              className={`sky-option ${value.scene.sky === sky ? "selected" : ""}`}
              onClick={() => scene({ sky })}
            >
              <span className={`sky-swatch sky-${sky}`} aria-hidden="true">
                {sky === "stars" ? (
                  <Icon name="star" size={20} />
                ) : sky === "moon" ? (
                  <span className="moon-swatch" />
                ) : sky === "fullmoon" ? (
                  <span className="fullmoon-swatch" />
                ) : sky === "cloudy" ? (
                  <Icon name="cloud" size={22} />
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 9h16M6 15h12" /></svg>
                )}
              </span>
              <span>{label}</span>
              {value.scene.sky === sky && <Icon name="check" size={14} />}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
