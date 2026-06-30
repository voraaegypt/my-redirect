import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Logo from "./components/Logo";
import HeroBrowser from "./components/HeroBrowser";
import QuestionnaireForm from "./components/QuestionnaireForm";
import PhotoGrid from "./components/PhotoGrid";
import PaymentPage from "./components/PaymentPage";
import { WaitlistSubmission } from "./types";

export default function App() {
  const [selectedColor, setSelectedColor] = useState<"pink" | "purple" | "black" | null>(null);
  const [totalSubmissionsCount, setTotalSubmissionsCount] = useState(14820);
  const [recentSubmission, setRecentSubmission] = useState<WaitlistSubmission | null>(null);
  const [activeView, setActiveView] = useState<"home" | "payment">("home");

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

  // Listen for view changes in URL query or hash
  useEffect(() => {
    const checkUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get("view") || params.get("page");
      const hash = window.location.hash;
      
      if (viewParam === "payment" || hash === "#payment") {
        setActiveView("payment");
      } else {
        setActiveView("home");
      }
    };

    // Check on mount
    checkUrl();

    // Listen to popstate (back/forward in history) and hashchange
    window.addEventListener("popstate", checkUrl);
    window.addEventListener("hashchange", checkUrl);

    return () => {
      window.removeEventListener("popstate", checkUrl);
      window.removeEventListener("hashchange", checkUrl);
    };
  }, []);

  const handleGoToPayment = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", "payment");
    window.history.pushState({}, "", url.toString());
    setActiveView("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGoToHome = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("view");
    url.searchParams.delete("page");
    url.hash = "";
    window.history.pushState({}, "", url.toString());
    setActiveView("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      className="min-h-screen w-full bg-gradient-to-b from-rose-quartz via-blush to-oat-milk text-red-wine flex flex-col justify-between selection:bg-red-wine selection:text-oat-milk overflow-x-hidden relative"
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

        <AnimatePresence mode="wait">
          {activeView === "home" ? (
            <motion.div
              key="home-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col w-full"
            >
              {/* Middle Section: Hero Browser Window */}
              <HeroBrowser />

              {/* Form Section: RTL Arabic Questionnaire & Registration Form */}
              <QuestionnaireForm
                onColorSelected={setSelectedColor}
                onSuccess={handleFormSuccess}
                onGoToPayment={handleGoToPayment}
              />

              {/* Bottom Section: Dense Aesthetic Photo Grid Collage */}
              <PhotoGrid highlightColor={selectedColor} />
            </motion.div>
          ) : (
            <motion.div
              key="payment-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <PaymentPage 
                initialColor={selectedColor} 
                onBack={handleGoToHome} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>


    </div>
  );
}

