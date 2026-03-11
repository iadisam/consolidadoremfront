import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "destructive" | "info";
  subtitle?: string;
}

const variantStyles = {
  default: "bg-card border",
  success: "bg-success/10 border-success/20",
  warning: "bg-warning/10 border-warning/20",
  destructive: "bg-destructive/10 border-destructive/20",
  info: "bg-info/10 border-info/20",
};

const iconStyles = {
  default: "bg-muted text-muted-foreground",
  success: "bg-success/20 text-success",
  warning: "bg-warning/20 text-warning",
  destructive: "bg-destructive/20 text-destructive",
  info: "bg-info/20 text-info",
};

const MetricCard = ({ title, value, icon: Icon, variant = "default", subtitle }: MetricCardProps) => (
  <div className={cn("rounded-xl border p-5 transition-shadow hover:shadow-md", variantStyles[variant])}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <p className="text-3xl font-bold font-display mt-1 text-foreground">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg", iconStyles[variant])}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

export default MetricCard;
