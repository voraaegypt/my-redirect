import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import ProductPage from './pages/ProductPage';
import Featured from './pages/Featured';

function App() {
  return (
    <Router>
      <Routes>
        {/* صفحة المميز - ندعم المسار بـ .html وبدونه لضمان أقصى توافق */}
        <Route path="/Featured.html" element={<Featured />} />
        <Route path="/Featured" element={<Featured />} />
        
        {/* مسار تفاصيل المنتج */}
        <Route path="/products/:id" element={<ProductPage />} />

        {/* الصفحة الرئيسية */}
        <Route path="/" element={<Index />} />
        
        {/* مسار احتياطي في حال لم يتطابق أي رابط */}
        <Route path="*" element={<Index />} />
      </Routes>
    </Router>
  );
}

export default App;