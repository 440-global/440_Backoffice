import { RiFlaskLine } from "react-icons/ri";

export default function DemoBanner() {
  return (
    <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-800 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300 rounded-xl px-4 py-2.5 mb-5 text-sm">
      <RiFlaskLine size={16} className="shrink-0" />
      <span>
        <strong>Demo data</strong> — API is unreachable. Showing sample data for presentation purposes only.
      </span>
    </div>
  );
}
