import { Template } from './types';

export const templates: Template[] = [
  {
    id: 'landing-page',
    name: 'صفحة هبوط تسويقية لباقة مميزة',
    description: 'صفحة متكاملة لترويج منتج أو تطبيق بريدي، تحتوي على قسم البداية، ميزات الخدمة، والتسجيل.',
    icon: 'TrendingUp',
    html: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تطبيق سحابي مميز</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Cairo', sans-serif;
        }
    </style>
</head>
<body class="bg-slate-50 text-slate-900 selection:bg-blue-100">
    <!-- الهيدر -->
    <header class="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl">س</div>
                <span class="text-xl font-bold text-slate-800">سحابي سنتر</span>
            </div>
            <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                <a href="#features" class="hover:text-blue-600 transition">المميزات</a>
                <a href="#stats" class="hover:text-blue-600 transition">الأرقام</a>
                <a href="#pricing" class="hover:text-blue-600 transition">الأسعار</a>
                <a href="#contact" class="hover:text-blue-600 transition">اتصل بنا</a>
            </nav>
            <button class="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">البدء مجاناً</button>
        </div>
    </header>

    <!-- قسم الهيرو -->
    <section class="py-20 px-6 max-w-7xl mx-auto text-center">
        <span class="bg-blue-50 text-blue-700 text-xs px-4 py-1.5 rounded-full font-bold">الجيل الجديد من الخدمات السحابية</span>
        <h1 class="text-4xl md:text-6xl font-extrabold text-slate-900 mt-6 leading-tight max-w-3xl mx-auto">أدر مشاريعك وملفاتك في مكان واحد وبمنتهى السهولة</h1>
        <p class="text-slate-500 text-lg md:text-xl mt-6 max-w-2xl mx-auto leading-relaxed">منصة متكاملة تلبي احتياجاتك الرقمية وتساعد فريقك على توفير الوقت والجهد بأعلى مستويات الأمان والدقة.</p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <button class="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition">ابدأ التجربة المجانية الآن</button>
            <button class="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-xl font-semibold hover:bg-slate-50 transition">مشاهدة فيديو تعريفي</button>
        </div>
    </section>

    <!-- قسم الخدمات والميزات -->
    <section id="features" class="py-20 bg-white px-6">
        <div class="max-w-7xl mx-auto">
            <div class="text-center max-w-2xl mx-auto mb-16">
                <h2 class="text-3xl font-bold text-slate-900">لماذا يختارنا أصحاب الأعمال؟</h2>
                <p class="text-slate-500 mt-4">نوفر حلولاً مبتكرة وسلسة تدعم نمو وتطوير نطاق شركتك بكفاءة عالية.</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- ميزة 1 -->
                <div class="border border-slate-100 rounded-2xl p-8 hover:shadow-xl hover:shadow-slate-100 transition duration-300">
                    <div class="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold mb-6 text-xl">💡</div>
                    <h3 class="text-xl font-bold text-slate-800 mb-3">سهولة فائقة في الاستخدام</h3>
                    <p class="text-slate-500 text-sm leading-relaxed">واجهة مصممة بعناية فائقة لتضمن مرونة وسلاسة تامة لجميع الموظفين حتى بدون خبرة برمجية.</p>
                </div>
                <!-- ميزة 2 -->
                <div class="border border-slate-100 rounded-2xl p-8 hover:shadow-xl hover:shadow-slate-100 transition duration-300">
                    <div class="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold mb-6 text-xl">⚡</div>
                    <h3 class="text-xl font-bold text-slate-800 mb-3">سرعة واستقرار</h3>
                    <p class="text-slate-500 text-sm leading-relaxed">بنية تحتية موثوقة تضمن تشغيل خدماتك بدون أي توقف مفاجئ وبسرعة تصفح مذهلة.</p>
                </div>
                <!-- ميزة 3 -->
                <div class="border border-slate-100 rounded-2xl p-8 hover:shadow-xl hover:shadow-slate-100 transition duration-300">
                    <div class="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold mb-6 text-xl">🛡️</div>
                    <h3 class="text-xl font-bold text-slate-800 mb-3">أمان تشفير متقدم</h3>
                    <p class="text-slate-500 text-sm leading-relaxed">صُممت بأعلى بروتوكولات الأمان العالمية لحظر الهجمات وحماية وسرّية ملفاتك الشخصية وبياناتك الحيوية.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- قسم الإحصائيات -->
    <section id="stats" class="py-16 bg-blue-600 text-white text-center px-6">
        <div class="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
                <p class="text-4xl lg:text-5xl font-extrabold">+15K</p>
                <p class="text-blue-100 text-sm mt-2">عميل سعيد بخدماتنا</p>
            </div>
            <div>
                <p class="text-4xl lg:text-5xl font-extrabold">99.9%</p>
                <p class="text-blue-100 text-sm mt-2">نسبة استقرار التشغيل</p>
            </div>
            <div>
                <p class="text-4xl lg:text-5xl font-extrabold">+2M</p>
                <p class="text-blue-100 text-sm mt-2">ملف تم رفعه بأمان</p>
            </div>
            <div>
                <p class="text-4xl lg:text-5xl font-extrabold">+40</p>
                <p class="text-blue-100 text-sm mt-2">جائزة جودة الأداء</p>
            </div>
        </div>
    </section>

    <!-- الفوتر -->
    <footer class="bg-slate-900 text-slate-400 py-12 px-6 text-center border-t border-slate-850">
        <div class="max-w-7xl mx-auto">
            <p class="text-sm">جميع الحقوق محفوظة © 2026 سحابي سنتر. تم تصميمه بذكاء وسهولة.</p>
            <div class="flex justify-center gap-6 mt-6 text-xs">
                <a href="#" class="hover:text-white transition">سياسة الخصوصية</a>
                <a href="#" class="hover:text-white transition">شروط الاستخدام</a>
                <a href="#" class="hover:text-white transition">الدعم الفني</a>
            </div>
        </div>
    </footer>
</body>
</html>`
  },
  {
    id: 'portfolio',
    name: 'معرض أعمال شخصي متطور',
    description: 'قالب أنيق ومبسط يعرض السيرة الذاتية الذاتية، المهارات التقنية، والمشاريع بأسلوب عصري.',
    icon: 'Briefcase',
    html: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>معرض أعمالي الشخصي</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Cairo', sans-serif;
        }
    </style>
</head>
<body class="bg-slate-950 text-slate-100">
    <div class="max-w-4xl mx-auto px-6 py-12">
        <!-- قسم الهيدر الشخصي -->
        <header class="flex flex-col items-center text-center pb-12 border-b border-slate-800">
            <div class="w-24 h-24 rounded-full bg-linear-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-3xl shadow-xl shadow-fuchsia-900/20">👨‍💻</div>
            <h1 class="text-3xl font-extrabold mt-6 bg-linear-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">خالد الهاشمي</h1>
            <p class="text-fuchsia-400 mt-2 text-sm font-semibold tracking-wide">مطور واجهات ومصمم تفاعلي</p>
            <p class="text-slate-400 max-w-lg mt-4 text-sm leading-relaxed">أقوم بتحويل الأفكار المعقدة إلى تصاميم مذهلة وتطبيقات سهلة الاستخدام باستخدام أحدث الأدوات التفاعلية.</p>
            <div class="flex gap-3 mt-6">
                <a href="#" class="bg-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-700 px-4 py-2 rounded-full transition">الملف المهني</a>
                <a href="#" class="bg-linear-to-r from-violet-600 to-fuchsia-600 text-xs text-white font-bold px-5 py-2 rounded-full hover:opacity-90 transition">تواصل معي</a>
            </div>
        </header>

        <!-- قسم المهارات -->
        <section class="py-12 border-b border-slate-800">
            <h2 class="text-xl font-bold mb-6 text-fuchsia-400">المهارات والخبرات 🚀</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                    <p class="text-2xl mb-1">⚛️</p>
                    <p class="text-sm font-bold text-slate-200">React & Next.js</p>
                </div>
                <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                    <p class="text-2xl mb-1">🎨</p>
                    <p class="text-sm font-bold text-slate-200">Tailwind CSS</p>
                </div>
                <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                    <p class="text-2xl mb-1">💻</p>
                    <p class="text-sm font-bold text-slate-200">TypeScript</p>
                </div>
                <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                    <p class="text-2xl mb-1">🚀</p>
                    <p class="text-sm font-bold text-slate-200">UI/UX Design</p>
                </div>
            </div>
        </section>

        <!-- قسم المشاريع المميزة -->
        <section class="py-12">
            <h2 class="text-xl font-bold mb-8 text-fuchsia-400">مشاريع اخترتها لك ✨</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- كرت مشروع 1 -->
                <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition">
                    <div class="h-40 bg-linear-to-br from-violet-900/60 to-slate-900 flex items-center justify-center font-bold text-slate-400 border-b border-slate-800">
                        [ صورة توضيحية للمنصة ]
                    </div>
                    <div class="p-6">
                        <span class="text-[10px] bg-violet-900/60 text-violet-300 font-bold px-2 py-0.5 rounded-full">برمجيات مالية</span>
                        <h3 class="text-lg font-bold mt-2">منصة المحاسب المالي السحابة</h3>
                        <p class="text-slate-400 text-xs leading-relaxed mt-2 text-justify">تطبيق صُمم خصيصاً لمساعدة رواد الأعمال والمشاريع الصغيرة على تنظيم حساباتهم وفواتيرهم بسلاسة وأمان بدون تعقيد.</p>
                        <a href="#" class="text-xs text-fuchsia-400 hover:text-fuchsia-300 font-semibold inline-flex items-center gap-1 mt-4">رابط المعاينة ←</a>
                    </div>
                </div>
                <!-- كرت مشروع 2 -->
                <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition">
                    <div class="h-40 bg-linear-to-br from-fuchsia-900/60 to-slate-900 flex items-center justify-center font-bold text-slate-400 border-b border-slate-800">
                        [ صورة توضيحية للتطبيق ]
                    </div>
                    <div class="p-6">
                        <span class="text-[10px] bg-fuchsia-900/60 text-fuchsia-300 font-bold px-2 py-0.5 rounded-full">تجارة إلكترونية</span>
                        <h3 class="text-lg font-bold mt-2">متجر سلة الشراء الذكية</h3>
                        <p class="text-slate-400 text-xs leading-relaxed mt-2 text-justify">تصميم عصري متجاوب بالكامل لمتجر إلكتروني يضم عمليات الدفع والشحن ومراقبة المنتجات بشكل تفاعلي ومبرمج.</p>
                        <a href="#" class="text-xs text-fuchsia-400 hover:text-fuchsia-300 font-semibold inline-flex items-center gap-1 mt-4">رابط المعاينة ←</a>
                    </div>
                </div>
            </div>
        </section>
    </div>
</body>
</html>`
  },
  {
    id: 'contact',
    name: 'نموذج تواصل واستبيان',
    description: 'بطاقة نموذج تواصل متكاملة ومنسقة مع حقول إدخال عصرية تناسب جميع المواقع والشركات.',
    icon: 'Mail',
    html: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تواصل معنا</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Cairo', sans-serif;
        }
    </style>
</head>
<body class="bg-slate-100 min-h-screen flex items-center justify-center p-6">
    <div class="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 md:p-10 border border-slate-100">
        <div class="text-center mb-8">
            <span class="text-3xl">✉️</span>
            <h1 class="text-2xl font-extrabold text-slate-900 mt-3">تواصل مع الخبراء</h1>
            <p class="text-slate-500 text-sm mt-2">يسعدنا تلقي رسائلكم واستفساراتكم، وسنقوم بالرد عليكم خلال 24 ساعة كحد أقصى.</p>
        </div>
        <form class="space-y-5" onsubmit="event.preventDefault();">
            <div>
                <label class="block text-xs font-bold text-slate-700 mb-2">الاسم بالكامل</label>
                <input type="text" placeholder="الاسم ثلاثياً" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 transition" />
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-700 mb-2">البريد الإلكتروني</label>
                <input type="email" placeholder="name@example.com" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 transition" />
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-700 mb-2">نوع الاستفسار</label>
                <select class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 transition bg-white">
                    <option>دعم فني وصيانة</option>
                    <option>طلب تسعيرة أو خدمة جديدة</option>
                    <option>استفسار عام</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-700 mb-2">تفاصيل الرسالة</label>
                <textarea rows="4" placeholder="اكتب تفاصيل استفسارك هنا بكل وضوح..." class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 transition"></textarea>
            </div>
            <button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition shadow-md shadow-blue-200 text-sm">إرسال الرسالة السريعة</button>
        </form>
    </div>
</body>
</html>`
  }
];
