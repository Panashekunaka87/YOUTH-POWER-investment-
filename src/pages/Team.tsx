import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../AuthContext';
import { Users, Share2, Trophy, UserPlus, ChevronRight } from 'lucide-react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../firestoreUtils';

export const Team: React.FC = () => {
  const { profile } = useAuth();
  const [teamSize, setTeamSize] = useState(0);
  const [totalRewards, setTotalRewards] = useState(0);

  useEffect(() => {
    if (!profile) return;

    const q = query(collection(db, 'users'), where('referredBy', '==', profile.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setTeamSize(snap.size);
      // For rewards, we could calculate based on their investments, but for now let's just use a placeholder or a real field if we had it.
      // Since we give $1 per referral, rewards = teamSize * 1 (simplified)
      setTotalRewards(snap.size * 1);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return unsubscribe;
  }, [profile]);

  const teamStats = [
    { label: 'Team Size', value: teamSize.toString(), icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Rewards', value: `$${totalRewards.toFixed(2)}`, icon: Trophy, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Active Members', value: teamSize.toString(), icon: UserPlus, color: 'text-emerald-600 bg-emerald-50' },
  ];

  const levels = [
    { name: 'Level 1', commission: '10%', requirement: '0 Members' },
    { name: 'Level 2', commission: '5%', requirement: '10 Members' },
    { name: 'Level 3', commission: '2%', requirement: '50 Members' },
  ];

  const copyReferral = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      alert('Referral code copied!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-neutral-900 p-8 text-white">
        <h2 className="text-2xl font-black">My Team</h2>
        <p className="mt-2 text-sm text-neutral-400">Build your network and earn passive commission rewards.</p>
        
        <div className="mt-8 flex items-center justify-between rounded-2xl bg-white/10 p-4 backdrop-blur-md">
          <div>
            <p className="text-[10px] font-bold uppercase text-neutral-500">My Referral Code</p>
            <p className="mt-1 text-xl font-black tracking-widest">{profile?.referralCode || '------'}</p>
          </div>
          <button 
            onClick={copyReferral}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg transition-transform active:scale-95"
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {teamStats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-sm">
            <div className={`rounded-xl p-2 ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <p className="text-sm font-black text-neutral-800">{stat.value}</p>
            <p className="text-[8px] font-bold uppercase text-neutral-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <section>
        <h3 className="mb-4 text-lg font-bold tracking-tight text-neutral-800">Team Levels</h3>
        <div className="space-y-3">
          {levels.map((level) => (
            <div key={level.name} className="flex items-center justify-between rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 font-black text-neutral-600">
                  {level.name.split(' ')[1]}
                </div>
                <div>
                  <h4 className="font-bold text-neutral-800">{level.name}</h4>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">{level.commission} Commission</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-neutral-400 uppercase">Requirement</p>
                <p className="text-xs font-bold text-neutral-600">{level.requirement}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-bold text-neutral-800">Invitation Rewards</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-sm text-neutral-600">Direct referral bonus</p>
            </div>
            <p className="text-sm font-bold text-emerald-600">$1.00</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-sm text-neutral-600">Team investment commission</p>
            </div>
            <p className="text-sm font-bold text-emerald-600">Up to 10%</p>
          </div>
        </div>
      </div>
    </div>
  );
};
