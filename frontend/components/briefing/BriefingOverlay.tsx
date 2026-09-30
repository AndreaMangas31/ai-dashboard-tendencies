interface BriefingOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function BriefingOverlay({ open, onClose }: BriefingOverlayProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 lg:hidden"
      onClick={onClose}
    />
  );
}
