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
  return (
    <div className="appearance-picker">
      <div className="appearance-live">
        <Artwork theme={value.theme} scene={value.scene} />
        {title && <span>{title}</span>}
      </div>
      <fieldset className="appearance-fieldset">
        <legend>Farger</legend>
        <div className="color-options">
          {THEMES.map((theme) => (
            <button
              type="button"
              key={theme}
              className={
                value.theme === theme ? "color-option selected" : "color-option"
              }
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
        <legend>Huset</legend>
        <div className="house-options">
          {(
            [
              ["classic", "Hus"],
              ["cabin", "Hytte"],
              ["townhouse", "Byhus"],
            ] as const
          ).map(([house, label]) => (
            <button
              type="button"
              key={house}
              aria-pressed={value.scene.house === house}
              className={
                value.scene.house === house
                  ? "house-option selected"
                  : "house-option"
              }
              onClick={() => scene({ house })}
            >
              <Artwork
                theme={value.theme}
                scene={{
                  ...value.scene,
                  house,
                  snowman: false,
                  reindeer: false,
                  snowfall: false,
                }}
              />
              <span>
                {label}
                {value.scene.house === house && <Icon name="check" size={14} />}
              </span>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="appearance-fieldset">
        <legend>Legg til litt jul</legend>
        <div className="scene-toggles">
          {(
            [
              ["snowman", "Snømann"],
              ["reindeer", "Reinsdyr"],
              ["trees", "Grantrær"],
              ["lights", "Julelys"],
              ["snowfall", "Snøfall"],
            ] as const
          ).map(([key, label]) => (
            <label className="scene-toggle" key={key}>
              <span>{label}</span>
              <span className="switch-label">
                <input
                  type="checkbox"
                  aria-label={label}
                  checked={value.scene[key]}
                  onChange={(event) => scene({ [key]: event.target.checked })}
                />
                <span className="switch" />
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="sky-choice">
        Himmel
        <select
          value={value.scene.sky}
          onChange={(event) =>
            scene({ sky: event.target.value as SceneSettings["sky"] })
          }
        >
          <option value="stars">Stjerner</option>
          <option value="moon">Måneskinn</option>
          <option value="clear">Rolig himmel</option>
        </select>
      </label>
    </div>
  );
}
