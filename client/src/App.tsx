import { Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppFloat from './components/WhatsAppFloat';
import Home from './pages/Home';
import MenuPage from './pages/Menu';
import CakeDetail from './pages/CakeDetail';
import Order from './pages/Order';
import Reviews from './pages/Reviews';
import About from './pages/About';
import NotFound from './pages/NotFound';
import Admin from './pages/Admin';

function Layout() {
  return (
    <div className="flex min-h-screen flex-col pt-16 sm:pt-20">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="menu/:slug" element={<CakeDetail />} />
        <Route path="order" element={<Order />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="admin" element={<Admin />} />
    </Routes>
  );
}
