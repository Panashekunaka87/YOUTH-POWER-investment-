import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { Play, CheckCircle, Clock, ExternalLink } from 'lucide-react';

export const Tasks: React.FC = () => {
  const { profile } = useAuth();
  const [watching, setWatching] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const tasks = [
    { id: 'ad1', title: 'Watch Youth Power Intro', reward: 0.05, duration: 15, url: 'https://example.com/ad1' },
    { id: 'ad2', title: 'Investment Basics Ad', reward: 0.10, duration: 30, url: 'https://example.com/ad2' },
    { id: 'ad3', title: 'Success Stories', reward: 0.08, duration: 20, url: 'https://example.com/ad3' },
    { id: 'ad4', title: 'New Market Expansion', reward: 0.12, duration: 45, url: 'https://example.com/ad4' },
    { id: 'ad5', title: 'Referral Program Guide', reward: 0.07, duration: 15, url: 'https://example.com/ad5' },
    { id: 'ad6', title: 'Daily Bonus Ad', reward: 0.15, duration: 60, url: 'https://example.com/ad6' },
    { id: 'ad7', title: 'Youth Power Community', reward: 0.06, duration: 10, url: 'https://example.com/ad7' },
    { id: 'ad8', title: 'Financial Freedom Tips', reward: 0.09, duration: 25, url: 'https://example.com/ad8' },
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (watching && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (watching && timeLeft === 0) {
      handleComplete();
    }
    return () => clearInterval(timer);
  }, [watching, timeLeft]);

  const handleStart = (task: typeof tasks[0]) => {
    setWatching(task.id);
    setTimeLeft(task.duration);
    window.open(task.url, '_blank');
  };

  const handleComplete = async () => {
    if (!profile || !watching) return;
    const task = tasks.find(t => t.id === watching);
    if (!task) return;

    await updateDoc(doc(db, 'users', profile.uid), {
      balance: increment(task.reward)
    });

    setWatching(null);
    alert(`Task complete! You earned $${task.reward.toFixed(2)}`);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-emerald-900 p-8 text-white">
        <h2 className="text-2xl font-black">Daily Tasks</h2>
        <p className="mt-2 text-sm text-emerald-100/60">Watch ads to earn extra rewards for your balance.</p>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Play size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-800">{task.title}</h3>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase">
                      <CheckCircle size={10} /> ${task.reward.toFixed(2)}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 uppercase">
                      <Clock size={10} /> {task.duration}s
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                disabled={watching !== null}
                onClick={() => handleStart(task)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  watching === task.id 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-neutral-100 text-neutral-600 hover:bg-emerald-600 hover:text-white'
                }`}
              >
                {watching === task.id ? `${timeLeft}s` : 'Start'}
              </button>
            </div>

            {watching === task.id && (
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(timeLeft / task.duration) * 100}%` }}
                className="absolute bottom-0 left-0 h-1 bg-emerald-600"
              />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-orange-50 p-6 text-orange-800">
        <div className="flex items-center gap-2 font-bold">
          <ExternalLink size={18} />
          <span>Instructions</span>
        </div>
        <ul className="mt-3 list-inside list-disc space-y-2 text-xs leading-relaxed opacity-80">
          <li>Click 'Start' to open the advertisement in a new tab.</li>
          <li>Keep the tab open for the full duration of the timer.</li>
          <li>Rewards are automatically added to your balance upon completion.</li>
          <li>Each task can be completed once per day.</li>
        </ul>
      </div>
    </div>
  );
};
