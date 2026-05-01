import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Wardrobe from './pages/Wardrobe';
import AddItem from './pages/AddItem';
import Marketplace from './pages/Marketplace';

const Layout = ({ children }) => {
  const { user } = useAuth();
  return (
    <>
      {children}
      {user && <Navbar />}
    </>
  );
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/"           element={<Navigate to="/marketplace" />} />
          <Route path="/login"      element={<Login />} />
          <Route path="/register"   element={<Register />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/wardrobe"   element={<ProtectedRoute><Wardrobe /></ProtectedRoute>} />
          <Route path="/add-item"   element={<ProtectedRoute><AddItem /></ProtectedRoute>} />
          <Route path="/profile"    element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  </AuthProvider>
);

export default App;