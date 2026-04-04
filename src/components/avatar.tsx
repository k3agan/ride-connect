import Image from "next/image";

type AvatarSize = "sm" | "md" | "lg";

const SIZE_MAP: Record<AvatarSize, { px: number; text: string }> = {
  sm: { px: 36, text: "text-xs" },
  md: { px: 48, text: "text-sm" },
  lg: { px: 80, text: "text-xl" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  className?: string;
}

export function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  const { px, text } = SIZE_MAP[size];

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={px}
        height={px}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center shrink-0 ${text} ${className}`}
      style={{ width: px, height: px }}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
