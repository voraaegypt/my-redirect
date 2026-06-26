import React, { useRef, useEffect, useState } from 'react';

export interface ScrollVideoProps {
  /**
   * رابط مقطع الفيديو الشفاف (يدعم .webm بترميز VP9 مع ألفا، أو .mov HEVC Alpha)
   */
  videoSrc: string;
  /**
   * ارتفاع القسم المطاطي المسؤول عن السكرول بالـ vh (مثال: 200, 300, 500)
   * كلما زاد الارتفاع زادت نعومة وبطء التمرير وعرض الفيديو فريم فريم.
   */
  height?: number;
  /**
   * قوة تأثير التمويه (Blur) بالبكسل على باقي محتويات الموقع أثناء تحريك السكرول (0-20)
   */
  blurIntensity?: number;
  /**
   * نقطة بدء التأثير بالنسبة المئوية للـ viewport (مثال: 10 تعني يبدأ التفاعل فور ظهور 10% من هذا القسم)
   */
  startTrigger?: number;
  /**
   * نقطة انتهاء التأثير بالنسبة المئوية للـ viewport (مثال: 90 تعني ينتهي عندما تختفي 90% من المساحة)
   */
  endTrigger?: number;
  /**
   * فئة تنسيق إضافية للحاوية
   */
  className?: string;
  /**
   * عنوان تعريفي أو نصوص اختيارية تطفو فوق الفيديو أثناء التمرير
   */
  children?: React.ReactNode;
}

/**
 * 📽️ ScrollVideo - مكون التحكم في مشهد الفيديو الشفاف مع السكرول (Scroll Video Controller)
 * 
 * يسمح هذا المكون بدمج فيديوهات شفافة ثلاثية الأبعاد خفيفة الوزن تتفاعل انسيابياً فريم-فريم مع حركة دولاب الماوس.
 * تم برمجته بأعلى معايير الأداء والنعومة باستخدام خوارزمية LERP لتجنب تقطيع المتصفحات.
 */
export const ScrollVideo: React.FC<ScrollVideoProps> = ({
  videoSrc,
  height = 300,
  blurIntensity = 12,
  startTrigger = 0,
  endTrigger = 100,
  className = '',
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [isSafari, setIsSafari] = useState(false);

  // الكشف عن متصفح Safari لتفعيل التحسينات الخاصة به
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setIsSafari(ua.includes('safari') && !ua.includes('chrome'));
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    // تهيئة وتأكيد توقيف الفيديو يدوياً لمنع التشغيل التلقائي الطبيعي
    video.pause();
    video.currentTime = 0;

    // متغيرات لحركة Lerp الانسيابية لمنع التقطيع
    let targetTime = 0;
    let currentTime = 0;
    let animationFrameId: number;

    // حلقة التحديث الانسيابي المستمر
    const updateLoop = () => {
      if (video.duration) {
        // فلتر التنعيم الحر (Linear Interpolation) للوصول للهدف بـ 0.15 نعومة
        const diff = targetTime - currentTime;
        currentTime += diff * 0.15;

        // لتجنب الاستهلاك المستمر للمعالج عند الاستقرار الكامل
        if (Math.abs(diff) > 0.001) {
          video.currentTime = Math.max(0, Math.min(video.duration, currentTime));
        }
      }
      animationFrameId = requestAnimationFrame(updateLoop);
    };

    updateLoop();

    // دالة حساب السكرول والتقدم
    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const viewHeight = window.innerHeight;

      // حساب المسافات الإنشائية للقسم ومقارنتها بالـ Viewport
      const sectionHeight = rect.height;
      
      // نقطة البداية (عندما يرتطم رأس السيكشن بأسفل الشاشة ناقص نسبة البداية)
      const startOffset = viewHeight * (startTrigger / 100);
      const startScroll = rect.top - viewHeight + startOffset;
      
      // النطاق الكلي لحركة التمرير النشطة لزيادة الدقة
      const totalScrollRange = sectionHeight - startOffset;

      let scrollProgress = 0;
      if (rect.top <= viewHeight - startOffset) {
        scrollProgress = Math.abs(startScroll) / totalScrollRange;
        scrollProgress = Math.max(0, Math.min(1, scrollProgress));
      }

      setProgress(scrollProgress);

      // تحديث توقيت الفيديو المستهدف
      if (video.duration) {
        targetTime = scrollProgress * video.duration;
      }

      // إضافة Blur ديناميكي على باقي محتوى الصفحة باستثناء حاوية الفيديو
      const siblingContent = document.querySelectorAll('body > *:not(.scroll-video-unblurred)');
      
      if (scrollProgress > 0.01 && scrollProgress < 0.99) {
        // تفعيل بلور تدريجي يتناسب طردياً مع عمق تمرير المستخدم
        const currentBlur = Math.sin(scrollProgress * Math.PI) * blurIntensity;
        
        container.style.backgroundColor = `rgba(0, 0, 0, ${scrollProgress * 0.45})`;
        
        // إرفاق وتحديث التمويه على مستوى محيط العناصر
        siblingContent.forEach((el) => {
          if (el !== container && !container.contains(el)) {
            (el as HTMLElement).style.filter = `blur(${currentBlur}px)`;
            (el as HTMLElement).style.transition = 'filter 0.1s ease-out';
          }
        });
      } else {
        // إرجاع الوضع للمظهر الافتراضي فور الخروج من منطقة التمرير
        container.style.backgroundColor = 'transparent';
        siblingContent.forEach((el) => {
          (el as HTMLElement).style.filter = '';
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    
    // تشغيل الحساب المبدئي
    handleScroll();

    // تنظيف الأحداث عند الفك والتعطيل
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      
      // إزالة أي فلاتر متبقية بأمان
      const siblingContent = document.querySelectorAll('body > *');
      siblingContent.forEach((el) => {
        (el as HTMLElement).style.filter = '';
      });
    };
  }, [videoSrc, blurIntensity, startTrigger, endTrigger]);

  return (
    <div
      ref={containerRef}
      id="scroll-video-section"
      className={`scroll-video-unblurred relative w-full overflow-visible transition-colors duration-500 bg-transparent ${className}`}
      style={{ height: `${height}vh` }}
    >
      {/* مشهد الفيديو المثبّت في واجهة العارض (Fixed/Sticky Container) */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center pointer-events-none z-10">
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-cover max-w-none transform scale-100 scale-x-100"
          preload="auto"
          playsinline
          muted
          loop
          style={{ 
            willChange: 'transform, opacity', 
            opacity: progress > 0.05 && progress < 0.95 ? 1 : Math.max(0.2, Math.sin(progress * Math.PI)),
          }}
        />

        {/* مؤشر تقدم السكرول بنمط نيون جذاب وسهل القراءة */}
        <div className="absolute bottom-10 right-10 z-20 bg-slate-900/80 border border-slate-800 text-slate-200 px-4 py-2 rounded-2xl flex items-center gap-3 backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-[10px] font-mono font-bold tracking-wide">
            فيديو التمرير: {Math.round(progress * 100)}%
          </span>
        </div>
      </div>

      {/* المحتوى والمركبات الإضافية الملحقة بداخل القسم لتتحرك بانسجام فوق المقطع */}
      <div className="relative z-20 w-full h-full pointer-events-none">
        {children}
      </div>

      {/* لوحة تحذيرات Safari / iOS في حال عدم ملائمة الصيغة كودياً */}
      {isSafari && (
        <div className="absolute top-4 left-4 z-40 bg-amber-950/90 border border-amber-900/60 p-3 rounded-xl max-w-xs text-[10px] text-amber-300 backdrop-blur pointer-events-auto">
          ⚠️ <strong>ملاحظة Safari/iOS:</strong> لتشغيل نظام شفافية الفيديو VP9 بنجاح على أجهزة Apple، يرجى تزويد المتصفح برابط بديل بصيغة <code>.mov</code> المرمّمة بتشفير HEVC Alpha.
        </div>
      )}
    </div>
  );
};
