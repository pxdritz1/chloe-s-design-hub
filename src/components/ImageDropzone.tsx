import { useState, type DragEvent } from "react";
import { ImagePlus } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ImageDropzoneProps {
  onFile: (file: File) => void;
  busy?: boolean;
  label?: string;
}

export function ImageDropzone({ onFile, busy = false, label }: ImageDropzoneProps) {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  }

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`flex h-full min-h-[20rem] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-6 text-center transition-colors has-focus-visible:outline-2 has-focus-visible:outline-accent ${dragging ? "border-accent bg-sage-soft" : "border-border bg-surface"}`}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-elevated text-muted shadow-soft">
        <ImagePlus size={26} />
      </span>
      <span className="text-base font-semibold">{busy ? t("image.loading") : (label ?? t("image.choose"))}</span>
      <span className="text-sm text-muted">{t("image.drop")}</span>
      <span className="max-w-xs text-xs text-muted">{t("image.hint")}</span>
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
    </label>
  );
}

export function ImagePicker({ onFile }: { onFile: (file: File) => void }) {
  const { t } = useTranslation();

  return (
    <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-surface text-xs font-medium transition-colors hover:border-accent has-focus-visible:outline-2 has-focus-visible:outline-accent">
      <ImagePlus size={15} />
      {t("image.another")}
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
    </label>
  );
}
