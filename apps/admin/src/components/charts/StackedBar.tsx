import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface StackedBarProps {
  data: Array<{ name: string; allowed: number; denied: number }>;
  height?: number;
}

export function StackedBar({ data, height = 200 }: StackedBarProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'rgb(var(--color-text-dim))' }}
          axisLine={{ stroke: 'rgb(var(--color-border))' }}
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
        <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 10 }} />
        <Bar
          dataKey="allowed"
          stackId="a"
          fill="rgb(var(--color-green))"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="denied"
          stackId="a"
          fill="rgb(var(--color-red))"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
