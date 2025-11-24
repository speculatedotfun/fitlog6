"use client";

import React from "react";

export interface SimpleLineChartProps {
  // Support both { date, value } and { date, weight } formats
  data: Array<{ date: string; value?: number; weight?: number }>;
  currentValue?: number | null;
  unit?: string;
  height?: number;
  color?: string;
  className?: string;
  chartWidth?: number;
  yAxisSteps?: number;
  useThemeColors?: boolean; // Use theme classes instead of hardcoded colors
}

export function SimpleLineChart({ 
  data, 
  currentValue, 
  unit = "kg", 
  height = 180,
  color = "#00ff88",
  className = "",
  chartWidth: propChartWidth,
  yAxisSteps = 3,
  useThemeColors = false
}: SimpleLineChartProps) {
  if (data.length === 0) {
    return (
      <div style={{ height }} className={`flex items-center justify-center ${useThemeColors ? 'text-muted-foreground' : 'text-gray-500'} ${className}`}>
        אין נתונים להצגה
      </div>
    );
  }

  // Normalize data - support both 'value' and 'weight' properties
  const normalizedData = data.map(d => ({
    date: d.date,
    value: d.value ?? d.weight ?? 0
  }));

  const padding = 50;
  const chartWidth = propChartWidth ?? 350;
  const chartHeight = height;
  const graphWidth = chartWidth - padding * 2;
  const graphHeight = chartHeight - padding * 2;

  const values = normalizedData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  // Generate Y-axis labels
  const yLabels = [];
  for (let i = 0; i <= yAxisSteps; i++) {
    const value = minValue + (range * i / yAxisSteps);
    yLabels.push(value);
  }

  const points = normalizedData.map((d, i) => {
    const x = padding + (i / (normalizedData.length - 1 || 1)) * graphWidth;
    const y = padding + graphHeight - ((d.value - minValue) / range) * graphHeight;
    return { x, y, value: d.value, date: d.date };
  });

  const path = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  const lineColor = useThemeColors ? undefined : color;
  const gridColor = useThemeColors ? undefined : "#1e293b";
  const textColor = useThemeColors ? undefined : "#64748b";
  const pointStrokeColor = useThemeColors ? undefined : "#0f1a2a";

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <svg width={chartWidth} height={chartHeight} className={propChartWidth ? "w-full min-w-[600px]" : "w-full"}>
        {/* Grid lines and Y-axis labels */}
        {yLabels.map((value, idx) => {
          const ratio = (value - minValue) / range;
          const y = padding + graphHeight - (ratio * graphHeight);
          return (
            <g key={idx}>
              <line
                x1={padding}
                y1={y}
                x2={padding + graphWidth}
                y2={y}
                stroke={gridColor}
                className={useThemeColors ? "stroke-border" : undefined}
                strokeWidth="1"
              />
              <text 
                x={padding - 10} 
                y={y + 4} 
                fontSize={propChartWidth ? "12" : "11"}
                textAnchor="end" 
                fill={textColor}
                className={useThemeColors ? "fill-muted-foreground" : undefined}
              >
                {value.toFixed(unit === "kg" ? 1 : 0)}{unit}
              </text>
            </g>
          );
        })}

        {/* Data line */}
        <path
          d={path}
          fill="none"
          stroke={lineColor}
          className={useThemeColors ? "stroke-primary" : undefined}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r={propChartWidth ? 5 : 4}
              fill={lineColor}
              stroke={pointStrokeColor}
              className={useThemeColors ? "fill-primary stroke-background" : undefined}
              strokeWidth="2"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

