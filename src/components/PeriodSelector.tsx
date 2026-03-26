import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PeriodSelectorProps {
  periodo: string; // "YYYY-MM"
  onChange: (periodo: string) => void;
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function getCurrentPeriodo(): string {
  // En marzo se reporta febrero, en abril se reporta marzo, etc.
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
}

export function formatPeriodo(periodo: string): string {
  const [year, month] = periodo.split("-");
  return `${MESES[parseInt(month, 10) - 1]} ${year}`;
}

function shiftPeriodo(periodo: string, delta: number): string {
  const [y, m] = periodo.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const PeriodSelector = ({ periodo, onChange }: PeriodSelectorProps) => {
  const current = getCurrentPeriodo();
  const isCurrentMonth = periodo === current;

  return (
    <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-1.5">
      <Calendar className="w-4 h-4 text-muted-foreground" />
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => onChange(shiftPeriodo(periodo, -1))}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className="text-sm font-semibold text-foreground min-w-[140px] text-center">
        {formatPeriodo(periodo)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => onChange(shiftPeriodo(periodo, 1))}
        disabled={isCurrentMonth}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default PeriodSelector;
