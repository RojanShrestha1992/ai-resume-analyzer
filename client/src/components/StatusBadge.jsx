const configs = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    pulse: false,
  },
  processing: {
    label: "Processing",
    className: "bg-sky-50 text-sky-700 border-sky-200",
    pulse: true,
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pulse: false,
  },
  failed: {
    label: "Failed",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    pulse: false,
  },
};

const StatusBadge = ({ status }) => {
  const config = configs[status] || configs.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      {config.pulse && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" />
      )}
      {config.label}
    </span>
  );
};

export default StatusBadge;
