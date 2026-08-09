"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDateLabel, formatMinutes } from "@/lib/format";

interface Props {
  data: Array<{ date: string; minutes_played: number }>;
}

export function TrendChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="amberFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#e2963c" stopOpacity={0.45} />
            <stop offset="95%" stopColor="#e2963c" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#3a2a1c" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateLabel}
          stroke="#8a7a68"
          fontSize={11}
          fontFamily="var(--font-mono)"
          tickLine={false}
          axisLine={{ stroke: "#3a2a1c" }}
        />
        <YAxis
          stroke="#8a7a68"
          fontSize={11}
          fontFamily="var(--font-mono)"
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatMinutes(v as number)}
          width={56}
        />
        <Tooltip
          contentStyle={{
            background: "#241a13",
            border: "1px solid #3a2a1c",
            borderRadius: 8,
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "#f2e8d8",
          }}
          labelFormatter={(label) => formatDateLabel(label as string)}
          formatter={(value) => [formatMinutes(value as number), "Played"]}
        />
        <Area
          type="monotone"
          dataKey="minutes_played"
          stroke="#e2963c"
          strokeWidth={2}
          fill="url(#amberFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
