import React from 'react';
import { useParams, Link } from 'react-router-dom';
import products from '../data/products.json';
import { ArrowRight, ShoppingCart, Star, ShieldCheck, Truck } from 'lucide-react';

const ProductPage = () => {
  const { id } = useParams();

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50" dir="rtl">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">عذراً، هذا المنتج غير متوفر حالياً.</h2>
        <button 
          className="flex items-center text-blue-600 hover:underline font-bold"
        >
          <ArrowRight className="ml-2" size={20} /> العودة للرئيسية
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8 font-sans" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* زر العودة - الآن يوجه إلى صفحة Featured */}
        <Link
          to="/featured"
          className="group flex items-center text-gray-500 hover:text-blue-600 mb-8 transition-all font-bold bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100"
        >
          <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} /> 
          العودة للمتجر
        </Link>

        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100 flex flex-col lg:flex-row">
          {/* قسم الصورة */}
          <div className="lg:w-1/2 relative h-[400px] lg:h-auto overflow-hidden">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-lg">
              <div className="flex items-center text-yellow-500">
                <Star size={16} fill="currentColor" />
                <span className="mr-1 text-gray-900 font-bold">4.9</span>
              </div>
            </div>
          </div>

          {/* قسم التفاصيل */}
          <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col">
            <div className="mb-6">
              <span className="inline-block bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-sm font-bold mb-4">
                منتج طبيعي 100%
              </span>
              <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4 leading-tight">
                {product.name}
              </h1>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                {product.description}
              </p>
            </div>

            {/* مميزات سريعة */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="flex items-center text-gray-600 bg-gray-50 p-3 rounded-2xl">
                <ShieldCheck className="text-green-500 ml-2" size={20} />
                <span className="text-sm font-medium">جودة مضمونة</span>
              </div>
              <div className="flex items-center text-gray-600 bg-gray-50 p-3 rounded-2xl">
                <Truck className="text-blue-500 ml-2" size={20} />
                <span className="text-sm font-medium">توصيل سريع</span>
              </div>
            </div>

            {/* السعر والطلب */}
            <div className="mt-auto pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-right w-full sm:w-auto">
                <p className="text-gray-400 text-sm mb-1">السعر الإجمالي</p>
                <div className="flex items-baseline">
                  <span className="text-4xl font-black text-blue-600">{product.price}</span>
                  <span className="text-lg font-bold text-blue-600 mr-1">ج.م</span>
                </div>
              </div>
              
              <button className="w-full sm:w-auto bg-blue-600 text-white px-10 py-5 rounded-2xl font-bold flex items-center justify-center hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95">
                <ShoppingCart className="ml-2" size={24} />
                أضف للسلة الآن
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;