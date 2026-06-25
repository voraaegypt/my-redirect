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
        
        {/* صفحة المميز الجديدة */}
        <Route path="/Smooziee/Featured.html" element={<Featured />} />
        
        {/* مسار المنتجات */}
        <Route path="/Smooziee/products/:id" element={<ProductPage />} />
      </Routes>
    </Router>
  );
}

export default App;