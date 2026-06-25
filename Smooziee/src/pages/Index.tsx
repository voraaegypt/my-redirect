"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import products from '../data/products.json';
import { Plus, ShoppingBag } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-20">
          <h1 className="text-7xl font-black text-blue-600 mb-4 tracking-tighter">Smooziee</h1>
          <div className="h-1.5 w-24 bg-blue-600 mx-auto rounded-full mb-6"></div>
          <p className="text-xl text-gray-500 font-medium max-w-md mx-auto">
            استمتع بأفضل أنواع العصائر الطبيعية والسموذي الطازج المحضر خصيصاً لك.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {products.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-gray-100 block cursor-default"
            >
              <div className="relative h-80 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg transform translate-y-10 group-hover:translate-y-0 transition-transform duration-500">
                  <Plus className="text-blue-600" size={24} />
                </div>
              </div>

              <div className="p-8">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                </div>
                <p className="text-gray-500 text-base mb-8 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-bold mb-1 uppercase tracking-wider">السعر</span>
                    <span className="text-2xl font-black text-blue-600">{product.price} <small className="text-sm">ج.م</small></span>
                  </div>
                  <span className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm cursor-pointer">
                    عرض التفاصيل
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* زر التسوق الآن يوجه إلى /Featured.html */}
        <div className="text-center mt-16">
          <button
            onClick={() => navigate('/Featured.html')}
            className="inline-block bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
          >
            <ShoppingBag className="ml-2 inline-block" size={24} />
            تسوق منتجات سموزي
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;