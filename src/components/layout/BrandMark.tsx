import { useState } from "react";
import { Cookie, Palette } from "lucide-react";

export function BrandMark({ avatar }: { avatar: string | null }) {
  const [failed, setFailed] = useState(false);

  if (avatar && !failed) {
    return (
      <span className="relative block size-11 shrink-0">
        <img
          src={avatar}
          alt=""
          width={44}
          height={44}
          onError={() => setFailed(true)}
          className="size-11 rounded-full object-cover ring-2 ring-border"
        />
        <span aria-hidden="true" className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-elevated bg-accent text-on-accent shadow-sm">
          <Cookie size={12} strokeWidth={2} />
        </span>
      </span>
    );
  }

  return (
    <span className="flex size-11 items-center justify-center rounded-full bg-accent text-on-accent">
      <Palette size={18} />
    </span>
  );
}
