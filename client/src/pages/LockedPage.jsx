import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LockedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  function handleGoBack() {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role === 'kitchen') navigate('/kitchen');
    else if (user.role === 'cashier') navigate('/pos');
    else navigate('/admin');
  }

  const roleLabels = {
    kitchen: 'Kitchen Display System (/kitchen)',
    cashier: 'POS Terminal (/pos)',
    admin: 'Admin Portal (/admin)',
    manager: 'Manager Portal (/admin)',
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mb-6 shadow-xl shadow-red-500/5">
        <span className="material-symbols-outlined text-4xl">lock</span>
      </div>

      <h1 className="text-3xl font-extrabold text-white mb-2">Access Restricted</h1>
      <p className="text-zinc-400 max-w-md mb-6 leading-relaxed">
        This area is locked for your account level (<span className="text-amber-400 font-semibold uppercase">{user?.role || 'Staff'}</span>). You do not have permission to view this page.
      </p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 max-w-md w-full mb-6 text-left flex items-center gap-3">
        <span className="material-symbols-outlined text-amber-500 text-2xl">info</span>
        <div>
          <p className="text-xs text-zinc-400 font-medium">Your Allowed Destination:</p>
          <p className="text-sm font-bold text-amber-400">{roleLabels[user?.role] || 'Authorized Portal'}</p>
        </div>
      </div>

      <button
        onClick={handleGoBack}
        className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center gap-2"
      >
        <span className="material-symbols-outlined">arrow_back</span>
        Return to Your Authorized Portal
      </button>
    </div>
  );
}
