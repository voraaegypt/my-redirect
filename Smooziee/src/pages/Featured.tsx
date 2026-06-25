"use client";

import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  ShoppingBag, 
  ArrowRight, 
  Star, 
  CheckCircle, 
  Instagram, 
  Twitter, 
  Facebook,
  ChevronLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Featured = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-['Cairo']" dir="rtl">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-3xl font-black text-orange-600 tracking-tighter">Smooziee</Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-8 space-x-reverse">
              <Link to="/" className="text-gray-700 hover:text-orange-600 font-bold transition-colors">الرئيسية</Link>
              <a href="#featured" className="text-gray-700 hover:text-orange-600 font-bold transition-colors">المميز</a>
              <a href="#about" className="text-gray-700 hover:text-orange-600 font-bold transition-colors">عنّا</a>
              <button className="bg-orange-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 flex items-center">
                <ShoppingBag className="ml-2" size={20} />
                اطلب الآن
              </button>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-700">
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-orange-100 p-4 space-y-4">
            <Link to="/" className="block text-gray-700 font-bold py-2">الرئيسية</Link>
            <a href="#featured" className="block text-gray-700 font-bold py-2">المميز</a>
            <a href="#about" className="block text-gray-700 font-bold py-2">عنّا</a>
            <button className="w-full bg-orange-600 text-white px-6 py-3 rounded-xl font-bold">اطلب الآن</button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 text-right">
              <span className="inline-block bg-orange-50 text-orange-600 px-4 py-1 rounded-full text-sm font-black mb-6 animate-bounce">
                جديدنا: سموذي الصيف المنعش 🧊
              </span>
              <h1 className="text-5xl lg:text-7xl font-black text-gray-900 mb-6 leading-tight">
                انتعاش لا يقاوم <br />
                <span className="text-orange-600">مع كل رشفة</span>
              </h1>
              <p className="text-xl text-gray-500 mb-10 leading-relaxed max-w-xl">
                نقدم لك أجود أنواع الفواكه الطازجة المختارة بعناية، لنصنع لك تجربة طعم فريدة تعيد لك الحيوية والنشاط.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-orange-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-orange-700 transition-all shadow-2xl shadow-orange-200 flex items-center justify-center group">
                  استكشف القائمة
                  <ChevronLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={24} />
                </button>
                <button className="bg-white text-gray-900 border-2 border-gray-100 px-10 py-5 rounded-2xl font-black text-lg hover:border-orange-600 hover:text-orange-600 transition-all flex items-center justify-center">
                  قصتنا
                </button>
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-yellow-100 rounded-full blur-3xl opacity-50"></div>
              <img 
                src="https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&q=80" 
                alt="Smoothie" 
                className="relative z-10 rounded-[3rem] shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700 w-full object-cover h-[500px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="featured" className="py-20 bg-orange-50/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">المشروبات الأكثر طلباً</h2>
            <p className="text-gray-500 font-bold">اخترنا لك الأفضل من قائمتنا المتنوعة</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "سموذي التوت البري",
                price: "45",
                image: "https://images.unsplash.com/photo-1584736286487-03c13b59bb27?w=500&q=80",
                color: "bg-purple-50"
              },
              {
                name: "كوكتيل المانجو الملكي",
                price: "50",
                image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80",
                color: "bg-orange-50"
              },
              {
                name: "ميكس الأفوكادو بالعسل",
                price: "55",
                image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80",
                color: "bg-green-50"
              }
            ].map((item, index) => (
              <div key={index} className="group bg-white rounded-[2.5rem] p-6 shadow-sm hover:shadow-2xl transition-all duration-500 border border-orange-100">
                <div className={`relative h-64 rounded-[2rem] overflow-hidden mb-6 ${item.color}`}>
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center text-yellow-500 shadow-sm">
                    <Star size={14} fill="currentColor" />
                    <span className="mr-1 text-xs font-black text-gray-900">4.9</span>
                  </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">{item.name}</h3>
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-black text-orange-600">{item.price}</span>
                    <span className="text-sm font-bold text-orange-600 mr-1">ج.م</span>
                  </div>
                  <button className="bg-gray-900 text-white p-4 rounded-2xl hover:bg-orange-600 transition-colors shadow-lg">
                    <ShoppingBag size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-orange-600">
                <CheckCircle size={40} />
              </div>
              <h4 className="text-xl font-black mb-3">طبيعي 100%</h4>
              <p className="text-gray-500 font-medium">نستخدم فواكه طازجة يومياً بدون أي إضافات صناعية.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-yellow-600">
                <Star size={40} />
              </div>
              <h4 className="text-xl font-black mb-3">جودة ممتازة</h4>
              <p className="text-gray-500 font-medium">معايير عالمية في التحضير والنظافة لضمان أفضل تجربة.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-600">
                <ShoppingBag size={40} />
              </div>
              <h4 className="text-xl font-black mb-3">توصيل سريع</h4>
              <p className="text-gray-500 font-medium">نصل إليك أينما كنت في أسرع وقت ممكن.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <h2 className="text-4xl font-black text-orange-500 mb-6">Smooziee</h2>
              <p className="text-gray-400 text-lg max-w-md leading-relaxed">
                نحن نؤمن بأن الصحة تبدأ من الطبيعة، ولذلك نسعى دائماً لتقديم أفضل المشروبات الطبيعية التي تمنحك الطاقة والسعادة.
              </p>
            </div>
            <div>
              <h5 className="text-xl font-black mb-6">روابط سريعة</h5>
              <ul className="space-y-4 text-gray-400 font-bold">
                <li><Link to="/" className="hover:text-orange-500 transition-colors">الرئيسية</Link></li>
                <li><a href="#featured" className="hover:text-orange-500 transition-colors">المميز</a></li>
                <li><a href="#about" className="hover:text-orange-500 transition-colors">عنّا</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">تواصل معنا</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-xl font-black mb-6">تابعنا</h5>
              <div className="flex space-x-4 space-x-reverse">
                <a href="#" className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center hover:bg-orange-600 transition-all">
                  <Instagram size={24} />
                </a>
                <a href="#" className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center hover:bg-orange-600 transition-all">
                  <Twitter size={24} />
                </a>
                <a href="#" className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center hover:bg-orange-600 transition-all">
                  <Facebook size={24} />
                </a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-gray-500 font-bold">
            <p>© 2024 Smooziee. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Featured;