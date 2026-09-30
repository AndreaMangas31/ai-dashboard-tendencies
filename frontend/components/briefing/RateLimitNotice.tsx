import { RateLimitInfo } from "@/hooks/useStreamBriefing";

interface RateLimitNoticeProps {
  info: RateLimitInfo;
  message: string | null;
}

export function RateLimitNotice({ info, message }: RateLimitNoticeProps) {
  return (
    <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-bold text-red-400">Groq Rate Limit Exceeded</p>
          <p className="text-sm text-slate-300 mt-2">{message}</p>
        </div>
      </div>
      <div className="bg-slate-900/50 rounded p-3 text-xs space-y-1 font-mono">
        <StatRow
          label="Daily Limit:"
          value={`${info.limit.toLocaleString()} tokens`}
        />
        <StatRow label="Tokens Used:" value={info.used.toLocaleString()} />
        <StatRow
          label="Remaining:"
          value={info.remaining.toLocaleString()}
          valueClassName="text-red-400 font-bold"
        />
        <StatRow
          label="Reset In:"
          value={info.resetIn}
          valueClassName="text-yellow-400"
          className="pt-2 border-t border-slate-800"
        />
      </div>
      <p className="text-xs text-slate-400 italic">
        Please try again after {info.resetIn}. The dashboard will resume normal
        operation once the limit resets.
      </p>
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: string;
  valueClassName?: string;
  className?: string;
}

function StatRow({
  label,
  value,
  valueClassName = "text-slate-200",
  className = "",
}: StatRowProps) {
  return (
    <div className={`flex justify-between text-slate-400 ${className}`}>
      <span>{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}
