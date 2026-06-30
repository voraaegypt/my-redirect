import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CreditCard, 
  ShoppingBag, 
  Truck, 
  Lock, 
  CheckCircle2, 
  ArrowLeft, 
  MapPin, 
  Phone, 
  User, 
  Mail, 
  HelpCircle, 
  ShieldCheck, 
  Sparkles,
  RefreshCw,
  Clock
} from "lucide-react";
import { OrderDetails } from "../types";

import pinkBrushImg from "../assets/images/pink_brush_silk_1782845114900.jpg";
import blackBrushImg from "../assets/images/black_brush_box_1782845127692.jpg";
import purpleBrushImg from "../assets/images/purple_brush_silk_1782845139907.jpg";
import collageImg from "../assets/images/brushes_collage_packaging_1782845150518.jpg";

interface PaymentPageProps {
  initialColor: "pink" | "purple" | "black" | null;
  onBack: () => void;
}

export default function PaymentPage({ initialColor, onBack }: PaymentPageProps) {
  // Order selection state
  const [selectedColor, setSelectedColor] = useState<"pink" | "purple" | "black">(
    initialColor || "pink"
  );
  const [packageType, setPackageType] = useState<"single" | "gift_set">("single");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod" | "apple_pay">("card");

  // Shipping form state
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("SA"); // Default to KSA
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  // Card details state
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  // UI flow states
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderDetails | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showApplePaySheet, setShowApplePaySheet] = useState(false);
  const [applePayStep, setApplePayStep] = useState<"idle" | "verifying" | "success">("idle");

  // Load existing user details from waitlist if registered
  useEffect(() => {
    const existingSubmissions = localStorage.getItem("smoozice_submissions");
    if (existingSubmissions) {
      try {
        const parsed = JSON.parse(existingSubmissions);
        if (parsed && parsed.length > 0) {
          const latest = parsed[parsed.length - 1];
          if (latest.phoneNumber) setPhoneNumber(latest.phoneNumber);
          if (latest.email) setEmail(latest.email);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Determine current image preview based on color and package
  const getProductImage = () => {
    if (packageType === "gift_set") {
      return collageImg;
    }
    if (selectedColor === "pink") return pinkBrushImg;
    if (selectedColor === "purple") return purpleBrushImg;
    return blackBrushImg;
  };

  // Pricing calculations
  const priceSingle = 149; // Special pre-order discount
  const priceGift = 219;
  const basePrice = packageType === "single" ? priceSingle : priceGift;
  const codFee = paymentMethod === "cod" ? 15 : 0;
  const totalAmount = basePrice + codFee;

  const currencySymbol = country === "AE" ? "د.إ" : country === "KW" ? "د.ك" : "ر.س";

  // Card brand detector
  const getCardBrand = (number: string) => {
    const sanitized = number.replace(/\s+/g, "");
    if (/^4/.test(sanitized)) return "Visa";
    if (/^5[1-5]/.test(sanitized)) return "Mastercard";
    if (/^6/.test(sanitized)) return "Mada"; // Simplified representation
    return "Generic";
  };

  // Card Input Formatting
  const handleCardNumberChange = (value: string) => {
    const sanitized = value.replace(/\D/g, "").slice(0, 16);
    const matches = sanitized.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(" "));
    } else {
      setCardNumber(sanitized);
    }
  };

  const handleExpiryChange = (value: string) => {
    const sanitized = value.replace(/\D/g, "").slice(0, 4);
    if (sanitized.length >= 2) {
      setExpiryDate(`${sanitized.slice(0, 2)}/${sanitized.slice(2, 4)}`);
    } else {
      setExpiryDate(sanitized);
    }
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) errors.fullName = "يرجى إدخال الاسم الكامل";
    if (!phoneNumber.trim()) {
      errors.phoneNumber = "يرجى إدخال رقم الجوال";
    } else if (phoneNumber.length < 8) {
      errors.phoneNumber = "رقم الجوال غير صالح";
    }

    if (email.trim() && !/\S+@\S+\.\S+/.test(email)) {
      errors.email = "البريد الإلكتروني غير صحيح";
    }

    if (!city.trim()) errors.city = "يرجى إدخال المدينة";
    if (!address.trim()) errors.address = "يرجى إدخال عنوان التوصيل بالتفصيل";

    if (paymentMethod === "card") {
      const sanitizedCard = cardNumber.replace(/\s+/g, "");
      if (sanitizedCard.length !== 16) {
        errors.cardNumber = "رقم البطاقة الائتمانية يجب أن يتكون من 16 رقماً";
      }
      if (!cardHolder.trim()) {
        errors.cardHolder = "يرجى إدخال اسم صاحب البطاقة";
      }
      if (expiryDate.length !== 5) {
        errors.expiryDate = "صيغة تاريخ الانتهاء يجب أن تكون MM/YY";
      } else {
        const [month, year] = expiryDate.split("/");
        const mVal = parseInt(month);
        if (mVal < 1 || mVal > 12) {
          errors.expiryDate = "شهر غير صالح";
        }
      }
      if (cvv.length < 3) {
        errors.cvv = "رمز الأمان CVV غير صالح";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Order Submission Trigger
  const handlePlaceOrder = () => {
    if (!validateForm()) {
      // Scroll to first error
      const firstError = Object.keys(formErrors)[0];
      const element = document.getElementById(`${firstError}-group`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsProcessing(true);

    // Simulate luxury processing lag to convey authentication
    setTimeout(() => {
      const uniqueId = Math.random().toString(36).substr(2, 9).toUpperCase();
      const randomOrderNum = `SMZ-${Math.floor(100000 + Math.random() * 900000)}`;

      const newOrder: OrderDetails = {
        id: uniqueId,
        orderNumber: randomOrderNum,
        fullName,
        phoneNumber,
        email,
        country,
        city,
        address,
        brushColor: selectedColor,
        packageType,
        paymentMethod,
        totalAmount,
        orderedAt: new Date().toISOString(),
        status: "confirmed"
      };

      // Save order to LocalStorage
      const savedOrders = localStorage.getItem("smoozice_orders") || "[]";
      try {
        const parsedOrders = JSON.parse(savedOrders);
        parsedOrders.push(newOrder);
        localStorage.setItem("smoozice_orders", JSON.stringify(parsedOrders));
      } catch (e) {
        console.error(e);
      }

      setIsProcessing(false);
      setOrderResult(newOrder);
    }, 2500);
  };

  // Simulating Apple Pay Trigger
  const handleApplePaySubmit = () => {
    if (!fullName.trim() || !phoneNumber.trim() || !city.trim() || !address.trim()) {
      // Ensure shipping info is set first
      validateForm();
      return;
    }
    setShowApplePaySheet(true);
    setApplePayStep("idle");
  };

  const startApplePayAuth = () => {
    setApplePayStep("verifying");
    setTimeout(() => {
      setApplePayStep("success");
      setTimeout(() => {
        // Automatically place order under apple_pay method
        const uniqueId = Math.random().toString(36).substr(2, 9).toUpperCase();
        const randomOrderNum = `SMZ-AP-${Math.floor(100000 + Math.random() * 900000)}`;

        const newOrder: OrderDetails = {
          id: uniqueId,
          orderNumber: randomOrderNum,
          fullName,
          phoneNumber,
          email,
          country,
          city,
          address,
          brushColor: selectedColor,
          packageType,
          paymentMethod: "apple_pay",
          totalAmount,
          orderedAt: new Date().toISOString(),
          status: "confirmed"
        };

        const savedOrders = localStorage.getItem("smoozice_orders") || "[]";
        try {
          const parsedOrders = JSON.parse(savedOrders);
          parsedOrders.push(newOrder);
          localStorage.setItem("smoozice_orders", JSON.stringify(parsedOrders));
        } catch (e) {
          console.error(e);
        }

        setShowApplePaySheet(false);
        setOrderResult(newOrder);
      }, 1500);
    }, 2000);
  };

  return (
    <div 
      id="payment-page-container" 
      className="w-full max-w-5xl mx-auto px-4 py-8 relative z-20 font-arabic text-right select-none"
      dir="rtl"
    >
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-red-wine/80 hover:text-red-wine transition-colors bg-white/45 hover:bg-white/65 border border-red-wine/20 px-4 py-2 rounded-full text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 rotate-180" />
          <span>العودة للرئيسية</span>
        </button>
        <span className="text-xs text-red-wine/80 bg-red-wine/10 px-3 py-1 rounded-full border border-red-wine/20 flex items-center gap-1.5 font-medium">
          <Lock className="w-3.5 h-3.5 text-red-wine" />
          بوابة دفع مشفرة بالكامل
        </span>
      </div>

      <AnimatePresence mode="wait">
        {!orderResult ? (
          <motion.div
            key="checkout-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Left Column: Form Details (8/12 width on desktop) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Product and Package Selection Panel */}
              <div className="bg-white/45 backdrop-blur-md border border-red-wine/20 rounded-3xl p-6 shadow-xl relative overflow-hidden text-red-wine">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-wine/5 rounded-full blur-2xl pointer-events-none" />
                
                <h3 className="text-xl font-bold text-red-wine mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-red-wine" />
                  <span>1. اختيار باقتك ولون الفرشاة</span>
                </h3>

                {/* Package Type Selection */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Single Package */}
                  <button
                    type="button"
                    onClick={() => setPackageType("single")}
                    className={`p-4 rounded-2xl border text-right relative flex flex-col justify-between transition-all cursor-pointer ${
                      packageType === "single" 
                        ? "bg-red-wine text-oat-milk border-red-wine shadow-md scale-[1.02]" 
                        : "bg-white/45 border-red-wine/20 hover:bg-white/65 text-red-wine"
                    }`}
                  >
                    {packageType === "single" && (
                      <span className="absolute -top-2.5 -left-2.5 bg-oat-milk text-red-wine border border-red-wine/20 font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                        العرض الأكثر طلباً
                      </span>
                    )}
                    <div>
                      <span className="block text-sm font-bold text-current">فرشاة Smoozice الفردية</span>
                      <span className="block text-xs text-current opacity-80 mt-1">تأتي مع التغليف الكلاسيكي الحريري</span>
                    </div>
                    <span className="block text-lg font-black text-current mt-4">
                      149 {currencySymbol}
                      <span className="text-xs text-current opacity-60 line-through mr-2 font-normal">249 {currencySymbol}</span>
                    </span>
                  </button>

                  {/* Gift Set Package */}
                  <button
                    type="button"
                    onClick={() => setPackageType("gift_set")}
                    className={`p-4 rounded-2xl border text-right relative flex flex-col justify-between transition-all cursor-pointer ${
                      packageType === "gift_set" 
                        ? "bg-red-wine text-oat-milk border-red-wine shadow-md scale-[1.02]" 
                        : "bg-white/45 border-red-wine/20 hover:bg-white/65 text-red-wine"
                    }`}
                  >
                    <div>
                      <span className="block text-sm font-bold text-current font-bold">مجموعة الهدايا الفاخرة</span>
                      <span className="block text-xs text-current opacity-80 mt-1">فرشاة، جراب من الحرير الطبيعي، صندوق هدايا مذهب</span>
                    </div>
                    <span className="block text-lg font-black text-current mt-4">
                      219 {currencySymbol}
                      <span className="text-xs text-current opacity-60 line-through mr-2 font-normal">349 {currencySymbol}</span>
                    </span>
                  </button>
                </div>

                {/* Color selection (only if package is single) */}
                {packageType === "single" && (
                  <div>
                    <label className="block text-xs font-bold text-red-wine/80 mb-3">اختر لون الفرشاة المفضّل:</label>
                    <div className="flex gap-4">
                      {[
                        { id: "pink", label: "وردي حريري", hex: "bg-[#F4C2C2]", border: "border-pink-300" },
                        { id: "purple", label: "بنفسجي ملكي", hex: "bg-[#D8B4F8]", border: "border-purple-300" },
                        { id: "black", label: "أسود ملكي", hex: "bg-zinc-800", border: "border-zinc-700" }
                      ].map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setSelectedColor(col.id as any)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all cursor-pointer ${
                            selectedColor === col.id 
                              ? "bg-red-wine border-red-wine text-oat-milk font-bold" 
                              : "border-red-wine/25 hover:border-red-wine text-red-wine/80 bg-white/45 hover:bg-white/65"
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full ${col.hex} border ${col.border}`} />
                          <span className="text-xs">{col.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Shipping Details Panel */}
              <div className="bg-white/45 backdrop-blur-md border border-red-wine/20 rounded-3xl p-6 shadow-xl space-y-4 text-red-wine">
                <h3 className="text-xl font-bold text-red-wine mb-2 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-red-wine" />
                  <span>2. معلومات التوصيل والشحن</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div id="fullName-group" className="space-y-1.5">
                    <label className="text-xs font-semibold text-red-wine/80 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-red-wine/50" />
                      <span>الاسم الكامل</span>
                    </label>
                    <input
                      type="text"
                      placeholder="الاسم الثلاثي أو الثنائي"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full px-4 py-3 rounded-2xl bg-white/55 border text-red-wine text-sm placeholder:text-red-wine/40 focus:outline-hidden focus:ring-2 focus:ring-red-wine/50 focus:bg-white ${
                        formErrors.fullName ? "border-red-700 bg-red-100" : "border-red-wine/20"
                      }`}
                    />
                    {formErrors.fullName && <span className="text-[10px] text-red-700 font-semibold block">⚠️ {formErrors.fullName}</span>}
                  </div>

                  {/* Phone Number */}
                  <div id="phoneNumber-group" className="space-y-1.5">
                    <label className="text-xs font-semibold text-red-wine/80 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-red-wine/50" />
                      <span>رقم الجوال (يفضل واتساب)</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="5xxxxxxx"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={`w-full px-4 py-3 rounded-2xl bg-white/55 border text-red-wine text-sm text-left placeholder:text-right placeholder:text-red-wine/40 focus:outline-hidden focus:ring-2 focus:ring-red-wine/50 focus:bg-white ${
                        formErrors.phoneNumber ? "border-red-700 bg-red-100" : "border-red-wine/20"
                      }`}
                      dir="ltr"
                    />
                    {formErrors.phoneNumber && <span className="text-[10px] text-red-700 font-semibold block">⚠️ {formErrors.phoneNumber}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Country */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-red-wine/80 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-wine/50" />
                      <span>الدولة</span>
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-white/55 border border-red-wine/20 text-red-wine text-sm focus:outline-hidden focus:ring-2 focus:ring-red-wine/50 focus:bg-white"
                    >
                      <option value="SA" className="bg-oat-milk text-red-wine">المملكة العربية السعودية 🇸🇦</option>
                      <option value="AE" className="bg-oat-milk text-red-wine">الإمارات العربية المتحدة 🇦🇪</option>
                      <option value="KW" className="bg-oat-milk text-red-wine">الكويت 🇰🇼</option>
                      <option value="QA" className="bg-oat-milk text-red-wine">قطر 🇶🇦</option>
                      <option value="BH" className="bg-oat-milk text-red-wine">البحرين 🇧🇭</option>
                      <option value="OM" className="bg-oat-milk text-red-wine">سلطنة عمان 🇴🇲</option>
                    </select>
                  </div>

                  {/* City */}
                  <div id="city-group" className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-red-wine/80 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-wine/50" />
                      <span>المدينة</span>
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: الرياض، دبي، جدة"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={`w-full px-4 py-3 rounded-2xl bg-white/55 border text-red-wine text-sm placeholder:text-red-wine/40 focus:outline-hidden focus:ring-2 focus:ring-red-wine/50 focus:bg-white ${
                        formErrors.city ? "border-red-700 bg-red-100" : "border-red-wine/20"
                      }`}
                    />
                    {formErrors.city && <span className="text-[10px] text-red-700 font-semibold block">⚠️ {formErrors.city}</span>}
                  </div>
                </div>

                {/* Detailed Address */}
                <div id="address-group" className="space-y-1.5">
                  <label className="text-xs font-semibold text-red-wine/80 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-wine/50" />
                    <span>عنوان التوصيل بالتفصيل</span>
                  </label>
                  <input
                    type="text"
                    placeholder="الحي، اسم الشارع، رقم المنزل أو رقم الشقة"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl bg-white/55 border text-red-wine text-sm placeholder:text-red-wine/40 focus:outline-hidden focus:ring-2 focus:ring-red-wine/50 focus:bg-white ${
                      formErrors.address ? "border-red-700 bg-red-100" : "border-red-wine/20"
                    }`}
                  />
                  {formErrors.address && <span className="text-[10px] text-red-700 font-semibold block">⚠️ {formErrors.address}</span>}
                </div>

                {/* Email (Optional) */}
                <div id="email-group" className="space-y-1.5">
                  <label className="text-xs font-semibold text-red-wine/80 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-red-wine/50" />
                    <span>البريد الإلكتروني (اختياري لتلقي الفاتورة)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl bg-white/55 border text-red-wine text-sm text-left placeholder:text-right placeholder:text-red-wine/40 focus:outline-hidden focus:ring-2 focus:ring-red-wine/50 focus:bg-white ${
                      formErrors.email ? "border-red-700 bg-red-100" : "border-red-wine/20"
                    }`}
                    dir="ltr"
                  />
                  {formErrors.email && <span className="text-[10px] text-red-700 font-semibold block">⚠️ {formErrors.email}</span>}
                </div>
              </div>

              {/* Payment Methods and Form Panel */}
              <div className="bg-white/45 backdrop-blur-md border border-red-wine/20 rounded-3xl p-6 shadow-xl space-y-6 text-red-wine">
                <h3 className="text-xl font-bold text-red-wine flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-red-wine" />
                  <span>3. خيارات الدفع والبيانات</span>
                </h3>

                {/* Tab selector */}
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-red-wine/5 rounded-2xl border border-red-wine/15">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      paymentMethod === "card" 
                        ? "bg-red-wine text-oat-milk shadow-md" 
                        : "text-red-wine/80 hover:text-red-wine hover:bg-white/40"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>بطاقة مدى/ائتمان</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("apple_pay")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      paymentMethod === "apple_pay" 
                        ? "bg-red-wine text-oat-milk shadow-md" 
                        : "text-red-wine/80 hover:text-red-wine hover:bg-white/40"
                    }`}
                  >
                    <span className="font-sans font-black"> Pay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      paymentMethod === "cod" 
                        ? "bg-red-wine text-oat-milk shadow-md" 
                        : "text-red-wine/80 hover:text-red-wine hover:bg-white/40"
                    }`}
                  >
                    <span>الدفع عند الاستلام</span>
                  </button>
                </div>

                {/* Subsections based on payment method */}
                <AnimatePresence mode="wait">
                  {paymentMethod === "card" && (
                    <motion.div
                      key="card-inputs"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      {/* Card Number */}
                      <div id="cardNumber-group" className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-semibold text-red-wine/80">رقم البطاقة الائتمانية</label>
                          {/* Dynamically detected brand logo */}
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-red-wine/10 text-red-wine border border-red-wine/15 flex items-center gap-1">
                            {getCardBrand(cardNumber) === "Visa" && "VISA"}
                            {getCardBrand(cardNumber) === "Mastercard" && "Mastercard"}
                            {getCardBrand(cardNumber) === "Mada" && "مدى mada"}
                            {getCardBrand(cardNumber) === "Generic" && "البطاقة"}
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder="xxxx xxxx xxxx xxxx"
                          value={cardNumber}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          className={`w-full px-4 py-3 rounded-2xl bg-white/55 border text-red-wine text-sm text-left placeholder:text-right placeholder:text-red-wine/40 focus:outline-hidden focus:ring-2 focus:ring-red-wine/50 focus:bg-white ${
                            formErrors.cardNumber ? "border-red-700 bg-red-100" : "border-red-wine/20"
                          }`}
                          dir="ltr"
                        />
                        {formErrors.cardNumber && <span className="text-[10px] text-red-700 font-semibold block">⚠️ {formErrors.cardNumber}</span>}
                      </div>

                      {/* Card Holder Name */}
                      <div id="cardHolder-group" className="space-y-1.5">
                        <label className="text-xs font-semibold text-red-wine/80">اسم حامل البطاقة (كما هو مكتوب عليها)</label>
                        <input
                          type="text"
                          placeholder="SARAH AL-SAUD"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                          className={`w-full px-4 py-3 rounded-2xl bg-white/55 border text-red-wine text-sm text-left placeholder:text-right placeholder:text-red-wine/40 focus:outline-hidden focus:ring-2 focus:ring-red-wine/50 focus:bg-white ${
                            formErrors.cardHolder ? "border-red-700 bg-red-100" : "border-red-wine/20"
                          }`}
                          dir="ltr"
                        />
                        {formErrors.cardHolder && <span className="text-[10px] text-red-700 font-semibold block">⚠️ {formErrors.cardHolder}</span>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Expiry Date */}
                        <div id="expiryDate-group" className="space-y-1.5">
                          <label className="text-xs font-semibold text-red-wine/80">تاريخ الانتهاء</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={expiryDate}
                            onChange={(e) => handleExpiryChange(e.target.value)}
                            className={`w-full px-4 py-3 rounded-2xl bg-white/55 border text-red-wine text-sm text-center placeholder:text-center placeholder:text-red-wine/40 focus:outline-hidden focus:ring-2 focus:ring-red-wine/50 focus:bg-white ${
                              formErrors.expiryDate ? "border-red-700 bg-red-100" : "border-red-wine/20"
                            }`}
                            dir="ltr"
                          />
                          {formErrors.expiryDate && <span className="text-[10px] text-red-700 font-semibold block">⚠️ {formErrors.expiryDate}</span>}
                        </div>

                        {/* CVV */}
                        <div id="cvv-group" className="space-y-1.5">
                          <label className="text-xs font-semibold text-red-wine/80">رمز الأمان (CVV)</label>
                          <input
                            type="password"
                            placeholder="•••"
                            maxLength={4}
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                            className={`w-full px-4 py-3 rounded-2xl bg-white/55 border text-red-wine text-sm text-center placeholder:text-center placeholder:text-red-wine/40 focus:outline-hidden focus:ring-2 focus:ring-red-wine/50 focus:bg-white ${
                              formErrors.cvv ? "border-red-700 bg-red-100" : "border-red-wine/20"
                            }`}
                            dir="ltr"
                          />
                          {formErrors.cvv && <span className="text-[10px] text-red-700 font-semibold block">⚠️ {formErrors.cvv}</span>}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {paymentMethod === "apple_pay" && (
                    <motion.div
                      key="apple-pay-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-6 flex flex-col items-center text-center space-y-4"
                    >
                      <div className="w-16 h-16 bg-red-wine rounded-full flex items-center justify-center shadow-md">
                        <span className="font-sans font-black text-oat-milk text-3xl"></span>
                      </div>
                      <div className="space-y-1 max-w-sm">
                        <h4 className="text-sm font-bold text-red-wine">الدفع الفوري السريع عبر Apple Pay</h4>
                        <p className="text-xs text-red-wine/70 leading-relaxed">
                          ادفع بأمان وسهولة بلمسة واحدة باستخدام جهاز Apple الخاص بك. الشحن وتفاصيل الطلب ستؤخذ من النموذج أعلاه.
                        </p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleApplePaySubmit}
                        className="w-full max-w-xs py-3.5 bg-red-wine hover:bg-red-wine/90 border border-red-wine/25 rounded-2xl text-oat-milk font-sans font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-transform hover:scale-[1.01]"
                      >
                        <span className="text-lg"></span> Pay
                      </button>
                    </motion.div>
                  )}

                  {paymentMethod === "cod" && (
                    <motion.div
                      key="cod-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-4 space-y-3"
                    >
                      <div className="p-4 bg-red-wine/10 border border-red-wine/15 rounded-2xl flex items-start gap-3">
                        <span className="text-xl">💡</span>
                        <div className="space-y-1 text-red-wine">
                          <h4 className="text-xs font-bold text-red-wine">ملاحظة هامة عن الدفع عند الاستلام:</h4>
                          <p className="text-[11px] text-red-wine/80 leading-relaxed">
                            يتم تطبيق رسوم إضافية بقيمة <strong>15 {currencySymbol}</strong> تفرضها شركة الشحن كرسوم تحصيل النقد. لطلب مجاني بالكامل بدون رسوم إضافية، يرجى اختيار الدفع بالبطاقة أو Apple Pay.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column: Checkout Summary (4/12 width) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white/45 backdrop-blur-md border border-red-wine/20 rounded-3xl p-6 shadow-xl sticky top-6 text-red-wine">
                <h3 className="text-lg font-bold text-red-wine border-b border-red-wine/10 pb-3 mb-4 flex items-center justify-between">
                  <span>ملخص الطلب</span>
                  <span className="text-xs text-red-wine/60 font-medium">سلة التسوق الفاخرة</span>
                </h3>

                {/* Compact Product Card */}
                <div className="flex items-center gap-4 border-b border-red-wine/10 pb-4 mb-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-red-wine/20 shadow-inner bg-red-wine/5 flex-shrink-0">
                    <img
                      src={getProductImage()}
                      alt="Smoozice Hairbrush"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-red-wine">
                      {packageType === "gift_set" ? "مجموعة Smoozice الفاخرة للهدايا" : "فرشاة Smoozice لفك التشابك الفردية"}
                    </h4>
                    <p className="text-xs text-red-wine/80 mt-1">
                      {packageType === "single" ? `اللون: ${
                        selectedColor === "pink" ? "وردي حريري" : selectedColor === "purple" ? "بنفسجي ملكي" : "أسود فخم"
                      }` : "صندوق مذهب مخصص للإهداء"}
                    </p>
                    <span className="inline-block text-[10px] bg-red-wine/10 text-red-wine px-2 py-0.5 rounded-full font-bold mt-2">
                      مؤهل لخصم قائمة الانتظار الأولوية
                    </span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 border-b border-red-wine/10 pb-4 mb-4 text-sm text-red-wine/80">
                  <div className="flex justify-between">
                    <span>السعر الأساسي:</span>
                    <span className="font-semibold">{basePrice} {currencySymbol}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>رسوم الشحن والتوصيل الفاخر:</span>
                    <span className="font-bold text-red-wine">مجاني (FREE)</span>
                  </div>
                  {paymentMethod === "cod" && (
                    <div className="flex justify-between text-red-wine">
                      <span>رسوم الدفع عند الاستلام:</span>
                      <span className="font-semibold">+15 {currencySymbol}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-red-wine/60">
                    <span>ضريبة القيمة المضافة (15%):</span>
                    <span>شاملة بالكامل</span>
                  </div>
                </div>

                {/* Total amount */}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-base font-bold text-red-wine">المجموع الإجمالي:</span>
                  <span className="text-2xl font-black text-red-wine">
                    {totalAmount} {currencySymbol}
                  </span>
                </div>

                {/* Security Badge */}
                <div className="bg-red-wine/5 rounded-2xl p-3 border border-red-wine/10 text-center space-y-1 mb-6">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-red-wine font-semibold">
                    <ShieldCheck className="w-4 h-4 text-red-wine" />
                    <span>تشفير SSL آمن 100%</span>
                  </div>
                  <p className="text-[10px] text-red-wine/60 leading-normal">
                    تتم معالجة بياناتك الائتمانية بشكل مشفر عبر خوادم بنكية آمنة ومتوافقة مع أعلى معايير أمن المعلومات وحماية المستهلك.
                  </p>
                </div>

                {/* Confirm Checkout Button (only active if not Apple Pay) */}
                {paymentMethod !== "apple_pay" ? (
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="w-full py-4 rounded-full bg-red-wine text-oat-milk font-extrabold text-base tracking-wide flex items-center justify-center gap-2 shadow-lg hover:bg-red-wine/90 hover:scale-[1.01] transition-all duration-300 disabled:bg-red-wine/70 disabled:scale-100 cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>جاري معالجة الطلب بأمان...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-oat-milk" />
                        <span>إتمام عملية الشراء الآمن</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplePaySubmit}
                    className="w-full py-4 rounded-full bg-red-wine hover:bg-red-wine/90 border border-red-wine/25 text-oat-milk font-sans font-extrabold text-base tracking-wide flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] transition-all duration-300 cursor-pointer"
                  >
                    <span>دفع سريع  Pay</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* High-Fidelity Success View & Custom Order Tracker */
          <motion.div
            key="success-invoice"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-2xl mx-auto bg-white/45 backdrop-blur-md border border-red-wine/20 rounded-3xl p-8 shadow-2xl space-y-8 relative overflow-hidden text-red-wine"
          >
            {/* Ambient visual background glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-wine/5 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center space-y-3">
              <div className="w-20 h-20 bg-red-wine text-oat-milk rounded-full flex items-center justify-center mx-auto shadow-lg relative">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
                >
                  <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
                </motion.div>
                
                {/* Simulated Sparkles */}
                <motion.div 
                  className="absolute -top-1 -right-1 text-red-wine"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Sparkles className="w-5 h-5 fill-current" />
                </motion.div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-red-wine mt-4">تم تأكيد طلبكِ بنجاح!</h2>
              <p className="text-sm text-red-wine max-w-md mx-auto leading-relaxed">
                شكراً لثقتكِ بـ <strong className="font-display">Smoozice</strong>. لقد قمنا بحجز طلبيتكِ بنجاح وتجهيزها للشحن الفوري الأولوية لتخطي فترة الانتظار.
              </p>
            </div>

            {/* Custom Interactive Order Progress Tracker */}
            <div className="bg-red-wine/5 rounded-2xl p-5 border border-red-wine/10 space-y-6 text-red-wine">
              <h4 className="text-xs font-bold text-red-wine/90 uppercase tracking-widest text-center">حالة الشحنة والطلبية الحالية</h4>
              
              {/* Timeline Horizontal Ticks */}
              <div className="relative flex justify-between items-center max-w-md mx-auto py-2">
                {/* Horizontal Bar line behind ticks */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-red-wine/15 z-0 rounded-full" />
                <div className="absolute right-0 left-[66%] top-1/2 -translate-y-1/2 h-1 bg-red-wine z-0 rounded-full" />

                {/* Step 1: Confirmed */}
                <div className="flex flex-col items-center gap-1.5 z-10">
                  <div className="w-6 h-6 rounded-full bg-red-wine text-oat-milk flex items-center justify-center font-bold text-xs shadow-md">
                    ✓
                  </div>
                  <span className="text-[10px] font-bold text-red-wine/90">تم التأكيد</span>
                </div>

                {/* Step 2: Processing */}
                <div className="flex flex-col items-center gap-1.5 z-10">
                  <div className="w-6 h-6 rounded-full bg-red-wine text-oat-milk flex items-center justify-center font-bold text-xs shadow-md animate-pulse">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-bold text-red-wine/90">جاري التجهيز</span>
                </div>

                {/* Step 3: Shipped */}
                <div className="flex flex-col items-center gap-1.5 z-10">
                  <div className="w-6 h-6 rounded-full bg-white/55 text-red-wine/50 border border-red-wine/20 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <span className="text-[10px] font-medium text-red-wine/60">تم الشحن</span>
                </div>

                {/* Step 4: Delivered */}
                <div className="flex flex-col items-center gap-1.5 z-10">
                  <div className="w-6 h-6 rounded-full bg-white/55 text-red-wine/50 border border-red-wine/20 flex items-center justify-center font-bold text-xs">
                    4
                  </div>
                  <span className="text-[10px] font-medium text-red-wine/60">التسليم</span>
                </div>
              </div>

              {/* Status Update Card */}
              <div className="p-3 bg-red-wine/5 rounded-xl border border-red-wine/5 flex items-center gap-3">
                <span className="text-xl">✈️</span>
                <p className="text-[11px] text-red-wine/80 leading-normal">
                  <strong>تحديث الشحن:</strong> سنقوم بإرسال رقم تتبع الشحنة فورا عبر رسالة نصية وواتساب على الرقم <span className="font-semibold text-red-wine">{orderResult.phoneNumber}</span> بمجرد تسليم الشحنة لمندوب سمسا (SMSA Express) أو أرامكس.
                </p>
              </div>
            </div>

            {/* Formal Elegant Invoice Receipt */}
            <div className="bg-white text-zinc-900 rounded-2xl p-6 shadow-lg border border-red-wine/20 font-sans space-y-4 text-left" dir="ltr">
              <div className="flex justify-between items-start border-b border-zinc-200 pb-4">
                <div>
                  <h3 className="font-display font-black text-lg text-red-wine tracking-tight">SMOOZICE BR</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Luxury Hair Care Accessories</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Invoice Receipt</span>
                  <span className="font-mono text-sm font-bold text-zinc-800">{orderResult.orderNumber}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Customer Name</span>
                  <span className="font-semibold text-zinc-800 font-arabic">{orderResult.fullName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Date & Time</span>
                  <span className="font-mono text-zinc-700">{new Date(orderResult.orderedAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Shipping Location</span>
                  <span className="text-zinc-800 font-arabic font-medium">{orderResult.city}, {orderResult.country === "SA" ? "Saudi Arabia" : "United Arab Emirates"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Payment Method</span>
                  <span className="font-semibold text-zinc-800 font-arabic">
                    {orderResult.paymentMethod === "card" && "Credit Card / Mada"}
                    {orderResult.paymentMethod === "apple_pay" && "Apple Pay"}
                    {orderResult.paymentMethod === "cod" && "Cash on Delivery"}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border-t border-b border-zinc-150 py-3 mt-4 space-y-2">
                <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase">
                  <span>Product Item</span>
                  <span>Total</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-zinc-800">
                  <span className="font-arabic">
                    {orderResult.packageType === "gift_set" 
                      ? "مجموعة Smoozice الفاخرة للهدايا" 
                      : `فرشاة شعر Smoozice (${orderResult.brushColor === "pink" ? "وردي" : orderResult.brushColor === "purple" ? "بنفسجي" : "أسود"})`
                    }
                  </span>
                  <span className="font-mono">{basePrice} {currencySymbol}</span>
                </div>
                {orderResult.paymentMethod === "cod" && (
                  <div className="flex justify-between text-xs text-zinc-700">
                    <span className="font-arabic">رسوم الدفع عند الاستلام</span>
                    <span className="font-mono">+15 {currencySymbol}</span>
                  </div>
                )}
                <div className="flex justify-between text-[11px] text-zinc-500 font-medium">
                  <span>Luxury Box Wrapping & Ribbon</span>
                  <span className="text-green-600 font-bold uppercase">Included</span>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500 font-medium">
                  <span>Express Dispatch Air-Freight</span>
                  <span className="text-green-600 font-bold uppercase">FREE</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-bold text-zinc-800">Total Paid:</span>
                <span className="text-xl font-mono font-black text-red-wine">
                  {orderResult.totalAmount} {currencySymbol}
                </span>
              </div>
            </div>

            {/* Back Button to close */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-3 px-6 rounded-full bg-red-wine text-oat-milk font-bold text-sm tracking-wide shadow-md hover:bg-red-wine/90 hover:scale-[1.01] transition-all cursor-pointer text-center"
              >
                العودة للرئيسية
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setOrderResult(null);
                  setFullName("");
                  setCity("");
                  setAddress("");
                  setCardNumber("");
                  setExpiryDate("");
                  setCvv("");
                }}
                className="py-3 px-6 rounded-full border border-red-wine/30 text-red-wine text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer text-center"
              >
                طلب منتج آخر
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* High-Fidelity Slide-Up Apple Pay Simulation Sheet */}
      <AnimatePresence>
        {showApplePaySheet && (
          <>
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowApplePaySheet(false)}
              className="fixed inset-0 bg-black z-50 pointer-events-auto"
            />

            {/* Simulated Apple Pay Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 rounded-t-3xl p-6 z-50 font-sans text-white text-left select-none max-w-md mx-auto"
              dir="ltr"
            >
              {/* Apple Pay Sheet Header */}
              <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl"></span>
                  <span className="font-bold text-sm text-zinc-300">Apple Pay</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApplePaySheet(false)}
                  className="text-xs text-zinc-500 hover:text-white cursor-pointer bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 font-semibold"
                >
                  Cancel
                </button>
              </div>

              {/* Steps */}
              {applePayStep === "idle" && (
                <div className="space-y-4">
                  {/* Card selector preview */}
                  <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-6 bg-gradient-to-r from-purple-800 to-indigo-800 rounded-md border border-zinc-700 flex items-end p-1.5 shadow-xs">
                        <span className="text-[6px] font-bold tracking-widest text-zinc-300">•••• 4820</span>
                      </div>
                      <div>
                        <span className="block font-bold text-zinc-200">Riyad Bank Premium Card (mada)</span>
                        <span className="text-[10px] text-zinc-500">Shipping to: {city}, {address}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400">Edit</span>
                  </div>

                  {/* Summary lists */}
                  <div className="space-y-2.5 text-xs text-zinc-400 border-b border-zinc-900 pb-4">
                    <div className="flex justify-between">
                      <span>Merchant</span>
                      <span className="font-bold text-zinc-200">SMOOZICE CO.</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping Address</span>
                      <span className="font-bold text-zinc-200 font-arabic text-right truncate max-w-[200px]">{city}, {address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contact</span>
                      <span className="font-bold text-zinc-200">{phoneNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping Method</span>
                      <span className="font-bold text-zinc-200">Express Air Courier (FREE)</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-bold text-zinc-400">Total amount</span>
                    <span className="text-xl font-bold text-white">{totalAmount} {currencySymbol}</span>
                  </div>

                  {/* Trigger Biometric confirmation button */}
                  <div className="pt-2 text-center space-y-3">
                    <button
                      type="button"
                      onClick={startApplePayAuth}
                      className="w-full py-4 rounded-xl bg-white hover:bg-zinc-100 text-black font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99] transition-all"
                    >
                      <span className="text-lg"></span> Pay with Touch ID / Face ID
                    </button>
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      Double-click side button or authenticate biometric scan to complete pre-order of Smoozice.
                    </p>
                  </div>
                </div>
              )}

              {applePayStep === "verifying" && (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <div className="w-14 h-14 rounded-full border-2 border-zinc-700 border-t-white animate-spin flex items-center justify-center">
                    <span className="text-lg text-zinc-500"></span>
                  </div>
                  <div className="text-center space-y-1">
                    <span className="block text-sm font-bold text-zinc-300">Processing Payment...</span>
                    <span className="text-xs text-zinc-500">Communicating with your bank securely</span>
                  </div>
                </div>
              )}

              {applePayStep === "success" && (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-green-500 text-black flex items-center justify-center shadow-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2.5"
                      stroke="currentColor"
                      className="w-8 h-8"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                  <div className="text-center space-y-1">
                    <span className="block text-sm font-bold text-zinc-200">Done</span>
                    <span className="text-xs text-zinc-500">Transaction Approved</span>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
