import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GIFEncoder, applyPalette, quantize } from "gifenc";
import { Field } from "../../components/Field";
import { ImageDropzone } from "../../components/ImageDropzone";
import { formatBytes, fitWidth, frameTimes } from "./convert";

const colorOptions = [64, 128, 256] as const;
const maxLength = 15;

interface Clip {
  name: string;
  url: string;
  duration: number;
  width: number;
  height: number;
}

interface Gif {
  url: string;
  size: number;
  width: number;
  height: number;
}

function seek(video: HTMLVideoElement, time: number) {
  return new Promise<void>((resolve, reject) => {
    const done = () => {
      video.removeEventListener("seeked", done);
      video.removeEventListener("error", failed);
      resolve();
    };
    const failed = () => {
      video.removeEventListener("seeked", done);
      video.removeEventListener("error", failed);
      reject(new Error("could not seek the video"));
    };
    video.addEventListener("seeked", done);
    video.addEventListener("error", failed);
    video.currentTime = time;
  });
}

export function VideoToGif() {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [clip, setClip] = useState<Clip | null>(null);
  const [gif, setGif] = useState<Gif | null>(null);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [start, setStart] = useState(0);
  const [length, setLength] = useState(4);
  const [fps, setFps] = useState(10);
  const [width, setWidth] = useState(480);
  const [colors, setColors] = useState<(typeof colorOptions)[number]>(256);

  useEffect(() => {
    return () => {
      if (clip) URL.revokeObjectURL(clip.url);
    };
  }, [clip]);

  useEffect(() => {
    return () => {
      if (gif) URL.revokeObjectURL(gif.url);
    };
  }, [gif]);

  function load(file: File) {
    setError(false);
    setGif(null);
    const url = URL.createObjectURL(file);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      setClip({ name: file.name, url, duration: probe.duration, width: probe.videoWidth, height: probe.videoHeight });
      setStart(0);
      setLength(Math.min(4, Math.floor(probe.duration) || 1));
      setWidth(Math.min(480, probe.videoWidth));
    };
    probe.onerror = () => {
      URL.revokeObjectURL(url);
      setError(true);
    };
    probe.src = url;
  }

  async function generate() {
    const video = videoRef.current;
    if (!clip || !video) return;
    setError(false);
    setGif(null);

    try {
      const size = fitWidth(clip.width, clip.height, width);
      const times = frameTimes(start, Math.min(length, clip.duration - start), fps).filter((time) => time < clip.duration);
      const canvas = document.createElement("canvas");
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("2d canvas is not available");

      video.pause();
      const encoder = GIFEncoder();
      for (const [index, time] of times.entries()) {
        await seek(video, time);
        ctx.drawImage(video, 0, 0, size.width, size.height);
        const pixels = ctx.getImageData(0, 0, size.width, size.height).data;
        const palette = quantize(pixels, colors);
        encoder.writeFrame(applyPalette(pixels, palette), size.width, size.height, { palette, delay: Math.round(1000 / fps), repeat: 0 });
        setProgress({ done: index + 1, total: times.length });
      }
      encoder.finish();
      const blob = new Blob([encoder.bytes()], { type: "image/gif" });
      setGif({ url: URL.createObjectURL(blob), size: blob.size, ...size });
    } catch {
      setError(true);
    } finally {
      setProgress(null);
    }
  }

  const remaining = clip ? Math.max(1, Math.floor(clip.duration - start)) : 1;
  const busy = progress !== null;

  return (
    <div className="grid gap-3 lg:grid-cols-[23rem_minmax(0,1fr)]">
      <section className="panel space-y-5">
        <fieldset disabled={!clip || busy} className="min-w-0 space-y-5 border-0 p-0 disabled:opacity-50">
          <Field label={t("converters.start")} value={t("converters.seconds", { value: start.toFixed(1) })}>
            <input type="range" min={0} max={clip ? Math.max(0, clip.duration - 0.5) : 0} step={0.1} value={start} onChange={(event) => setStart(Number(event.target.value))} className="w-full accent-accent" />
          </Field>
          <Field label={t("converters.length")} value={t("converters.seconds", { value: Math.min(length, remaining) })}>
            <input type="range" min={1} max={Math.min(maxLength, remaining)} value={Math.min(length, remaining)} onChange={(event) => setLength(Number(event.target.value))} className="w-full accent-accent" />
          </Field>
          <Field label={t("converters.fps")} value={`${fps}`}>
            <input type="range" min={5} max={20} value={fps} onChange={(event) => setFps(Number(event.target.value))} className="w-full accent-accent" />
          </Field>
          <Field label={t("converters.width")} value={`${width}px`}>
            <input type="range" min={120} max={clip ? Math.max(120, Math.min(720, clip.width)) : 720} step={10} value={width} onChange={(event) => setWidth(Number(event.target.value))} className="w-full accent-accent" />
          </Field>
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted">{t("converters.colors")}</span>
            <div role="radiogroup" aria-label={t("converters.colors")} className="flex gap-1.5">
              {colorOptions.map((option) => (
                <button key={option} role="radio" aria-checked={colors === option} onClick={() => setColors(option)} className="chip">
                  {option}
                </button>
              ))}
            </div>
          </div>
        </fieldset>
        <button
          onClick={() => void generate()}
          disabled={!clip || busy}
          className="flex h-11 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-on-accent transition-opacity disabled:opacity-40"
        >
          {progress ? t("converters.generating", progress) : t("converters.generate")}
        </button>
      </section>
      <section className="panel min-h-[22rem] space-y-4">
        {!clip && <ImageDropzone onFile={load} accept="video/*" label={t("converters.videoPick")} hint={t("converters.videoHint")} />}
        {clip && (
          <>
            <video ref={videoRef} src={clip.url} muted playsInline controls className="max-h-[50vh] w-full rounded-2xl border border-border bg-surface" />
            {gif && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-semibold">{t("converters.result")}</h2>
                  <a
                    href={gif.url}
                    download={`${clip.name.replace(/\.[^.]+$/, "") || "video"}.gif`}
                    className="flex h-9 items-center gap-2 rounded-full bg-accent px-4 text-xs font-semibold text-on-accent"
                  >
                    <Download size={15} />
                    {t("converters.download")}
                  </a>
                </div>
                <p className="text-xs text-muted">
                  {gif.width}×{gif.height} · {formatBytes(gif.size)}
                </p>
                <div className="checker flex justify-center rounded-2xl border border-border p-2">
                  <img src={gif.url} alt={t("converters.result")} className="max-h-[50vh] max-w-full rounded-xl" />
                </div>
              </div>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="text-sm text-clay">
            {t("converters.noVideo")}
          </p>
        )}
      </section>
    </div>
  );
}
