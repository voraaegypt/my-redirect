import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Logo from "./components/Logo";
import HeroBrowser from "./components/HeroBrowser";
import QuestionnaireForm from "./components/QuestionnaireForm";
import PhotoGrid from "./components/PhotoGrid";
import { WaitlistSubmission } from "./types";

export default function App() {
  const [selectedColor, setSelectedColor] = useState<"pink" | "purple" | "black" | null>(null);
  const [totalSubmissionsCount, setTotalSubmissionsCount] = useState(14820);
  const [recentSubmission, setRecentSubmission] = useState<WaitlistSubmission | null>(null);

  // Read initial queue count from localStorage or initialize
  useEffect(() => {
    const savedCount = localStorage.getItem("smoozice_queue_count");
    if (savedCount) {
      setTotalSubmissionsCount(parseInt(savedCount));
    } else {
      localStorage.setItem("smoozice_queue_count", "14820");
    }

    // Check if user has already submitted previously in this session
    const existing = localStorage.getItem("smoozice_submissions");
    if (existing) {
      const parsed = JSON.parse(existing);
      if (parsed.length > 0) {
        setRecentSubmission(parsed[parsed.length - 1]);
      }
    }
  }, []);

  const handleFormSuccess = (submission: WaitlistSubmission) => {
    setRecentSubmission(submission);
    setTotalSubmissionsCount(submission.queueNumber);
    
    // Smoothly scroll down to the photo grid after submission so they can admire the brushes
    setTimeout(() => {
      const collageSection = document.getElementById("aesthetic-collage-section");
      if (collageSection) {
        collageSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 1200);
  };

  return (
    <div
      id="main-app-container"
      className="min-h-screen w-full bg-[#F8C8DC] text-white flex flex-col justify-between selection:bg-white selection:text-[#F8C8DC] overflow-x-hidden relative"
    >
      {/* Delicate drifting background decorations (sparkles/particles) for a luxurious feel */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[
          { top: "10%", left: "5%", size: 4 },
          { top: "25%", left: "85%", size: 6 },
          { top: "50%", left: "12%", size: 5 },
          { top: "70%", left: "88%", size: 4 },
          { top: "85%", left: "8%", size: 6 },
        ].map((particle, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -15, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              top: particle.top,
              left: particle.left,
              width: particle.size,
              height: particle.size,
            }}
            className="rounded-full bg-white absolute"
          />
        ))}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col relative z-10">
        
        {/* Top Section: Logo */}
        <Logo />

        {/* Live Waitlist Statistics Pill Ticker */}
        <motion.div
          id="stats-ticker"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mx-auto bg-white/10 backdrop-blur-md border border-white/25 px-4 py-1.5 rounded-full flex items-center gap-2 mb-2 select-none"
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-arabic font-medium tracking-wide">
            انضم{" "}
            <strong className="font-display font-extrabold text-white">
              {totalSubmissionsCount.toLocaleString()}
            </strong>{" "}
            شخص لقائمة الانتظار الأولوية
          </span>
        </motion.div>

        {/* Middle Section: Hero Browser Window */}
        <HeroBrowser />

        {/* Form Section: RTL Arabic Questionnaire & Registration Form */}
        <QuestionnaireForm
          onColorSelected={setSelectedColor}
          onSuccess={handleFormSuccess}
        />

        {/* Bottom Section: Dense Aesthetic Photo Grid Collage */}
        <PhotoGrid highlightColor={selectedColor} />
      </main>

      {/* Aesthetic Footer Section */}
      <footer id="main-footer" className="w-full border-t border-white/15 py-8 mt-12 bg-white/5 backdrop-blur-xs relative z-10 font-arabic text-center select-none">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/70">
          <div>
            &copy; {new Date().getFullYear()} <span className="font-display lowercase text-white tracking-wider">smoozice br</span>. جميع الحقوق محفوظة.
          </div>
          
          <div className="flex items-center gap-5 font-medium">
            <a href="#logo-container" className="hover:text-white transition-colors">الرئيسية</a>
            <a href="#form-section-container" className="hover:text-white transition-colors">قائمة الانتظار</a>
            <a href="#aesthetic-collage-section" className="hover:text-white transition-colors">المعرض</a>
            <span className="text-white/20">|</span>
            <span className="text-white/80">شحن دولي سريع وسهل ✈️</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
