import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { Check, X, User, DollarSign, Clock, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Deposit, Withdrawal } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../firestoreUtils';

export const Admin: React.FC = () => {
  const [pendingDeposits, setPendingDeposits] = useState<Deposit[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Withdrawal[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ item: any; type: 'approve' | 'reject'; category: 'deposit' | 'withdrawal' } | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const qD = query(collection(db, 'deposits'), where('status', '==', 'pending'));
    const unsubD = onSnapshot(qD, (snap) => {
      setPendingDeposits(snap.docs.map(d => ({ id: d.id, ...d.data() } as Deposit)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'deposits');
    });

    const qW = query(collection(db, 'withdrawals'), where('status', '==', 'pending'));
    const unsubW = onSnapshot(qW, (snap) => {
      setPendingWithdrawals(snap.docs.map(w => ({ id: w.id, ...w.data() } as Withdrawal)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'withdrawals');
    });

    return () => { unsubD(); unsubW(); };
  }, []);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleApproveDeposit = async (deposit: Deposit) => {
    setProcessing(true);
    try {
      await updateDoc(doc(db, 'deposits', deposit.id), { status: 'approved' });
      await updateDoc(doc(db, 'users', deposit.uid), { balance: increment(deposit.amount) });
      showFeedback(`Approved deposit of $${deposit.amount.toFixed(2)}`);
    } catch (err) {
      showFeedback('Error approving deposit', 'error');
    } finally {
      setProcessing(false);
      setConfirmAction(null);
    }
  };

  const handleRejectDeposit = async (deposit: Deposit) => {
    setProcessing(true);
    try {
      await updateDoc(doc(db, 'deposits', deposit.id), { status: 'rejected' });
      showFeedback(`Rejected deposit of $${deposit.amount.toFixed(2)}`);
    } catch (err) {
      showFeedback('Error rejecting deposit', 'error');
    } finally {
      setProcessing(false);
      setConfirmAction(null);
    }
  };

  const handleApproveWithdrawal = async (withdrawal: Withdrawal) => {
    setProcessing(true);
    try {
      await updateDoc(doc(db, 'withdrawals', withdrawal.id), { status: 'approved' });
      showFeedback(`Approved withdrawal of $${withdrawal.amount.toFixed(2)}`);
    } catch (err) {
      showFeedback('Error approving withdrawal', 'error');
    } finally {
      setProcessing(false);
      setConfirmAction(null);
    }
  };

  const handleRejectWithdrawal = async (withdrawal: Withdrawal) => {
    setProcessing(true);
    try {
      await updateDoc(doc(db, 'withdrawals', withdrawal.id), { status: 'rejected' });
      // Refund balance
      await updateDoc(doc(db, 'users', withdrawal.uid), { balance: increment(withdrawal.amount) });
      showFeedback(`Rejected withdrawal of $${withdrawal.amount.toFixed(2)} (Refunded)`);
    } catch (err) {
      showFeedback('Error rejecting withdrawal', 'error');
    } finally {
      setProcessing(false);
      setConfirmAction(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="rounded-3xl bg-red-600 p-8 text-white shadow-xl shadow-red-900/10">
        <h2 className="text-2xl font-black">Admin Dashboard</h2>
        <p className="mt-2 text-sm text-red-100/60">Manage platform operations and user requests.</p>
        <div className="mt-6 flex items-center gap-2 rounded-xl bg-white/20 p-3 backdrop-blur-md">
          <Phone size={18} />
          <span className="text-sm font-bold">HR: 263712117185</span>
        </div>
      </div>

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 left-1/2 z-[110] -translate-x-1/2 flex items-center gap-2 rounded-2xl px-6 py-3 shadow-2xl ${
              feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-bold">{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deposits Section */}
      <section>
        <div className="mb-4 flex items-center justify-between px-2">
          <h3 className="text-lg font-bold tracking-tight text-neutral-800">Pending Deposits ({pendingDeposits.length})</h3>
        </div>
        
        <div className="space-y-4">
          {pendingDeposits.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-8 text-center">
              <p className="text-sm font-bold text-neutral-400">No pending deposits.</p>
            </div>
          ) : (
            pendingDeposits.map((deposit) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={deposit.id} 
                className="rounded-3xl border bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-neutral-400" />
                      <span className="text-xs font-bold text-neutral-800">{deposit.uid.substring(0, 12)}...</span>
                    </div>
                    <div className="text-2xl font-black text-emerald-600">${deposit.amount.toFixed(2)}</div>
                    {deposit.proofUrl && (
                      <div className="mt-2 overflow-hidden rounded-xl border">
                        <img 
                          src={deposit.proofUrl} 
                          alt="Proof" 
                          className="h-24 w-full cursor-pointer object-cover transition-transform hover:scale-110" 
                          onClick={() => window.open(deposit.proofUrl, '_blank')}
                        />
                      </div>
                    )}
                    <div className="flex gap-3 text-[10px] font-bold uppercase text-neutral-400">
                      <span>{deposit.method}</span>
                      <span>•</span>
                      <span>{new Date(deposit.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => setConfirmAction({ item: deposit, type: 'approve', category: 'deposit' })}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                    >
                      <Check size={20} />
                    </button>
                    <button 
                      onClick={() => setConfirmAction({ item: deposit, type: 'reject', category: 'deposit' })}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Withdrawals Section */}
      <section>
        <div className="mb-4 flex items-center justify-between px-2">
          <h3 className="text-lg font-bold tracking-tight text-neutral-800">Pending Withdrawals ({pendingWithdrawals.length})</h3>
        </div>
        
        <div className="space-y-4">
          {pendingWithdrawals.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-8 text-center">
              <p className="text-sm font-bold text-neutral-400">No pending withdrawals.</p>
            </div>
          ) : (
            pendingWithdrawals.map((withdrawal) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={withdrawal.id} 
                className="rounded-3xl border bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-neutral-400" />
                      <span className="text-xs font-bold text-neutral-800">{withdrawal.uid.substring(0, 12)}...</span>
                    </div>
                    <div className="text-2xl font-black text-blue-600">${withdrawal.amount.toFixed(2)}</div>
                    <div className="flex gap-3 text-[10px] font-bold uppercase text-neutral-400">
                      <span>{withdrawal.method}</span>
                      <span>•</span>
                      <span>{new Date(withdrawal.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => setConfirmAction({ item: withdrawal, type: 'approve', category: 'withdrawal' })}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    >
                      <Check size={20} />
                    </button>
                    <button 
                      onClick={() => setConfirmAction({ item: withdrawal, type: 'reject', category: 'withdrawal' })}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl"
            >
              <h3 className="text-center text-2xl font-black text-neutral-800">
                {confirmAction.type === 'approve' ? 'Approve' : 'Reject'} {confirmAction.category}?
              </h3>
              
              <div className="mt-4 rounded-2xl bg-neutral-50 p-4 text-center">
                <p className="text-sm font-medium text-neutral-500">Amount</p>
                <p className={`text-2xl font-black ${confirmAction.type === 'approve' ? 'text-emerald-600' : 'text-red-600'}`}>
                  ${confirmAction.item.amount.toFixed(2)}
                </p>
                {confirmAction.category === 'deposit' && confirmAction.item.proofUrl && (
                  <div className="mt-3 overflow-hidden rounded-xl border">
                    <img src={confirmAction.item.proofUrl} alt="Proof" className="max-h-48 w-full object-contain" />
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  disabled={processing}
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 rounded-2xl bg-neutral-100 py-4 text-sm font-bold text-neutral-600"
                >
                  Cancel
                </button>
                <button
                  disabled={processing}
                  onClick={() => {
                    if (confirmAction.category === 'deposit') {
                      confirmAction.type === 'approve' ? handleApproveDeposit(confirmAction.item) : handleRejectDeposit(confirmAction.item);
                    } else {
                      confirmAction.type === 'approve' ? handleApproveWithdrawal(confirmAction.item) : handleRejectWithdrawal(confirmAction.item);
                    }
                  }}
                  className={`flex-1 rounded-2xl py-4 text-sm font-bold text-white shadow-lg ${
                    confirmAction.type === 'approve' ? 'bg-emerald-600' : 'bg-red-600'
                  }`}
                >
                  {processing ? '...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};


