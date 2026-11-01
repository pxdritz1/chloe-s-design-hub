import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ImageConverter } from "./images";
import { VideoToGif } from "./video";

const modes = ["images", "video"] as const;

export default function Converters() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<(typeof modes)[number]>("images");

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label={t("converters.mode")} className="flex gap-1.5">
        {modes.map((option) => (
          <button key={option} role="radio" aria-checked={mode === option} onClick={() => setMode(option)} className="chip">
            {t(`converters.${option}`)}
          </button>
        ))}
      </div>
      {mode === "images" ? <ImageConverter /> : <VideoToGif />}
    </div>
  );
}
