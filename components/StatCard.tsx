import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  sublabel,
  accent = false,
  icon,
}: {
  label: string;
  value: string;
  sublabel?: string;
  accent?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className="panel relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <span className="label-tape">{label}</span>
        {icon}
      </div>
      <div
        className={`mt-3 font-serif text-3xl ${
          accent ? "text-cassette-amber" : "text-cassette-cream"
        }`}
      >
        {value}
      </div>
      {sublabel && <p className="mt-1 text-sm text-cassette-creamdim">{sublabel}</p>}
    </div>
  );
}
