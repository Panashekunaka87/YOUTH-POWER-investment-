import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../AuthContext';
import { Wallet, TrendingUp, Award, Newspaper, Info, Gift, Star, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, increment } from 'firebase/firestore';
import { Investment } from '../types';
import { handleFirestoreError, OperationType } from '../firestoreUtils';

export const Home: React.FC = () => {
  const { profile } = useAuth();

  const investmentPlans = [
    { title: 'Youth Starter', return: '0.10%', min: '$1', icon: TrendingUp, color: 'bg-blue-500' },
    { title: 'Power Growth', return: '0.20%', min: '$100', icon: Star, color: 'bg-emerald-500' },
  ];

  const quickActions = [
    { label: 'Deposit', icon: Wallet, to: '/account', color: 'bg-orange-100 text-orange-600' },
    { label: 'Withdraw', icon: Award, to: '/account', color: 'bg-blue-100 text-blue-600' },
    { label: 'Lucky Wheel', icon: Gift, onClick: () => setShowLuckyWheel(true), color: 'bg-purple-100 text-purple-600' },
    { label: 'Rewards', icon: Star, to: '/team', color: 'bg-yellow-100 text-yellow-600' },
  ];

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [showLuckyWheel, setShowLuckyWheel] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'investments'), where('uid', '==', profile.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setInvestments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Investment)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'investments');
    });
    return unsubscribe;
  }, [profile]);

  const handleInvest = async (plan: typeof investmentPlans[0]) => {
    if (!profile) return;
    const amount = parseFloat(plan.min.replace('$', ''));
    if (profile.balance < amount) return alert('Insufficient balance');

    await updateDoc(doc(db, 'users', profile.uid), {
      balance: increment(-amount)
    });

    await addDoc(collection(db, 'investments'), {
      uid: profile.uid,
      amount,
      dailyReturn: parseFloat(plan.return.replace('%', '')) / 100,
      startDate: new Date().toISOString(),
      lastClaimDate: new Date().toISOString(),
    });

    alert(`Successfully invested in ${plan.title}!`);
  };

  const handleClaim = async (investment: Investment) => {
    if (!profile) return;
    const lastClaim = new Date(investment.lastClaimDate);
    const now = new Date();
    const diffHours = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      const remaining = (24 - diffHours).toFixed(1);
      return alert(`You can claim again in ${remaining} hours`);
    }

    const earnings = investment.amount * investment.dailyReturn;
    
    await updateDoc(doc(db, 'users', profile.uid), {
      balance: increment(earnings)
    });

    await updateDoc(doc(db, 'investments', investment.id), {
      lastClaimDate: now.toISOString()
    });

    alert(`Claimed $${earnings.toFixed(2)} daily return!`);
  };

  const handleSpin = async () => {
    if (!profile) return;
    if (spinning) return;
    
    setSpinning(true);
    setWheelResult(null);

    // Simulate spin
    setTimeout(async () => {
      const prizes = [0, 0.05, 0.10, 0.20, 0.50, 1.00];
      const win = prizes[Math.floor(Math.random() * prizes.length)];
      
      if (win > 0) {
        await updateDoc(doc(db, 'users', profile.uid), {
          balance: increment(win)
        });
        setWheelResult(`Congratulations! You won $${win.toFixed(2)}`);
      } else {
        setWheelResult('Better luck next time!');
      }
      setSpinning(false);
    }, 2000);
  };

  const newsItems = [
    {
      id: 1,
      title: "Youths Power Expands to New Markets in Southern Africa",
      category: "Latest Update",
      time: "2 hours ago",
      views: "1.2k",
      image: "https://picsum.photos/seed/investment/200/200"
    },
    {
      id: 2,
      title: "New Investment Plan: Power Growth Tier 3 Now Available",
      category: "Announcement",
      time: "5 hours ago",
      views: "850",
      image: "https://picsum.photos/seed/growth/200/200"
    },
    {
      id: 3,
      title: "How to Maximize Your Daily Returns: 5 Pro Tips",
      category: "Tutorial",
      time: "1 day ago",
      views: "3.4k",
      image: "https://picsum.photos/seed/tips/200/200"
    },
    {
      id: 4,
      title: "Community Spotlight: Top Referrers of the Month",
      category: "Community",
      time: "2 days ago",
      views: "2.1k",
      image: "https://picsum.photos/seed/community/200/200"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl bg-emerald-600 p-6 text-white shadow-xl shadow-emerald-900/10"
      >
        <div className="relative z-10">
          <p className="text-sm font-medium text-emerald-100/80">Total Balance</p>
          <h2 className="mt-1 text-4xl font-black tracking-tight">${profile?.balance.toFixed(2) || '0.00'}</h2>
          <div className="mt-6 flex gap-4">
            <Link to="/account" className="flex-1 rounded-xl bg-white/20 py-2 text-center text-sm font-bold backdrop-blur-md transition-colors hover:bg-white/30">
              Deposit
            </Link>
            <Link to="/account" className="flex-1 rounded-xl bg-white py-2 text-center text-sm font-bold text-emerald-600 transition-colors hover:bg-emerald-50">
              Withdraw
            </Link>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" />
      </motion.div>

      {/* Active Investments */}
      {investments.length > 0 && (
        <section>
          <h3 className="mb-4 text-lg font-bold tracking-tight text-neutral-800">My Investments</h3>
          <div className="space-y-3">
            {investments.map((inv) => (
              <div key={inv.id} className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Active Plan</p>
                    <p className="text-sm font-bold text-neutral-800">${inv.amount} @ {(inv.dailyReturn * 100).toFixed(2)}%/day</p>
                  </div>
                  <button 
                    onClick={() => handleClaim(inv)}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md active:scale-95"
                  >
                    Claim Daily
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-4 gap-4">
        {quickActions.map((action) => (
          action.to ? (
            <Link key={action.label} to={action.to} className="flex flex-col items-center gap-2">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${action.color} shadow-sm`}>
                <action.icon size={20} />
              </div>
              <span className="text-[10px] font-bold uppercase text-neutral-500">{action.label}</span>
            </Link>
          ) : (
            <button key={action.label} onClick={action.onClick} className="flex flex-col items-center gap-2">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${action.color} shadow-sm`}>
                <action.icon size={20} />
              </div>
              <span className="text-[10px] font-bold uppercase text-neutral-500">{action.label}</span>
            </button>
          )
        ))}
      </div>

      {/* Investment Plans */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold tracking-tight text-neutral-800">Investment Plans</h3>
          <span className="text-xs font-bold text-emerald-600">View All</span>
        </div>
        <div className="space-y-4">
          {investmentPlans.map((plan) => (
            <motion.div
              key={plan.title}
              whileHover={{ x: 5 }}
              className="flex items-center justify-between rounded-2xl border bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${plan.color} text-white`}>
                  <plan.icon size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-800">{plan.title}</h4>
                  <p className="text-xs text-neutral-500">Daily Return: <span className="font-bold text-emerald-600">{plan.return}</span></p>
                </div>
              </div>
              <button 
                onClick={() => handleInvest(plan)}
                className="rounded-lg bg-neutral-100 px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-emerald-600 hover:text-white transition-colors"
              >
                Invest
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* News & Updates */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Newspaper size={20} className="text-emerald-600" />
          <h3 className="text-lg font-bold tracking-tight text-neutral-800">Conference News</h3>
        </div>
        <div className="space-y-4">
          {newsItems.map((item) => (
            <div key={item.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex gap-4">
                <img 
                  src={item.image} 
                  alt="News" 
                  className="h-20 w-20 rounded-xl object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1">
                  <p className="text-xs font-bold text-emerald-600 uppercase">{item.category}</p>
                  <h4 className="mt-1 text-sm font-bold text-neutral-800 line-clamp-2">{item.title}</h4>
                  <p className="mt-1 text-[10px] text-neutral-400">{item.time} • {item.views} views</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Company Info & License */}
      <section className="space-y-4">
        <div className="rounded-2xl bg-neutral-900 p-6 text-white">
          <div className="mb-4 flex items-center gap-2">
            <Info size={20} className="text-emerald-400" />
            <h3 className="text-lg font-bold">Company Introduction</h3>
          </div>
          <p className="text-sm leading-relaxed text-neutral-400">
            YOUTHS POWER 🫂 is a premier investment platform dedicated to financial literacy and wealth creation for the youth. We provide secure, high-yield opportunities through strategic asset management.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase text-neutral-500">Operational License</p>
              <img 
                src="https://picsum.photos/seed/license/300/400" 
                alt="License" 
                className="rounded-lg border border-neutral-800"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase text-neutral-500">Investment Certificate</p>
              <img 
                src="https://picsum.photos/seed/certificate/300/400" 
                alt="Certificate" 
                className="rounded-lg border border-neutral-800"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer Links */}
      <div className="grid grid-cols-2 gap-4 pb-4">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-xs font-bold text-neutral-800">Employee Benefits</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-xs font-bold text-neutral-800">Savings Center</p>
        </div>
      </div>
      {/* Lucky Wheel Modal */}
      <AnimatePresence>
        {showLuckyWheel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm rounded-[2.5rem] bg-white p-8 text-center shadow-2xl"
            >
              <div className="mb-6 flex justify-center">
                <div className={`relative h-48 w-48 rounded-full border-8 border-purple-100 bg-purple-50 flex items-center justify-center ${spinning ? 'animate-spin' : ''}`}>
                  <Gift size={64} className="text-purple-600" />
                  <div className="absolute -top-2 left-1/2 h-6 w-2 -translate-x-1/2 bg-red-500 rounded-full" />
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-neutral-800">Lucky Wheel</h3>
              <p className="mt-2 text-sm text-neutral-500">Spin the wheel and win random cash prizes!</p>

              {wheelResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 rounded-2xl bg-purple-50 p-4 font-bold text-purple-600"
                >
                  {wheelResult}
                </motion.div>
              )}

              <div className="mt-8 flex gap-3">
                <button
                  disabled={spinning}
                  onClick={() => {
                    setShowLuckyWheel(false);
                    setWheelResult(null);
                  }}
                  className="flex-1 rounded-2xl bg-neutral-100 py-4 text-sm font-bold text-neutral-600"
                >
                  Close
                </button>
                <button
                  disabled={spinning}
                  onClick={handleSpin}
                  className="flex-1 rounded-2xl bg-purple-600 py-4 text-sm font-bold text-white shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  {spinning ? 'Spinning...' : 'Spin Now'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
