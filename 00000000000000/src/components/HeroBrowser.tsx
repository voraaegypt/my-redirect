import { motion } from "motion/react";

export default function HeroBrowser() {
  return (
    <div id="hero-browser-wrapper" className="w-full max-w-2xl mx-auto px-4 py-6">
      <motion.div
        id="floating-browser"
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-full rounded-2xl border-2 border-red-wine/20 bg-white/40 backdrop-blur-md shadow-xl overflow-hidden relative"
      >
        {/* Browser Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-red-wine/15 bg-transparent select-none">
          {/* macOS window buttons */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FF605C]" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD44]" />
            <span className="w-3 h-3 rounded-full bg-[#00CA4E]" />
          </div>

          {/* Yellow rounded search bar element */}
          <div className="flex items-center gap-1.5">
            <div className="w-24 h-5 bg-[#FFBD44] rounded-full opacity-80 cursor-pointer" />
          </div>
        </div>

        {/* Browser Main Body Content */}
        <div className="relative h-[200px] flex items-center justify-center overflow-hidden">
          <motion.h1
            id="waitlist-text"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="font-display font-black text-red-wine text-7xl sm:text-8xl tracking-tighter select-none z-10 text-center lowercase"
          >
            waitlist
          </motion.h1>
        </div>
      </motion.div>
    </div>
  );
}
