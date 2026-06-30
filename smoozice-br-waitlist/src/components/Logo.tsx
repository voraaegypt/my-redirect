import { motion } from "motion/react";

export default function Logo() {
  return (
    <div id="logo-container" className="flex flex-col items-center justify-center py-8">
      <motion.div
        id="logo-circle"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        whileHover={{ scale: 1.05 }}
        className="w-14 h-14 rounded-full border border-white/40 flex items-center justify-center bg-white/5 backdrop-blur-xs shadow-xs relative cursor-pointer group"
      >
        {/* Delicate inner design representing hair waves and sparkles */}
        <div className="absolute inset-1 rounded-full border border-white/10" />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.2"
          stroke="currentColor"
          className="w-7 h-7 text-white group-hover:rotate-12 transition-transform duration-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.53 16.122A3 3 0 0 0 13.5 13.5a3 3 0 0 0-4.006-2.828l-3.32-.937a3 3 0 1 1 5.918-1.587l3.32.936a3 3 0 1 1-5.918 1.587l-3.32-.936A3 3 0 0 1 6 5.25a3 3 0 0 1 4.542 2.583"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18.75a6 6 0 0 0 6-6c0-1.8-1.2-3.4-3-4"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.75 12h.008v.008h-.008V12ZM15.75 6h.008v.008h-.008V6ZM21 9h.008v.008H21V9Z"
          />
        </svg>
      </motion.div>
      <motion.span
        id="logo-text"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="font-display text-white text-lg font-medium tracking-widest mt-3 lowercase select-none"
      >
        smoozice br
      </motion.span>
    </div>
  );
}
