import { useState } from "react";
import { Palette } from "lucide-react";

export function BrandMark({ avatar }: { avatar: string | null }) {
  const [failed, setFailed] = useState(false);

  if (avatar && !failed) {
    return (
      <img
        src={avatar}
        alt=""
        width={44}
        height={44}
        onError={() => setFailed(true)}
        className="size-11 rounded-full object-cover ring-2 ring-border"
      />
    );
  }

  return (
    <span className="flex size-11 items-center justify-center rounded-full bg-accent text-on-accent">
      <Palette size={18} />
    </span>
  );
}
