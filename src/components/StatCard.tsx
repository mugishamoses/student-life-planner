import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, subtext }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 min-h-[120px] flex flex-col">
      <div className="text-[0.875rem] text-slate-600 uppercase tracking-wider mb-3">
        {label}
      </div>
      <div className="text-[2rem] text-blue-600 mb-1">
        {value}
      </div>
      {subtext && (
        <div className="text-[0.75rem] text-slate-500">
          {subtext}
        </div>
      )}
    </div>
  );
};
