import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

interface MiniBarChartProps {
  data: Array<{ name: string; value: number }>;
  color?: string;
  height?: number;
}

export function MiniBarChart({
  data,
  color = 'rgb(var(--color-amber))',
  height = 200,
}: MiniBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border-dim))" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'rgb(var(--color-text-dim))' }}
          axisLine={{ stroke: 'rgb(var(--color-border))' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'rgb(var(--color-text-dim))' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgb(var(--color-surface))',
            border: '1px solid rgb(var(--color-border))',
            borderRadius: 4,
            fontFamily: 'JetBrains Mono',
            fontSize: 11,
            color: 'rgb(var(--color-text))',
          }}
        />
        <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
