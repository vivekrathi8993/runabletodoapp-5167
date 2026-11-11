import { motion } from "motion/react";

export function ProgressBar({ value, tone = "tangerine", height = 6 }: { value: number; tone?: "tangerine" | "moss"; height?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-paper-2" style={{ height }}>
      <motion.div
        className={tone === "moss" ? "h-full rounded-full bg-moss" : "h-full rounded-full bg-tangerine"}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
