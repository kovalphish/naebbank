
import React, { useState, useEffect, useRef } from 'react';
import { Shield, CreditCard, Send, Sparkles, User, Home, Bell, Search, Plus, ArrowUpRight, ArrowDownLeft, ChevronRight, Fingerprint, Lock, Phone, UserCircle, Gift, ArrowLeft, Landmark, QrCode, X, Scan, Camera, MapPin, Bus, HelpCircle, Loader2 } from 'lucide-react';
import { Screen, Transaction } from './types';
import { getFinancialAdvice } from './services/gemini';

const RUSSIAN_BANKS = [
  { id: 'naeb', name: 'NAEB Bank', color: 'bg-white text-black' },
  { id: 'sber', name: 'СберБанк', color: 'bg-green-600 text-white' },
  { id: 'tink', name: 'Т-Банк', color: 'bg-yellow-400 text-black' },
  { id: 'alfa', name: 'Альфа-Банк', color: 'bg-red-600 text-white' },
];

const LiquidBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    <div className="liquid-blob w-[500px] h-[500px] bg-blue-600/20 top-[-100px] left-[-100px]" />
    <div className="liquid-blob w-[400px] h-[400px] bg-purple-600/20 bottom-[-100px] right-[-100px] [animation-delay:-5s]" />
    <div className="liquid-blob w-[300px] h-[300px] bg-indigo-600/10 top-[40%] left-[20%] [animation-delay:-10s]" />
  </div>
);

const LoadingOverlay: React.FC<{ message: string }> = ({ message }) => (
  <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
    <div className="relative">
      <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Shield size={32} className="text-blue-500 animate-pulse" />
      </div>
    </div>
    <p className="mt-8 text-white font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">{message}</p>
  </div>
);

const SBPLogo = () => (
  <div className="flex items-center gap-3 scale-110">
    <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 15L85 35V65L50 85L15 65V35L50 15Z" stroke="#121131" strokeWidth="1" opacity="0.1" />
      {/* Top Triangle - Yellow/Orange */}
      <path d="M50 50L80 32L50 15V50Z" fill="#FBBF24" />
      <path d="M50 50L80 32L65 50H50Z" fill="#F59E0B" />
      {/* Right Triangle - Red/Orange */}
      <path d="M50 50L80 32V68L50 50Z" fill="#EF4444" opacity="0.8" />
      <path d="M50 50L80 68L65 50H50Z" fill="#DC2626" />
      {/* Bottom Triangle - Green */}
      <path d="M50 50L80 68L50 85V50Z" fill="#10B981" />
      <path d="M50 50L35 50L50 85V50Z" fill="#059669" />
      {/* Left Triangle - Blue/Purple */}
      <path d="M50 50L20 68L20 32L50 50Z" fill="#6366F1" />
      <path d="M50 50L20 32L35 50H50Z" fill="#4F46E5" />
      <path d="M50 50L20 68L35 50H50Z" fill="#4338CA" />
    </svg>
    <div className="flex flex-col -space-y-1">
      <span className="text-[#121131] text-3xl font-black italic tracking-tighter">сбп</span>
    </div>
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

  const [islandMode, setIslandMode] = useState<'normal' | 'expanded'>('normal');
  const [assistantResponse, setAssistantResponse] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [globalLoading, setGlobalLoading] = useState<{ active: boolean; message: string }>({ active: false, message: '' });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (activeScreen === 'qr') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeScreen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const getUsers = () => JSON.parse(localStorage.getItem('naeb_users') || '[]');
  
  const updateUserData = (updatedUser: any) => {
    const users = getUsers();
    const index = users.findIndex((u: any) => u.phone === updatedUser.phone);
    if (index !== -1) {
      users[index] = updatedUser;
    } else {
      users.push(updatedUser);
    }
    localStorage.setItem('naeb_users', JSON.stringify(users));
    setCurrentUser({ ...updatedUser });
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    setTimeout(() => {
      const users = getUsers();
      if (authMode === 'login') {
        const user = users.find((u: any) => u.phone === phone && u.password === password);
        if (user) {
          setIsAuthenticated(true);
          setCurrentUser(user);
        } else {
          setError('Неверный номер или пароль');
          setIsLoggingIn(false);
        }
      } else {
        if (!fio || !phone || !password) {
          setError('Заполните все поля');
          setIsLoggingIn(false);
          return;
        }
        if (users.find((u: any) => u.phone === phone)) {
          setError('Номер уже зарегистрирован');
          setIsLoggingIn(false);
          return;
        }
        const newUser = { fio, phone, password, balance: 1000, transactions: [] };
        const updatedUsers = [...users, newUser];
        localStorage.setItem('naeb_users', JSON.stringify(updatedUsers));
        setCurrentUser(newUser);
        setIsAuthenticated(true);
      }
    }, 1500);
  };

  const handlePromo = () => {
    if (promoInput.trim().toUpperCase() === 'ПРОМО1') {
      setGlobalLoading({ active: true, message: 'СИНХРОНИЗАЦИЯ СЕТИ...' });
      
      setTimeout(() => {
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          title: 'Активация ПРОМО1',
          amount: 50,
          date: new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          category: 'Service'
        };
        
        const updatedUser = {
          ...currentUser,
          balance: (currentUser.balance || 0) + 50,
          transactions: [newTransaction, ...(currentUser.transactions || [])]
        };
        
        updateUserData(updatedUser);
        setPromoInput('');
        setGlobalLoading({ active: false, message: '' });
        alert('Зачислено 50 ₽!');
      }, 2000);
    } else {
      alert('Неверный промокод');
    }
  };

  const handlePayBus = () => {
    const cost = 44;
    if ((currentUser?.balance || 0) < cost) {
      alert('Недостаточно средств');
      return;
    }

    setGlobalLoading({ active: true, message: 'ОБРАБОТКА ТРАНЗАКЦИИ...' });

    setTimeout(() => {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        title: 'МУП "Служба организаций движения"',
        amount: -cost,
        date: new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        category: 'Shopping'
      };

      const updatedUser = {
        ...currentUser,
        balance: currentUser.balance - cost,
        transactions: [newTransaction, ...(currentUser.transactions || [])]
      };

      updateUserData(updatedUser);
      setGlobalLoading({ active: false, message: '' });
      setActiveScreen('home');
    }, 2500);
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#050505] p-8 relative overflow-hidden">
        <LiquidBackground />
        <div className="z-10 text-center space-y-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-700">
          <div className="flex flex-col items-center gap-4">
             <div className="w-24 h-24 glass-card rounded-[2.5rem] flex items-center justify-center shadow-2xl relative pulse-effect glass-shine">
                <Shield size={44} className="text-white fill-white/10" />
             </div>
             <h1 className="text-6xl font-black tracking-tighter text-white drop-shadow-2xl">NAEB</h1>
             <p className="text-blue-400 font-bold tracking-[0.3em] text-[10px] uppercase opacity-80">Liquid Quantum Bank</p>
          </div>
          <div className="glass-card p-8 rounded-[3rem] space-y-6 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] glass-shine">
            <h2 className="text-2xl font-bold tracking-tight">{authMode === 'login' ? 'Авторизация' : 'Создание аккаунта'}</h2>
            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && (
                <div className="relative group">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                  <input type="text" placeholder="ФИО" value={fio} onChange={(e) => setFio(e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500/40 transition-all text-white text-sm" />
                </div>
              )}
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                <input type="tel" placeholder="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500/40 transition-all text-white text-sm" />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500/40 transition-all text-white text-sm" />
              </div>
              {error && <p className="text-red-400 text-xs font-bold animate-pulse">{error}</p>}
              <button type="submit" disabled={isLoggingIn} className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg ${isLoggingIn ? 'bg-zinc-800' : 'bg-white text-black font-black text-lg hover:shadow-white/10'}`}>
                {isLoggingIn ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : (authMode === 'login' ? "Войти" : "Поехали")}
              </button>
            </form>
            <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); }} className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors">
              {authMode === 'login' ? "Нет доступа? Регистрация" : "Уже с нами? Вход"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#050505] flex flex-col items-center relative select-none">
      {activeScreen !== 'payment' && <LiquidBackground />}
      
      {globalLoading.active && <LoadingOverlay message={globalLoading.message} />}

      {activeScreen !== 'payment' && (
        <div className="fixed top-4 z-50 pointer-events-none">
          <div className={`dynamic-island mx-auto pointer-events-auto ios-blur border border-white/10 rounded-[2.5rem] shadow-2xl flex items-center justify-center overflow-hidden ${islandMode === 'normal' ? 'w-36 h-10' : 'w-[92vw] h-52'}`}>
            {islandMode === 'normal' ? (
               <div className="w-full h-full flex items-center justify-center gap-3 px-4">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                  <span className="text-[10px] font-black tracking-[0.3em] text-white/80">NAEB LIVE</span>
               </div>
            ) : (
               <div className="p-8 w-full h-full flex flex-col justify-between glass-shine">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">Liquid Security</p>
                      <h3 className="text-2xl font-black text-white">Защита Активна</h3>
                    </div>
                    <div className="w-12 h-12 glass-card rounded-2xl flex items-center justify-center border-white/20">
                      <Shield className="text-blue-400" />
                    </div>
                  </div>
                  <button onClick={() => setIslandMode('normal')} className="text-[10px] font-black text-white/40 text-center w-full uppercase tracking-widest">Смахивание для скрытия</button>
               </div>
            )}
          </div>
        </div>
      )}

      <main className={`flex-1 w-full max-w-lg overflow-y-auto no-scrollbar z-10 relative ${activeScreen === 'payment' ? 'bg-[#f4f4f4] pt-0' : 'px-6 pt-24 pb-32'}`}>
        {activeScreen === 'home' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-4xl font-black tracking-tighter drop-shadow-lg text-white">Хай, {currentUser?.fio?.split(' ')[0]}</h2>
                <p className="text-zinc-500 font-bold text-sm">Ваши ликвидные активы</p>
              </div>
              <button onClick={() => setIslandMode('expanded')} className="w-14 h-14 rounded-2xl glass-card flex items-center justify-center border-white/20 active:scale-90 transition-transform glass-shine">
                <Bell size={24} className="text-zinc-200" />
              </button>
            </div>
            <div className="glass-card rounded-[3.5rem] p-10 relative overflow-hidden glass-shine border-white/15">
              <div className="absolute top-0 right-0 p-6 opacity-40">
                <Sparkles size={40} className="text-blue-400 animate-pulse" />
              </div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-2">Общий Баланс</p>
              <h1 className="text-6xl font-black tracking-tighter mb-8 tabular-nums text-white">{(currentUser?.balance || 0).toLocaleString('ru-RU')} <span className="text-3xl font-bold opacity-50 text-white">₽</span></h1>
              <div className="flex gap-4 items-center">
                <button onClick={() => setActiveScreen('transfer')} className="flex-1 bg-white text-black py-4 rounded-[1.5rem] font-black text-sm active:scale-95 transition-all shadow-xl">Перевод</button>
                <div className="flex-1 glass-card p-1 rounded-[1.5rem] border-white/10 flex gap-2">
                   <input 
                     type="text" 
                     placeholder="ПРОМО" 
                     value={promoInput} 
                     onChange={(e) => setPromoInput(e.target.value)}
                     className="w-full bg-transparent border-none outline-none pl-4 text-xs font-black uppercase tracking-widest placeholder:text-zinc-600"
                   />
                   <button onClick={handlePromo} className="bg-white text-black w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-all">
                      <Gift size={18} />
                   </button>
                </div>
                <button onClick={() => setActiveScreen('qr')} className="w-14 h-14 glass-card rounded-full flex items-center justify-center border-white/20 active:scale-90 transition-all shadow-lg glass-shine">
                  <QrCode size={24} className="text-blue-400" />
                </button>
              </div>
            </div>
            <div className="space-y-5">
              <div className="flex justify-between items-center px-4">
                <h3 className="text-xl font-black tracking-tight uppercase text-xs opacity-60 text-white">Транзакции</h3>
                <ChevronRight className="text-zinc-700" size={20} />
              </div>
              {(!currentUser?.transactions || currentUser.transactions.length === 0) ? (
                <div className="text-center py-16 glass-card rounded-[2.5rem] border-dashed border-white/5">
                  <p className="text-sm font-bold text-zinc-600 uppercase tracking-widest">Ликвидность нулевая</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentUser.transactions.map((tx: any) => (
                    <div key={tx.id} onClick={() => setSelectedTx(tx)} className="glass-card rounded-[2rem] p-5 flex items-center justify-between border-white/5 hover:bg-white/10 transition-all cursor-pointer group active:scale-[0.98]">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl glass-card flex items-center justify-center border-white/10 group-hover:scale-110 transition-transform shadow-inner`}>
                           {tx.amount > 0 ? <ArrowDownLeft className="text-green-400" size={24} /> : <Bus className="text-blue-400" size={24} />}
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-white line-clamp-1 max-w-[150px]">{tx.title}</h4>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{tx.date.split(',')[0]}</p>
                        </div>
                      </div>
                      <p className={`text-lg font-black tabular-nums ${tx.amount > 0 ? 'text-green-400' : 'text-white'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeScreen === 'qr' && (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col text-white animate-in zoom-in-95 duration-300">
             <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-70" />
             <div className="absolute top-10 right-8 z-[110]">
                <button onClick={() => setActiveScreen('home')} className="w-12 h-12 rounded-full glass-card flex items-center justify-center border-white/20 active:scale-90 transition-transform">
                   <X size={28} />
                </button>
             </div>
             <div className="flex-1 flex items-center justify-center relative pointer-events-none">
                <div className="w-64 h-64 border-2 border-white/20 rounded-3xl relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/60 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/60 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/60 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/60 rounded-br-xl" />
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/40 animate-[scan_3s_infinite_linear] blur-[1px]" />
                </div>
             </div>
             <div className="absolute bottom-20 left-0 right-0 flex justify-center">
                <button 
                  onClick={() => setActiveScreen('payment')}
                  className="w-20 h-20 rounded-full border-4 border-white/40 p-1 active:scale-90 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)] bg-black/10 backdrop-blur-sm"
                >
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-inner">
                     <Scan size={32} className="text-black" />
                  </div>
                </button>
             </div>
          </div>
        )}

        {activeScreen === 'payment' && (
          <div className="h-full w-full bg-[#f4f4f4] flex flex-col animate-in fade-in duration-500">
             <header className="bg-[#121131] py-4 text-center">
                <h2 className="text-white text-sm font-semibold tracking-tight">Оплата проезда</h2>
             </header>

             <div className="flex-1 flex flex-col items-center justify-center px-8 space-y-12 pb-10">
                <div className="flex flex-col items-center space-y-4">
                  <SBPLogo />
                  <h3 className="text-[#121131] text-lg font-bold">Автобус №22</h3>
                </div>

                <div className="text-center space-y-4">
                   <h1 className="text-[#121131] text-6xl font-medium tracking-tighter tabular-nums">44 ₽</h1>
                   <div className="flex flex-col space-y-1">
                      <span className="text-zinc-400 text-xs font-medium">28.01.2026 07:47</span>
                      <span className="text-zinc-300 text-[10px] font-bold">Т/С: 167</span>
                   </div>
                </div>

                <button 
                  onClick={handlePayBus}
                  className="w-full bg-[#121131] text-white py-5 rounded-xl font-semibold text-lg active:scale-95 transition-all shadow-xl max-w-xs"
                >
                  Оплатить
                </button>
             </div>
          </div>
        )}
      </main>

      {/* Detail Tx Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg glass-card rounded-t-[3.5rem] p-8 pb-12 text-white animate-in slide-in-from-bottom-full duration-500 border-white/20 shadow-2xl">
            <div className="flex justify-between items-start mb-10">
               <div className="text-sm font-black uppercase tracking-[0.3em] text-zinc-400">{selectedTx.date}</div>
               <button onClick={() => setSelectedTx(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-transform">
                  <X size={20} />
               </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-6">
               <div className="w-20 h-20 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                  {selectedTx.amount > 0 ? <ArrowDownLeft className="text-green-400" size={32} /> : <Bus size={32} className="text-blue-400" />}
               </div>
               
               <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-tight leading-tight px-4">{selectedTx.title}</h2>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{selectedTx.category === 'Shopping' ? 'местный транспорт' : (selectedTx.category === 'Service' ? 'банковская услуга' : 'перевод')}</p>
               </div>

               <h1 className="text-5xl font-black tracking-tighter tabular-nums py-4">{selectedTx.amount.toLocaleString('ru-RU')} ₽</h1>

               <div className="w-full pt-8 border-t border-white/10 space-y-4">
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Счет списания</p>
                  <div className="flex items-center justify-center gap-4 relative">
                     <div className="w-8 h-5 bg-gradient-to-br from-blue-600 to-indigo-900 rounded-sm border border-white/10 shadow-sm" />
                     <span className="text-sm font-black tracking-tight">NAEB MIR CRYSTAL</span>
                     <button 
                        onClick={() => setShowReceipt(true)}
                        className="text-blue-400 text-[10px] font-black uppercase tracking-widest border-b border-blue-400/30 ml-2 hover:text-blue-300 transition-colors"
                     >
                        справка
                     </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-[300] bg-white animate-in fade-in duration-300 flex flex-col font-sans select-text">
            <header className="px-8 pt-10 pb-4 flex justify-end">
                <button onClick={() => setShowReceipt(false)} className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center active:scale-90 transition-transform">
                    <X size={28} className="text-zinc-900" />
                </button>
            </header>

            <main className="flex-1 overflow-y-auto px-8 py-2 text-zinc-900">
                <div className="mb-8">
                    <div className="text-zinc-400 text-sm font-medium mb-4">{selectedTx?.date || '28.01.2026 07:47:05'}</div>
                    <div className="flex justify-between items-baseline">
                        <h1 className="text-[40px] font-bold tracking-tight">Итого</h1>
                        <span className="text-[40px] font-bold tracking-tight">{Math.abs(selectedTx?.amount || 44)} ₽</span>
                    </div>
                    <div className="w-full h-[2px] bg-[#fcd34d] mt-4"></div>
                </div>

                <div className="space-y-4 mb-10">
                    <SimpleReceiptRow label="Покупка" value="По QR-коду" />
                    <SimpleReceiptRow label="Статус" value="Успешно" />
                    <SimpleReceiptRow label="Сумма" value={`${Math.abs(selectedTx?.amount || 44)} ₽`} />
                    <SimpleReceiptRow label="Магазин" value="Оплата проезда на bilet.nspk.ru" />
                    <div className="pt-2" />
                    <SimpleReceiptRow label="Счет списания" value="408178106000****2504" />
                    <SimpleReceiptRow label="Наименование ЮЛ или ИП" value="ООО «БЕНТОК-СМОЛЕНСК»" />
                    <SimpleReceiptRow label="Идентификатор операции" value="A53221215425581F00000100116" isLong />
                    <SimpleReceiptRow label="СБП" value="30701" />
                </div>

                <div className="relative mt-12 mb-16 flex justify-center">
                    <div className="border-[2px] border-[#3b82f6] px-10 py-6 text-[#3b82f6] font-bold text-center relative max-w-sm rounded-sm">
                        <div className="text-xs font-black mb-1">АО «ТБАНК»</div>
                        <div className="text-[10px] leading-tight font-black">
                            БИК 044525974 ИНН 7710140679<br/>
                            К/С 30101810145250000974
                        </div>
                        <div className="text-[10px] font-black mt-1">ШАДРИНА Е. С.</div>
                        <svg className="absolute top-1/2 left-[-20px] w-[140%] h-[120%] -translate-y-1/2 pointer-events-none opacity-80" viewBox="0 0 200 100">
                             <path d="M40,60 C60,40 100,80 140,50 C160,30 180,60 190,45" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
                             <path d="M50,70 C70,50 110,90 150,60 C170,40 190,70 200,55" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                        </svg>
                    </div>
                </div>

                <div className="w-full h-[2px] bg-[#fcd34d] mb-4"></div>

                <div className="text-zinc-400 text-xs font-medium space-y-1 pb-10">
                    <p>Квитанция № 1-111-184-502-464</p>
                    <p>По вопросам зачисления обращайтесь к получателю</p>
                    <p>Служба поддержки <span className="text-blue-500">fb@tbank.ru</span></p>
                </div>
            </main>
        </div>
      )}

      {activeScreen !== 'qr' && activeScreen !== 'payment' && (
        <nav className="fixed bottom-10 w-full max-w-xs mx-auto z-40">
          <div className="ios-blur border border-white/15 rounded-full p-2 flex items-center justify-between shadow-2xl glass-shine">
            <NavButton active={activeScreen === 'home'} onClick={() => setActiveScreen('home')} icon={<Home size={22} />} />
            <NavButton active={activeScreen === 'cards'} onClick={() => setActiveScreen('cards')} icon={<CreditCard size={22} />} />
            <NavButton active={(activeScreen as any) === 'qr'} onClick={() => setActiveScreen('qr')} icon={<Plus size={22} />} />
            <NavButton active={activeScreen === 'assistant'} onClick={() => setActiveScreen('assistant')} icon={<Sparkles size={22} />} />
            <NavButton active={activeScreen === 'profile'} onClick={() => setActiveScreen('profile')} icon={<User size={22} />} />
          </div>
        </nav>
      )}
      
      {activeScreen !== 'qr' && activeScreen !== 'payment' && (
        <div className="fixed bottom-3 w-36 h-1.5 bg-white/15 rounded-full left-1/2 -translate-x-1/2 blur-[0.5px]" />
      )}
    </div>
  );
};

const NavButton: React.FC<{active: boolean, onClick: () => void, icon: React.ReactNode}> = ({ active, onClick, icon }) => (
  <button onClick={onClick} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${active ? 'text-white bg-white/10 border border-white/10 shadow-inner' : 'text-zinc-600 hover:text-white'}`}>
    {React.cloneElement(icon as React.ReactElement<any>, { strokeWidth: active ? 2.5 : 2 })}
  </button>
);

const SimpleReceiptRow: React.FC<{label: string, value: string, isLong?: boolean}> = ({ label, value, isLong }) => (
    <div className="flex justify-between items-start gap-4">
        <span className="text-zinc-400 text-sm font-medium w-1/2">{label}</span>
        <span className={`text-zinc-900 text-sm font-semibold text-right flex-1 ${isLong ? 'break-all' : ''}`}>{value}</span>
    </div>
);

export default App;
