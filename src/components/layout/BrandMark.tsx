import { useId, useState } from "react";
import { Palette } from "lucide-react";
import { pathData, shapeById } from "@/tools/wallpaper-studio/shapes";

export function BrandMark({ avatar }: { avatar: string | null }) {
  const [failed, setFailed] = useState(false);
  const clipId = useId().replace(/:/g, "");
  const cookie = shapeById("cookie9").points.map(([x, y]) => [
    50 + x * 47,
    50 + y * 47
  ] as [number, number]);
  const cookiePath = pathData(cookie);

  if (avatar && !failed) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        className="size-11 shrink-0 overflow-visible"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={cookiePath} />
          </clipPath>
        </defs>
        <image
          href={avatar}
          x="0"
          y="0"
          width="100"
          height="100"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
          onError={() => setFailed(true)}
        />
        <path
          d={cookiePath}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  return (
    <span className="flex size-11 items-center justify-center rounded-full bg-accent text-on-accent">
      <Palette size={18} />
    </span>
  );
}
