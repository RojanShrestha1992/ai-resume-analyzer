const Spinner = ({ className = "h-8 w-8" }) => (
  <span
    className={`inline-block animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500 ${className}`}
  />
);

export default Spinner;
