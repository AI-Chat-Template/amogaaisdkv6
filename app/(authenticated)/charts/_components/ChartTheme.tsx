import React from 'react';

interface Theme {
  name: string;
  colors: string[];
}

interface ChartThemeProps {
  onThemeChange: (colors: string[]) => void;
}

const ChartTheme: React.FC<ChartThemeProps> = ({ onThemeChange }) => {
  const themes: Theme[] = [
    { name: "palette", colors: ["#FF6B6B", "#16a34a", "#14532d", "#fde047", "#60a5fa"] },
    { name: "sapphire", colors: ["#93C5FD", "#60A5FA", "#3B82F6", "#2563EB", "#1D4ED8"] },
    { name: "ruby", colors: ["#FCA5A5", "#F87171", "#EF4444", "#DC2626", "#B91C1C"] },
    { name: "emerald", colors: ['#bbf7d0','#4ade80','#16a34a','#15803d', '#166534']},
    { name: "daylight", colors: ['#d97706','#b45309','#92400e','#78350f', '#451a03']},
    { name: "midnight", colors: ['#d6d3d1','#78716c','#44403c','#292524', '#1c1917']}
  ];

  return (
    <div className="flex gap-4 p-2.5 mt-2 md:mt-0 rounded bg-secondary">
      {themes.map((theme) => (
        <div
          key={theme.name}
          className="grid grid-cols-2 hover:scale-110 md:hover:rotate-90 duration-700 ease-in-out transform cursor-pointer grid-rows-2 rounded overflow-hidden"
          onClick={() => onThemeChange(theme.colors)}
        >
          {theme.colors.slice(0, 4).map((color, index) => (
            <div key={index} className="w-4 h-4" style={{ backgroundColor: color }} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default ChartTheme;