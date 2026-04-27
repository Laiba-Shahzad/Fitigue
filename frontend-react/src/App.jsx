import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar        from './components/Navbar';
//import LoginPage     from './pages/LoginPage';
import PurchasesPage from './pages/PurchasesPage';
import SwapsPage     from './pages/SwapsPage';
import ChatPage      from './pages/ChatPage';

// function AppContent() {
//   const { user } = useAuth();
//   const [page, setPage] = useState('purchases');

//   // If not logged in, show login screen
//   if (!user) return <LoginPage />;

//   return (
//     <div style={{ minHeight: '100vh', background: '#f4f4f8' }}>
//       <Navbar page={page} setPage={setPage} />
//       <div style={{ padding: page === 'chat' ? 0 : '24px 16px' }}>
//         {page === 'purchases' && <PurchasesPage />}
//         {page === 'swaps'     && <SwapsPage />}
//         {page === 'chat'      && <ChatPage />}
//       </div>
//     </div>
//   );
// }

function AppContent() {
  const [page, setPage] = useState('purchases');

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f8' }}>
      <Navbar page={page} setPage={setPage} />

      <div style={{ padding: page === 'chat' ? 0 : '24px 16px' }}>
        {page === 'purchases' && <PurchasesPage />}
        {page === 'swaps' && <SwapsPage />}
        {page === 'chat' && <ChatPage />}
      </div>
    </div>
  );
}
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}