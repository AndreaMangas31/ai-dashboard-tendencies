import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

interface BriefingHeaderProps {
  onClose: () => void;
}

export function BriefingHeader({ onClose }: BriefingHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-slate-700">
      <h2 className="text-lg font-bold text-slate-100">Today's Brief</h2>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-200 transition-colors"
      >
        <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
      </button>
    </div>
  );
}
