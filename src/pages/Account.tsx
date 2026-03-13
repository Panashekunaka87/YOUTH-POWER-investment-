import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { Wallet, ArrowDownCircle, ArrowUpCircle, History, CreditCard, Smartphone } from 'lucide-react';
import { Deposit, Withdrawal } from '../types';
import { handleFirestoreError, OperationType } from '../firestoreUtils';

export const Account: React.FC = () => {
  const { profile } = useAuth();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState<'ecocash' | 'visa'>('ecocash');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawCode, setWithdrawCode] = useState('');
  const [newWithdrawCode, setNewWithdrawCode] = useState('');
  const [showSetCode, setShowSetCode] = useState(false);

  useEffect(() => {
    if (!profile) return;

    const qD = query(collection(db, 'deposits'), where('uid', '==', profile.uid));
    const unsubD = onSnapshot(qD, (snap) => {
      setDeposits(snap.docs.map(d => ({ id: d.id, ...d.data() } as Deposit)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'deposits');
    });

    const qW = query(collection(db, 'withdrawals'), where('uid', '==', profile.uid));
    const unsubW = onSnapshot(qW, (snap) => {
      setWithdrawals(snap.docs.map(w => ({ id: w.id, ...w.data() } as Withdrawal)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'withdrawals');
    });

    return () => { unsubD(); unsubW(); };
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // 500KB limit for base64 in Firestore
        alert('Image is too large. Please use a smaller file (under 500KB).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeposit = async () => {
    if (!profile || !depositAmount || !proofImage) {
      return alert('Please fill in all fields and upload proof of payment.');
    }
    const amount = parseFloat(depositAmount);
    if (amount < 1) return alert('Minimum deposit is $1');

    setUploading(true);
    try {
      await addDoc(collection(db, 'deposits'), {
        uid: profile.uid,
        amount,
        method: depositMethod,
        status: 'pending',
        timestamp: new Date().toISOString(),
        proofUrl: proofImage,
      });

      setShowDeposit(false);
      setDepositAmount('');
      setProofImage(null);
      alert('Deposit request submitted! Please wait for admin approval.');
    } catch (error) {
      console.error(error);
      alert('Error submitting deposit. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!profile || !withdrawAmount) return;
    
    if (!profile.withdrawalCode) {
      return alert('Please set a withdrawal code in settings first.');
    }

    if (withdrawCode !== profile.withdrawalCode) {
      return alert('Incorrect withdrawal code.');
    }

    const amount = parseFloat(withdrawAmount);
    if (amount < 1) return alert('Minimum withdrawal is $1');
    if (amount > 500) return alert('Maximum withdrawal is $500');
    if (amount > profile.balance) return alert('Insufficient balance');

    await addDoc(collection(db, 'withdrawals'), {
      uid: profile.uid,
      amount,
      method: 'Ecocash',
      status: 'pending',
      timestamp: new Date().toISOString(),
    });

    // Deduct balance immediately (optimistic)
    await updateDoc(doc(db, 'users', profile.uid), {
      balance: increment(-amount)
    });

    setShowWithdraw(false);
    setWithdrawAmount('');
    setWithdrawCode('');
    alert('Withdrawal request submitted!');
  };

  const handleSetWithdrawCode = async () => {
    if (!profile || !newWithdrawCode) return;
    if (newWithdrawCode.length < 4) return alert('Code must be at least 4 digits');

    await updateDoc(doc(db, 'users', profile.uid), {
      withdrawalCode: newWithdrawCode
    });

    setShowSetCode(false);
    setNewWithdrawCode('');
    alert('Withdrawal code updated successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Wallet size={32} />
          </div>
          <div>
            <h2 className="text-xl font-black text-neutral-800">{profile?.displayName}</h2>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Account Level: 01</p>
          </div>
        </div>
        <button 
          onClick={() => setShowSetCode(true)}
          className="rounded-xl bg-neutral-100 p-3 text-neutral-600 hover:bg-neutral-200 transition-colors"
        >
          <Smartphone size={20} />
        </button>
      </div>

      {/* Balance Section */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setShowDeposit(true)}
          className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-sm transition-transform active:scale-95"
        >
          <div className="rounded-full bg-orange-100 p-3 text-orange-600">
            <ArrowDownCircle size={24} />
          </div>
          <span className="text-sm font-bold text-neutral-700">Deposit</span>
        </button>
        <button 
          onClick={() => setShowWithdraw(true)}
          className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-sm transition-transform active:scale-95"
        >
          <div className="rounded-full bg-blue-100 p-3 text-blue-600">
            <ArrowUpCircle size={24} />
          </div>
          <span className="text-sm font-bold text-neutral-700">Withdraw</span>
        </button>
      </div>

      {/* Transaction History */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <History size={20} className="text-emerald-600" />
          <h3 className="text-lg font-bold tracking-tight text-neutral-800">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {[...deposits, ...withdrawals]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10)
            .map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${'method' in tx ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                    {'method' in tx ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-800">
                      {'method' in tx ? 'Deposit' : 'Withdrawal'}
                    </p>
                    <p className="text-[10px] text-neutral-400">{new Date(tx.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${'method' in tx ? 'text-emerald-600' : 'text-red-500'}`}>
                    {'method' in tx ? '+' : '-'}${tx.amount.toFixed(2)}
                  </p>
                  <p className={`text-[10px] font-bold uppercase ${
                    tx.status === 'approved' ? 'text-emerald-500' : 
                    tx.status === 'pending' ? 'text-orange-500' : 'text-red-500'
                  }`}>
                    {tx.status}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Withdrawal History */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <ArrowUpCircle size={20} className="text-blue-600" />
          <h3 className="text-lg font-bold tracking-tight text-neutral-800">Withdrawal History</h3>
        </div>
        <div className="space-y-3">
          {withdrawals.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-neutral-400">
              No withdrawal requests found.
            </div>
          ) : (
            withdrawals
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-50 p-2 text-blue-500">
                      <ArrowUpCircle size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-800">Withdrawal</p>
                      <p className="text-[10px] text-neutral-400">{new Date(tx.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-red-500">-${tx.amount.toFixed(2)}</p>
                    <p className={`text-[10px] font-bold uppercase ${
                      tx.status === 'approved' ? 'text-emerald-500' : 
                      tx.status === 'pending' ? 'text-orange-500' : 'text-red-500'
                    }`}>
                      {tx.status}
                    </p>
                  </div>
                </div>
              ))
          )}
        </div>
      </section>

      {/* Set Withdrawal Code Modal */}
      {showSetCode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl"
          >
            <h3 className="text-2xl font-black text-neutral-800">Withdrawal Code</h3>
            <p className="mt-2 text-sm text-neutral-500">Set a secure code for authorizing withdrawals.</p>
            
            <div className="mt-6 space-y-4">
              <input 
                type="password" 
                placeholder="New Code (e.g. 1234)"
                value={newWithdrawCode}
                onChange={(e) => setNewWithdrawCode(e.target.value)}
                className="w-full rounded-xl border bg-neutral-50 px-4 py-3 text-lg font-bold outline-none focus:border-emerald-600"
              />
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowSetCode(false)}
                  className="flex-1 rounded-xl bg-neutral-100 py-3 font-bold text-neutral-600"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSetWithdrawCode}
                  className="flex-1 rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-lg shadow-emerald-600/20"
                >
                  Save Code
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDeposit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl"
          >
            <h3 className="text-2xl font-black text-neutral-800">Deposit Funds</h3>
            <p className="mt-2 text-sm text-neutral-500">Minimum deposit is $1 via Ecocash or Visa.</p>
            
            <div className="mt-6 space-y-4">
              <div className="flex gap-2">
                <button 
                  onClick={() => setDepositMethod('ecocash')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition-colors ${depositMethod === 'ecocash' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-neutral-600'}`}
                >
                  <Smartphone size={18} /> Ecocash
                </button>
                <button 
                  onClick={() => setDepositMethod('visa')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition-colors ${depositMethod === 'visa' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-neutral-600'}`}
                >
                  <CreditCard size={18} /> Visa
                </button>
              </div>

              <div className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-[10px] font-bold uppercase text-neutral-400">Payment Details</p>
                {depositMethod === 'ecocash' ? (
                  <p className="mt-1 font-mono text-sm font-bold text-neutral-700">Number: 0773259014</p>
                ) : (
                  <p className="mt-1 font-mono text-sm font-bold text-neutral-700">Card: 5321 6203 6619 0003</p>
                )}
              </div>

              <input 
                type="number" 
                placeholder="Amount (USD)"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full rounded-xl border bg-neutral-50 px-4 py-3 text-lg font-bold outline-none focus:border-emerald-600"
              />

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase text-neutral-400">Upload Proof of Payment</p>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="proof-upload"
                  />
                  <label 
                    htmlFor="proof-upload"
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 py-4 text-sm font-bold text-neutral-500 hover:bg-neutral-100"
                  >
                    {proofImage ? '✅ Proof Selected' : '📁 Choose Image'}
                  </label>
                </div>
                {proofImage && (
                  <div className="mt-2 overflow-hidden rounded-xl border">
                    <img src={proofImage} alt="Proof" className="h-32 w-full object-cover" />
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <button 
                  disabled={uploading}
                  onClick={() => setShowDeposit(false)}
                  className="flex-1 rounded-xl bg-neutral-100 py-3 font-bold text-neutral-600"
                >
                  Cancel
                </button>
                <button 
                  disabled={uploading}
                  onClick={handleDeposit}
                  className="flex-1 rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {uploading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl"
          >
            <h3 className="text-2xl font-black text-neutral-800">Withdraw Funds</h3>
            <p className="mt-2 text-sm text-neutral-500">Min: $1 | Max: $500</p>
            
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-[10px] font-bold uppercase text-neutral-400">Withdrawal Method</p>
                <p className="mt-1 font-bold text-neutral-700">Ecocash (263773259014)</p>
              </div>

              <input 
                type="number" 
                placeholder="Amount (USD)"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full rounded-xl border bg-neutral-50 px-4 py-3 text-lg font-bold outline-none focus:border-emerald-600"
              />

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase text-neutral-400">Withdrawal Code</p>
                <input 
                  type="password" 
                  placeholder="Enter Code"
                  value={withdrawCode}
                  onChange={(e) => setWithdrawCode(e.target.value)}
                  className="w-full rounded-xl border bg-neutral-50 px-4 py-3 text-lg font-bold outline-none focus:border-emerald-600"
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowWithdraw(false)}
                  className="flex-1 rounded-xl bg-neutral-100 py-3 font-bold text-neutral-600"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleWithdraw}
                  className="flex-1 rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-lg shadow-emerald-600/20"
                >
                  Withdraw
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
