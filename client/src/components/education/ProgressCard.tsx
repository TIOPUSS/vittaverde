import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Award } from "lucide-react";

interface ProgressCardProps {
  title: string;
  currentValue: number;
  targetValue: number;
  progressLabel: string;
  stats: Array<{
    label: string;
    value: number | string;
    color: string;
    icon?: any;
  }>;
  showPercentage?: boolean;
  variant?: "patient" | "medical";
  className?: string;
}

export function ProgressCard({
  title,
  currentValue,
  targetValue,
  progressLabel,
  stats,
  showPercentage = true,
  variant = "patient",
  className = ""
}: ProgressCardProps) {
  const percentage = targetValue > 0 ? Math.round((currentValue / targetValue) * 100) : 0;
  
  // Removed unused progressColor variable
  const iconColor = variant === "medical" ? "text-yellow-500" : "text-green-500";
  const Icon = variant === "medical" ? Award : Trophy;

  return (
    <Card className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`} data-testid="progress-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300">{progressLabel}:</span>
            <span className={`font-bold ${variant === 'medical' ? 'text-blue-600' : 'text-green-600'}`} data-testid="progress-value">
              {currentValue}/{targetValue}
            </span>
          </div>
          <Progress 
            value={percentage} 
            className="h-3" 
            data-testid="progress-bar"
          />
          
          {stats.length > 0 && (
            <div className={`grid ${stats.length === 2 ? 'grid-cols-2' : stats.length === 3 ? 'grid-cols-3' : 'grid-cols-1'} gap-4 text-xs mt-4`}>
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    {stat.icon && <stat.icon className="h-3 w-3 mr-1" />}
                    <span className="text-gray-500 dark:text-gray-400">{stat.label}:</span>
                  </div>
                  <div className={`font-medium ${stat.color}`} data-testid={`stat-${index}`}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {showPercentage && (
            <div className="text-xs text-center text-gray-500 dark:text-gray-400">
              {percentage}% concluído
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}