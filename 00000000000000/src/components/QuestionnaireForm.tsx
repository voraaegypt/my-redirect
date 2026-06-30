import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { QuestionnaireAnswers, WaitlistSubmission } from "../types";

interface QuestionnaireFormProps {
  onColorSelected: (color: "pink" | "purple" | "black" | null) => void;
  onSuccess: (submission: WaitlistSubmission) => void;
  onGoToPayment: () => void;
}

export default function QuestionnaireForm({
  onColorSelected,
  onSuccess,
  onGoToPayment,
}: QuestionnaireFormProps) {
  // Form State
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({
    hairType: "",
    takesCare: "",
    isBrushImportant: "",
    predictedPrice: "",
    phoneNumber: "",
    email: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof QuestionnaireAnswers, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<WaitlistSubmission | null>(null);

  const handleOptionChange = (field: keyof QuestionnaireAnswers, value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleInputChange = (field: keyof QuestionnaireAnswers, value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Validation matching the new inputs
  const validate = (): boolean => {
    const tempErrors: Partial<Record<keyof QuestionnaireAnswers, string>> = {};

    if (!answers.hairType) tempErrors.hairType = "يرجى تحديد نوع الشعر";
    if (!answers.takesCare) tempErrors.takesCare = "يرجى الإجابة على هذا السؤال";
    if (!answers.isBrushImportant) tempErrors.isBrushImportant = "يرجى الإجابة على هذا السؤال";
    
    if (!answers.predictedPrice.trim()) {
      tempErrors.predictedPrice = "يرجى إدخال السعر المتوقع";
    }
    
    if (!answers.phoneNumber.trim()) {
      tempErrors.phoneNumber = "يرجى إدخال رقم الهاتف";
    }
    
    if (!answers.email.trim()) {
      tempErrors.email = "يرجى إدخال البريد الإلكتروني";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email)) {
      tempErrors.email = "البريد الإلكتروني غير صحيح";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const currentQueue = parseInt(localStorage.getItem("smoozice_queue_count") || "14820");
      const nextQueue = currentQueue + 1;
      localStorage.setItem("smoozice_queue_count", nextQueue.toString());

      const submission: WaitlistSubmission = {
        ...answers,
        id: crypto.randomUUID(),
        submittedAt: new Date().toISOString(),
        queueNumber: nextQueue,
      };

      const existing = JSON.parse(localStorage.getItem("smoozice_submissions") || "[]");
      existing.push(submission);
      localStorage.setItem("smoozice_submissions", JSON.stringify(existing));

      setSubmittedData(submission);
      onSuccess(submission);
      setIsSubmitting(false);
    }, 1200);
  };

  const handleReset = () => {
    setAnswers({
      hairType: "",
      takesCare: "",
      isBrushImportant: "",
      predictedPrice: "",
      phoneNumber: "",
      email: "",
    });
    setSubmittedData(null);
    onColorSelected(null);
  };

  return (
    <div id="form-section-container" className="w-full max-w-[520px] mx-auto px-4 py-6">
      <AnimatePresence mode="wait">
        {!submittedData ? (
          <motion.form
            key="questionnaire-form"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            onSubmit={handleSubmit}
            dir="rtl"
            className="w-full border-2 border-red-wine/20 bg-white/45 backdrop-blur-md rounded-3xl px-8 py-10 flex flex-col gap-10 text-red-wine font-arabic relative shadow-xl"
          >
            {/* Question 1: نوع شعرِك؟ */}
            <div id="q1-group" className="flex flex-col items-center gap-4 text-center">
              <label className="text-lg font-bold tracking-wide text-red-wine">
                نوع شعرِك؟
              </label>
              <div className="flex gap-12 justify-center mt-1">
                {[
                  { label: "كيرلي", value: "كيرلي" },
                  { label: "ويفي", value: "ويفي" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOptionChange("hairType", option.value)}
                    className="flex flex-col items-center gap-3 group cursor-pointer focus:outline-hidden"
                  >
                    <span className="text-base font-semibold tracking-wide transition-colors group-hover:text-red-wine/80">
                      {option.label}
                    </span>
                    <div
                      className={`w-6 h-6 rounded-full border-2 border-red-wine/30 flex items-center justify-center transition-all ${
                        answers.hairType === option.value ? "bg-red-wine border-red-wine" : "bg-transparent"
                      }`}
                    >
                      {answers.hairType === option.value && (
                        <div className="w-2.5 h-2.5 rounded-full bg-oat-milk" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {errors.hairType && (
                <span className="text-red-700 text-xs font-semibold">⚠️ {errors.hairType}</span>
              )}
            </div>

            {/* Question 2: بتهتمي بشعرِك؟ */}
            <div id="q2-group" className="flex flex-col items-center gap-4 text-center">
              <label className="text-lg font-bold tracking-wide text-red-wine">
                بتهتمي بشعرِك؟
              </label>
              <div className="flex gap-12 justify-center mt-1">
                {[
                  { label: "اكيد", value: "اكيد" },
                  { label: "لا", value: "لا" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOptionChange("takesCare", option.value)}
                    className="flex flex-col items-center gap-3 group cursor-pointer focus:outline-hidden"
                  >
                    <span className="text-base font-semibold tracking-wide transition-colors group-hover:text-red-wine/80">
                      {option.label}
                    </span>
                    <div
                      className={`w-6 h-6 rounded-full border-2 border-red-wine/30 flex items-center justify-center transition-all ${
                        answers.takesCare === option.value ? "bg-red-wine border-red-wine" : "bg-transparent"
                      }`}
                    >
                      {answers.takesCare === option.value && (
                        <div className="w-2.5 h-2.5 rounded-full bg-oat-milk" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {errors.takesCare && (
                <span className="text-red-700 text-xs font-semibold">⚠️ {errors.takesCare}</span>
              )}
            </div>

            {/* Question 3: تفتكري الفرشة مهمة */}
            <div id="q3-group" className="flex flex-col items-center gap-4 text-center">
              <label className="text-lg font-bold tracking-wide text-red-wine">
                تفتكري الفرشة مهمة
              </label>
              <div className="flex gap-10 justify-center mt-1">
                {[
                  { label: "اكيد", value: "اكيد" },
                  { label: "مش اوي", value: "مش اوي" },
                  { label: "لا", value: "لا" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOptionChange("isBrushImportant", option.value)}
                    className="flex flex-col items-center gap-3 group cursor-pointer focus:outline-hidden"
                  >
                    <span className="text-base font-semibold tracking-wide transition-colors group-hover:text-red-wine/80">
                      {option.label}
                    </span>
                    <div
                      className={`w-6 h-6 rounded-full border-2 border-red-wine/30 flex items-center justify-center transition-all ${
                        answers.isBrushImportant === option.value ? "bg-red-wine border-red-wine" : "bg-transparent"
                      }`}
                    >
                      {answers.isBrushImportant === option.value && (
                        <div className="w-2.5 h-2.5 rounded-full bg-oat-milk" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {errors.isBrushImportant && (
                <span className="text-red-700 text-xs font-semibold">⚠️ {errors.isBrushImportant}</span>
              )}
            </div>

            {/* Text Inputs with exact labels and placeholders */}
            <div id="text-inputs" className="flex flex-col gap-6 mt-2">
              
              {/* Predicted Price Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold tracking-wide text-red-wine text-center">
                  توقعي فرشتك الاخيرة الي هتشتريها هتبقى بكام
                </label>
                <input
                  type="text"
                  value={answers.predictedPrice}
                  onChange={(e) => handleInputChange("predictedPrice", e.target.value)}
                  placeholder="ادخل السعر"
                  className="w-full bg-white/55 border border-red-wine/30 rounded-full px-6 py-3 text-red-wine placeholder-red-wine/50 text-center text-sm outline-hidden focus:bg-white/85 focus:border-red-wine/60 transition-all font-medium shadow-inner"
                />
                {errors.predictedPrice && (
                  <span className="text-red-700 text-xs font-semibold text-center">⚠️ {errors.predictedPrice}</span>
                )}
              </div>

              {/* Phone Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold tracking-wide text-red-wine text-center">
                  ادخل رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={answers.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  placeholder="ادخل رقم الوتساب الخاص بك"
                  dir="ltr"
                  className="w-full bg-white/55 border border-red-wine/30 rounded-full px-6 py-3 text-red-wine placeholder-red-wine/50 text-center text-sm outline-hidden focus:bg-white/85 focus:border-red-wine/60 transition-all font-medium shadow-inner"
                />
                {errors.phoneNumber && (
                  <span className="text-red-700 text-xs font-semibold text-center">⚠️ {errors.phoneNumber}</span>
                )}
              </div>

              {/* Email Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold tracking-wide text-red-wine text-center">
                  الايميل
                </label>
                <input
                  type="email"
                  value={answers.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="ادخل الايميل"
                  dir="ltr"
                  className="w-full bg-white/55 border border-red-wine/30 rounded-full px-6 py-3 text-red-wine placeholder-red-wine/50 text-center text-sm outline-hidden focus:bg-white/85 focus:border-red-wine/60 transition-all font-medium shadow-inner"
                />
                {errors.email && (
                  <span className="text-red-700 text-xs font-semibold text-center">⚠️ {errors.email}</span>
                )}
              </div>

            </div>

            {/* Pill-shaped Submit Button */}
            <div className="mt-4 flex flex-col items-center">
              <motion.button
                id="submit-waitlist-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full bg-red-wine text-oat-milk font-extrabold text-lg tracking-wide flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(158,24,43,0.25)] relative cursor-pointer disabled:bg-red-wine/80"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2 text-oat-milk">
                    <svg
                      className="animate-spin h-5 w-5 text-oat-milk"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>جاري الإرسال...</span>
                  </div>
                ) : (
                  <span>ارسال</span>
                )}
              </motion.button>
              
              <div className="mt-4 flex items-center justify-center gap-2 text-red-wine/80 text-xs font-medium">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 text-red-wine/70"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>بياناتكِ آمنة ومحمية بالكامل</span>
              </div>
            </div>
          </motion.form>
        ) : (
          /* Thank You / Success Card with same beautiful Immersive UI borders */
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 20 }}
            dir="rtl"
            className="w-full border-2 border-red-wine/20 bg-white/45 backdrop-blur-md rounded-3xl px-8 py-10 flex flex-col items-center justify-center text-center text-red-wine font-arabic shadow-xl relative min-h-[400px]"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-red-wine flex items-center justify-center text-oat-milk mb-6 shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="3"
                stroke="currentColor"
                className="w-10 h-10"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </motion.div>

            <h2 className="text-3xl font-extrabold mb-2 text-red-wine">تم الإرسال بنجاح!</h2>
            <p className="text-red-wine/90 text-sm max-w-sm leading-relaxed mb-6">
              شكرًا لمشاركتكِ معنا في الإستبيان. لقد تم تسجيل مكانكِ الحصري في قائمة انتظار <span className="font-display tracking-wide text-red-wine font-extrabold select-all">Smoozice</span>.
            </p>

            {/* Priority Queue Number */}
            <div className="w-full bg-red-wine/10 rounded-2xl p-4 border border-red-wine/20 mb-6 max-w-sm">
              <span className="text-xs uppercase tracking-wider text-red-wine/70 block mb-1">ترتيبكِ في قائمة الانتظار</span>
              <span className="text-4xl font-display font-extrabold text-red-wine tracking-widest">
                #{submittedData.queueNumber.toLocaleString()}
              </span>
              <div className="text-xs text-red-wine/90 mt-2">
                أنتِ الآن ضمن العملاء المؤهلين للحصول على عروض الإطلاق الحصرية!
              </div>
            </div>

            <p className="text-xs text-red-wine/80 max-w-xs leading-relaxed mb-6">
              سنقوم بالتواصل معكِ فور إطلاق فرشاتنا الفاخرة على رقم الواتساب: <br />
              <strong className="text-red-wine block mt-1 select-all font-bold" dir="ltr">
                {submittedData.phoneNumber}
              </strong>
            </p>

            {/* Skip the waitlist & pay now button */}
            <button
              onClick={onGoToPayment}
              className="w-full max-w-xs mb-4 py-3.5 px-6 rounded-full bg-red-wine text-oat-milk font-black text-sm tracking-wide shadow-[0_4px_15px_rgba(158,24,43,0.25)] hover:bg-red-wine/90 hover:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>تخطي الانتظار وطلب الفرشاة الآن 🛍️</span>
            </button>

            {/* Back to form button */}
            <button
              onClick={handleReset}
              className="px-6 py-2 rounded-full border border-red-wine/30 hover:bg-red-wine/5 hover:border-red-wine text-xs font-semibold tracking-wider transition-all cursor-pointer text-red-wine/80 hover:text-red-wine"
            >
              تسجيل رد آخر
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
