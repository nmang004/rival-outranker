import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';

interface BacklinksChartProps {
  data: Array<{
    scanDate: string;
    totalBacklinks: number;
    newBacklinks: number;
    lostBacklinks: number;
    dofollow: number;
    nofollow: number;
  }>;
}

export function BacklinksChart({ data }: BacklinksChartProps) {
  // Prepare data for the chart
  const chartData = data
    .sort((a, b) => new Date(a.scanDate).getTime() - new Date(b.scanDate).getTime())
    .map(entry => ({
      date: new Date(entry.scanDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      totalBacklinks: entry.totalBacklinks,
      dofollow: entry.dofollow,
      nofollow: entry.nofollow,
      newBacklinks: entry.newBacklinks,
      lostBacklinks: entry.lostBacklinks * -1, // Show as negative value for visualization
    }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip
          formatter={(value, name) => {
            // Format the values for display
            if (name === 'lostBacklinks') {
              // Show lost backlinks as positive number in tooltip
              return [Math.abs(value as number), 'Lost Backlinks'];
            }
            
            // Format other metrics
            const formattedNames: Record<string, string> = {
              totalBacklinks: 'Total Backlinks',
              dofollow: 'Dofollow Links',
              nofollow: 'Nofollow Links',
              newBacklinks: 'New Backlinks',
            };
            
            return [value, formattedNames[name] || name];
          }}
        />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="totalBacklinks" 
          stackId="1"
          stroke="#0ea5e9" 
          fill="#0ea5e9" 
          fillOpacity={0.3}
        />
        <Area 
          type="monotone" 
          dataKey="dofollow" 
          stackId="2"
          stroke="#10b981" 
          fill="#10b981"
          fillOpacity={0.3} 
        />
        <Area 
          type="monotone" 
          dataKey="nofollow" 
          stackId="2"
          stroke="#f59e0b" 
          fill="#f59e0b" 
          fillOpacity={0.3}
        />
        <Area 
          type="monotone" 
          dataKey="newBacklinks" 
          stackId="3"
          stroke="#22c55e" 
          fill="#22c55e" 
          fillOpacity={0.3}
        />
        <Area 
          type="monotone" 
          dataKey="lostBacklinks" 
          stackId="3"
          stroke="#ef4444" 
          fill="#ef4444" 
          fillOpacity={0.3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}