'use client'

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface AforoChartProps {
  total: number
  checkedIn: number
  capacity: number
}

const COLORS = ['#9b72cf', '#d1d9e6']

export default function AforoChart({ total, checkedIn, capacity }: AforoChartProps) {
  const pendientes = total - checkedIn
  const libres = Math.max(0, capacity - total)

  const data = capacity > 0
    ? [
        { name: 'Check-in realizado', value: checkedIn },
        { name: 'Inscritos pendientes', value: pendientes },
        { name: 'Lugares disponibles', value: libres },
      ].filter((d) => d.value > 0)
    : [
        { name: 'Check-in realizado', value: checkedIn || 1 },
        { name: 'Inscritos pendientes', value: pendientes || 0 },
      ].filter((d) => d.value > 0)

  const colors = ['#9b72cf', '#a0aec0', '#e0e5ec']

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={88}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} stroke="var(--surface)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: 'none',
              borderRadius: 'var(--r-md)',
              boxShadow: 'var(--shadow-soft-raised)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
            }}
          />
          <Legend
            formatter={(value) => (
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
