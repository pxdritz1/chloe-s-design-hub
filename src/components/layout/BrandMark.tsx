import { useState } from "react";
import { Palette } from "lucide-react";

export function BrandMark({ avatar }: { avatar: string | null }) {
  const [failed, setFailed] = useState(false);

  if (avatar && !failed) {
    return (
      <img
        src={avatar}
        alt=""
        width={36}
        height={36}
        onError={() => setFailed(true)}
        className="size-9 rounded-xl object-cover"
      />
    );
  }

  return (
    <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-on-accent">
      <Palette size={18} />
    </span>
  );
}
