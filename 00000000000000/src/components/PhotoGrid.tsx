import { motion } from "motion/react";
import pinkBrushImg from "../assets/images/pink_brush_silk_1782845114900.jpg";
import blackBrushImg from "../assets/images/black_brush_box_1782845127692.jpg";
import purpleBrushImg from "../assets/images/purple_brush_silk_1782845139907.jpg";
import collageImg from "../assets/images/brushes_collage_packaging_1782845150518.jpg";

interface PhotoGridProps {
  highlightColor: "pink" | "purple" | "black" | null;
}

export default function PhotoGrid({ highlightColor }: PhotoGridProps) {
  // A beautiful, rich aesthetic layout with a mix of aspect ratios and slight rotations to look organic
  const collageImages = [
    { id: 1, src: collageImg, className: "col-span-2 row-span-2 md:col-span-2 md:row-span-2", rotate: "rotate-0", color: null },
    { id: 2, src: pinkBrushImg, className: "col-span-1 row-span-1 md:col-span-1 md:row-span-1", rotate: "hover:rotate-1", color: "pink" },
    { id: 3, src: purpleBrushImg, className: "col-span-1 row-span-1 md:col-span-1 md:row-span-1", rotate: "hover:-rotate-1", color: "purple" },
    { id: 4, src: blackBrushImg, className: "col-span-1 row-span-1 md:col-span-1 md:row-span-1", rotate: "hover:rotate-1", color: "black" },
    { id: 5, src: pinkBrushImg, className: "col-span-1 row-span-1 md:col-span-1 md:row-span-1", rotate: "hover:-rotate-1", color: "pink" },
    { id: 6, src: purpleBrushImg, className: "col-span-1 row-span-1 md:col-span-1 md:row-span-1", rotate: "hover:rotate-1", color: "purple" },
    { id: 7, src: collageImg, className: "col-span-2 row-span-2 md:col-span-2 md:row-span-2", rotate: "rotate-0", color: null },
    { id: 8, src: blackBrushImg, className: "col-span-1 row-span-1 md:col-span-1 md:row-span-1", rotate: "hover:-rotate-1", color: "black" },
    { id: 9, src: pinkBrushImg, className: "col-span-1 row-span-1 md:col-span-1 md:row-span-1", rotate: "hover:rotate-1", color: "pink" },
    { id: 10, src: purpleBrushImg, className: "col-span-1 row-span-1 md:col-span-1 md:row-span-1", rotate: "hover:-rotate-1", color: "purple" },
    { id: 11, src: blackBrushImg, className: "col-span-1 row-span-1 md:col-span-1 md:row-span-1", rotate: "hover:rotate-1", color: "black" },
    { id: 12, src: pinkBrushImg, className: "col-span-1 row-span-1 md:col-span-1 md:row-span-1", rotate: "hover:-rotate-1", color: "pink" },
  ];

  return (
    <div id="aesthetic-collage-section" className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Dense aesthetic grid layout */}
      <div
        id="dense-aesthetic-grid"
        className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 auto-rows-[160px] sm:auto-rows-[200px] md:auto-rows-[220px]"
      >
        {collageImages.map((item) => {
          const isHighlighted = highlightColor && item.color === highlightColor;
          const isDimmed = highlightColor && item.color && item.color !== highlightColor;

          return (
            <motion.div
              key={item.id}
              className={`relative rounded-3xl overflow-hidden border-2 bg-white/5 shadow-md group select-none transition-all duration-500 ${item.className} ${item.rotate} ${
                isHighlighted
                  ? "border-yellow-200 ring-4 ring-yellow-200/20 scale-[1.01] z-10"
                  : "border-white"
              }`}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
            >
              {/* Highlight Overlay */}
              {isHighlighted && (
                <div className="absolute inset-0 bg-yellow-200/5 mix-blend-screen z-10 pointer-events-none" />
              )}

              {/* Dimmed Overlay */}
              {isDimmed && (
                <div className="absolute inset-0 bg-black/35 z-10 transition-opacity duration-500" />
              )}

              {/* Pure image representation without text/labels */}
              <img
                src={item.src}
                alt="Smoozice Hairbrush"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
