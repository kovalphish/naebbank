
import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, CreditCard, Send, Sparkles, User, Home, Bell, 
  Plus, ArrowDownLeft, ChevronRight, Lock, Phone, 
  UserCircle, Gift, X, Scan, Bus, Loader2 
} from 'lucide-react';
import { getFinancialAdvice } from './services/gemini';

// --- Types ---
export interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: 'Shopping' | 'Food' | 'Transfer' | 'Service';
}

export type Screen = 'home' | 'cards' | 'transfer' | 'assistant' | 'profile' | 'qr' | 'payment';

// --- Components ---
const LiquidBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="liquid-blob w-80 h-80 bg-blue-600/20 top-[-10%] left-[-10%] animate-float" />
    <div className="liquid-blob w-96 h-96 bg-purple-600/10 bottom-[-10%] right-[-10%] animate-float" style={{ animationDelay: '-5s' }} />
  </div>
);

const SBPLogo = () => (
  <div className="flex items-center gap-2">
    <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Плетение ромба как на фото */}
      <path d="M50 20 L80 40 L50 60 L20 40 Z" fill="#FBBF24" opacity="0.9" /> {/* Yellow */}
      <path d="M50 40 L80 60 L50 80 L20 60 Z" fill="#EF4444" opacity="0.9" /> {/* Red */}
      <path d="M20 40 L50 60 L50 80 L20 60 Z" fill="#6366F1" /> {/* Blue */}
      <path d="M50 60 L80 40 L80 60 L50 80 Z" fill="#10B981" /> {/* Green */}
      <path d="M50 20 L50 60 L20 40 Z" fill="#F59E0B" />
      <path d="M50 20 L80 40 L50 40 Z" fill="#D97706" />
    </svg>
    <span className="text-[#121131] text-3xl font-black italic tracking-tighter">сбп</span>
  </div>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fio, setFio] = useState('');
  const [error, setError] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (activeScreen === 'qr') {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
        .catch(console.error);
    }
  }, [activeScreen]);

  const getUsers = () => JSON.parse(localStorage.getItem('naeb_users') || '[]');
  
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setTimeout(() => {
      const users = getUsers();
      if (authMode === 'login') {
        const user = users.find((u: any) => u.phone === phone && u.password === password);
        if (user) { setIsAuthenticated(true); setCurrentUser(user); }
        else { setError('Ошибка входа'); }
      } else {
        const newUser = { fio, phone, password, balance: 5000, transactions: [] };
        localStorage.setItem('naeb_users', JSON.stringify([...users, newUser]));
        setCurrentUser(newUser); setIsAuthenticated(true);
      }
      setIsLoggingIn(false);
    }, 1200);
  };

  const handlePromo = () => {
    if (promoInput.toUpperCase() === 'ПРОМО1') {
      setIsLoading(true);
      setTimeout(() => {
        const newTx: Transaction = {
          id: Date.now().toString(),
          title: 'Бонус ПРОМО1',
          amount: 500,
          date: new Date().toLocaleString(),
          category: 'Service'
        };
        const updated = { ...currentUser, balance: currentUser.balance + 500, transactions: [newTx, ...currentUser.transactions] };
        setCurrentUser(updated);
        setPromoInput('');
        setIsLoading(false);
      }, 1500);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center p-6 relative">
        <LiquidBackground />
        <div className="z-10 w-full max-w-sm animate-enter">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 glass-card rounded-3xl flex items-center justify-center mb-4 shadow-2xl">
              <Shield size={40} className="text-white" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter">NAEB</h1>
            <p className="text-blue-500 font-bold text-[10px] tracking-widest uppercase">Mobile Bank</p>
          </div>
          
          <div className="glass-card p-8 rounded-[2.5rem] shadow-2xl">
            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && (
                <input type="text" placeholder="ФИО" value={fio} onChange={e => setFio(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 outline-none focus:border-blue-500 transition-all text-white" />
              )}
              <input type="tel" placeholder="Телефон" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 outline-none focus:border-blue-500 transition-all text-white" />
              <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 outline-none focus:border-blue-500 transition-all text-white" />
              {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
              <button type="submit" disabled={isLoggingIn} className="w-full bg-white text-black py-4 rounded-2xl font-black text-lg active:scale-95 transition-all flex items-center justify-center">
                {isLoggingIn ? <Loader2 className="animate-spin" /> : (authMode === 'login' ? 'Войти' : 'Создать')}
              </button>
            </form>
            <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="w-full mt-6 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
              {authMode === 'login' ? 'Нет аккаунта? Регистрация' : 'Уже есть аккаунт? Вход'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#050505] flex flex-col items-center relative select-none overflow-hidden">
      <LiquidBackground />
      {isLoading && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center animate-enter">
          <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
          <p className="text-xs font-black tracking-widest uppercase">Загрузка...</p>
        </div>
      )}

      <main className="flex-1 w-full max-w-md pt-20 pb-32 px-6 overflow-y-auto no-scrollbar z-10">
        {activeScreen === 'home' && (
          <div className="space-y-8 animate-enter">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black">Привет, {currentUser.fio.split(' ')[0]}</h2>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Ваш кошелек</p>
              </div>
              <div className="w-12 h-12 glass-card rounded-2xl flex items-center justify-center"><Bell size={20}/></div>
            </div>

            <div className="glass-card rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Shield size={80}/></div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Баланс</p>
              <h1 className="text-5xl font-black mb-6 tabular-nums">{currentUser.balance.toLocaleString()} <span className="text-2xl opacity-40">₽</span></h1>
              <div className="flex gap-3">
                <button className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-xs uppercase tracking-wider active:scale-95 transition-all">Перевод</button>
                <div className="flex-[1.5] flex bg-white/5 border border-white/10 rounded-2xl p-1">
                  <input type="text" placeholder="ПРОМО" value={promoInput} onChange={e => setPromoInput(e.target.value)} className="bg-transparent w-full outline-none px-3 text-[10px] font-black uppercase tracking-widest" />
                  <button onClick={handlePromo} className="bg-white text-black w-10 h-10 rounded-xl flex items-center justify-center"><Gift size={16}/></button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Последние операции</h3>
              {currentUser.transactions.length === 0 ? (
                <div className="glass-card rounded-3xl p-10 text-center opacity-40">Пока пусто</div>
              ) : (
                currentUser.transactions.map((tx: any) => (
                  <div key={tx.id} onClick={() => setSelectedTx(tx)} className="glass-card rounded-3xl p-4 flex items-center justify-between active:scale-[0.98] transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 glass-card rounded-2xl flex items-center justify-center"><Bus size={20} className="text-blue-500" /></div>
                      <div>
                        <p className="font-bold text-sm">{tx.title}</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">{tx.date.split(',')[0]}</p>
                      </div>
                    </div>
                    <p className="font-black text-lg">{tx.amount > 0 ? '+' : ''}{tx.amount} ₽</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeScreen === 'qr' && (
          <div className="fixed inset-0 z-50 bg-black animate-enter flex flex-col">
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-60" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="p-8 flex justify-end">
                <button onClick={() => setActiveScreen('home')} className="w-12 h-12 glass-card rounded-full flex items-center justify-center"><X/></button>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white/30 rounded-3xl relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/80 rounded-tl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/80 rounded-br-xl" />
                </div>
              </div>
              <div className="p-12 flex justify-center">
                <button onClick={() => setActiveScreen('payment')} className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all"><Scan size={32} className="text-black"/></button>
              </div>
            </div>
          </div>
        )}

        {activeScreen === 'payment' && (
          <div className="fixed inset-0 z-50 bg-[#f4f4f4] text-[#121131] animate-enter flex flex-col">
            <div className="bg-[#121131] p-4 text-center text-white text-xs font-bold uppercase tracking-widest">Оплата</div>
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-10">
              <SBPLogo />
              <div className="text-center space-y-2">
                <h4 className="font-bold text-lg">Автобус №22</h4>
                <h1 className="text-7xl font-medium tracking-tighter">44 ₽</h1>
                <p className="text-zinc-400 text-xs font-bold">{new Date().toLocaleString()}</p>
              </div>
              <button 
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => {
                    const tx: Transaction = { id: Date.now().toString(), title: 'Автобус №22', amount: -44, date: new Date().toLocaleString(), category: 'Shopping' };
                    setCurrentUser({ ...currentUser, balance: currentUser.balance - 44, transactions: [tx, ...currentUser.transactions] });
                    setIsLoading(false);
                    setActiveScreen('home');
                  }, 2000);
                }}
                className="w-full max-w-xs bg-[#121131] text-white py-5 rounded-2xl font-bold text-xl active:scale-95 transition-all shadow-xl"
              >
                Оплатить
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-xl flex items-end justify-center animate-enter p-4">
          <div className="w-full max-w-md glass-card rounded-[3rem] p-8 pb-12 mb-4 shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">{selectedTx.date}</p>
              <button onClick={() => setSelectedTx(null)} className="w-10 h-10 glass-card rounded-full flex items-center justify-center"><X size={18}/></button>
            </div>
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 glass-card rounded-3xl flex items-center justify-center text-blue-500"><Bus size={40}/></div>
              <div>
                <h2 className="text-2xl font-black">{selectedTx.title}</h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Успешно</p>
              </div>
              <h1 className="text-5xl font-black">{selectedTx.amount} ₽</h1>
              <button onClick={() => setShowReceipt(true)} className="w-full py-4 glass-card rounded-2xl font-bold text-xs uppercase tracking-widest mt-6">Справка по операции</button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-[200] bg-white animate-enter overflow-y-auto p-8 text-black">
          <div className="flex justify-end mb-6">
            <button onClick={() => setShowReceipt(false)} className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center"><X size={20}/></button>
          </div>
          <p className="text-zinc-400 text-sm mb-4">{new Date().toLocaleString()}</p>
          <div className="flex justify-between items-baseline mb-6">
            <h1 className="text-4xl font-bold">Итого</h1>
            <span className="text-4xl font-bold">{Math.abs(selectedTx?.amount || 0)} ₽</span>
          </div>
          <div className="w-full h-0.5 bg-yellow-400 mb-8" />
          <div className="space-y-4 text-sm font-medium">
            <div className="flex justify-between"> <span className="text-zinc-400">Статус</span> <span>Успешно</span> </div>
            <div className="flex justify-between"> <span className="text-zinc-400">Тип</span> <span>По QR-коду</span> </div>
            <div className="flex justify-between"> <span className="text-zinc-400">СБП</span> <span>30701</span> </div>
          </div>
          <div className="mt-20 flex justify-center">
            <div className="border-2 border-blue-500 p-6 text-blue-500 font-bold text-[10px] uppercase text-center rounded relative">
              АО "NAEB BANK"<br/>БИК 044525974<br/>ИСПОЛНЕНО
              <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <svg viewBox="0 0 100 50" className="w-full h-full">
                  <path d="M10,25 Q30,5 50,25 T90,25" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed bottom-8 w-full max-w-xs z-50">
        <div className="ios-blur rounded-full p-2 border border-white/10 flex justify-between shadow-2xl">
          <button onClick={() => setActiveScreen('home')} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${activeScreen === 'home' ? 'bg-white text-black' : 'text-zinc-500'}`}><Home size={22}/></button>
          <button onClick={() => setActiveScreen('cards')} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${activeScreen === 'cards' ? 'bg-white text-black' : 'text-zinc-500'}`}><CreditCard size={22}/></button>
          <button onClick={() => setActiveScreen('qr')} className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-600/40"><Plus size={22}/></button>
          <button onClick={() => setActiveScreen('assistant')} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${activeScreen === 'assistant' ? 'bg-white text-black' : 'text-zinc-500'}`}><Sparkles size={22}/></button>
          <button onClick={() => setActiveScreen('profile')} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${activeScreen === 'profile' ? 'bg-white text-black' : 'text-zinc-500'}`}><User size={22}/></button>
        </div>
      </nav>
      <div className="fixed bottom-2 w-32 h-1 bg-white/10 rounded-full" />
    </div>
  );
};

export default App;
