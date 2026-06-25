import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import ProductPage from './pages/ProductPage';
import Featured from './pages/Featured';

function App() {
  return (
    <Router>
      <Routes>
        {/* الصفحة الرئيسية */}
        <Route path="/" element={<Index />} />

        {/* صفحة المميز – يدعم كلا المسارين */}
        <Route path="/Featured.html" element={<Featured />} />
        <Route path="/Featured" element={<Featured />} />

        {/* مسار تفاصيل المنتج */}
        <Route path="/products/:id" element={<ProductPage />} />
      </Routes>
    </Router>
  );
}

export default App;