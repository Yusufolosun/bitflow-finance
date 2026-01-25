import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Trend indicator interface
 */
interface Trend {
  value: number;
  isPositive: boolean;
}

/**
 * StatsCard Props
 */
interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: Trend;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
  subtitle?: string;
}

/**
 * StatsCard Component
 * Reusable card component for displaying statistics
 */
export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  label,
  value,
  trend,
  color = 'blue',
  subtitle,
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      border: 'border-blue-200',
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600',
      border: 'border-green-200',
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      border: 'border-purple-200',
    },
    orange: {
      bg: 'bg-orange-100',
      text: 'text-orange-600',
      border: 'border-orange-200',
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-600',
      border: 'border-red-200',
    },
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-600',
      border: 'border-yellow-200',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 ${colors.bg} rounded-lg`}>
          <div className={colors.text}>{icon}</div>
        </div>
        
        {trend && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              trend.isPositive
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        <div className="text-sm text-gray-500 mb-2">{label}</div>
        <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
        {subtitle && (
          <div className="text-xs text-gray-600">{subtitle}</div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
