"use client";

export function ClassLockIndicator({
  userName,
  color = "#fbbf24",
}: {
  userName: string;
  color?: string;
}) {
  return (
    <span
      style={{ backgroundColor: color }}
      className="absolute -top-6 left-2 rounded-full px-2 py-0.5 text-[10px] font-medium text-black"
    >
      {userName} está editando
    </span>
  );
}
