import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Users, Receipt, ArrowRight, Share2, Trash2, ChevronLeft, User } from 'lucide-react';
import { useStorage } from './hooks/useStorage';
import { SplitType, UserProfile, Expense } from './types';
import { cn, formatCurrency } from './lib/utils';
import { calculateBalances } from './lib/calculator';

export default function App() {
  const { groups, expenses, createGroup, addExpense, updateExpense, addMemberToGroup, currentUser, deleteExpense, joinGroupByCode, deleteGroup, updateMemberName } = useStorage();
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [view, setView] = useState<'dashboard' | 'group' | 'add-expense'>('dashboard');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [tempMemberName, setTempMemberName] = useState('');

  const [selectedDebtDetails, setSelectedDebtDetails] = useState<{ from: string, to: string } | null>(null);

  const activeGroup = groups.find(g => g.id === activeGroupId);
  const groupExpenses = activeGroupId ? expenses[activeGroupId] || [] : [];
  const debts = activeGroup ? calculateBalances(groupExpenses, activeGroup.members) : [];

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const g = createGroup(newGroupName);
    setNewGroupName('');
    setIsCreatingGroup(false);
    setActiveGroupId(g.id);
    setView('group');
  };

  const startEditing = (expense: Expense) => {
    setEditingExpense(expense);
    setView('add-expense');
  };

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const g = joinGroupByCode(inviteCodeInput);
      setInviteCodeInput('');
      setIsJoiningGroup(false);
      setActiveGroupId(g.id);
      setView('group');
    } catch (err) {
      alert('Group not found. Check the code again!');
    }
  };
  const handleShare = () => {
    if (!activeGroup) return;
    const text = `Split our expenses on SplitPro! Group: ${activeGroup.name}\nInvite Code: ${activeGroup.inviteCode}`;
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col pb-10">
      {/* Header */}
      <header className="p-8 flex items-end justify-between sticky top-0 bg-surface-bg/80 backdrop-blur-md z-30">
        <div>
          <label className="label-bento text-brand-primary">SplitPro</label>
          <h1 className="text-3xl font-black italic">Expense Splitter</h1>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 p-1 flex items-center justify-center">
          {currentUser.displayName ? (
            <img className="rounded-xl" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.displayName}`} alt="avatar" />
          ) : (
            <User size={20} className="text-brand-primary" />
          )}
        </div>
      </header>

      <main className="flex-1 px-8">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <section>
                <label className="label-bento">Your Activity</label>
                <h2 className="text-2xl font-bold">Groups</h2>
              </section>

              <div className="grid grid-cols-2 gap-4">
                {!isCreatingGroup ? (
                  <button
                    onClick={() => {
                      setIsCreatingGroup(true);
                      setIsJoiningGroup(false);
                    }}
                    className="border-2 border-dashed border-border-card rounded-3xl p-6 flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-brand-primary hover:border-brand-primary transition-all active:scale-95 bg-surface-card/30 h-32"
                  >
                    <Plus size={24} />
                    <span className="font-bold uppercase tracking-[0.2em] text-[8px]">New</span>
                  </button>
                ) : (
                  <div className="col-span-2 h-32" />
                )}

                {!isJoiningGroup ? (
                  <button
                    onClick={() => {
                      setIsJoiningGroup(true);
                      setIsCreatingGroup(false);
                    }}
                    className="border-2 border-dashed border-border-card rounded-3xl p-6 flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-emerald-500 hover:border-emerald-500 transition-all active:scale-95 bg-surface-card/30 h-32"
                  >
                    <Users size={24} />
                    <span className="font-bold uppercase tracking-[0.2em] text-[8px]">Join</span>
                  </button>
                ) : (
                  <div className="col-span-2 h-32" />
                )}
              </div>

              <AnimatePresence>
                {isCreatingGroup && (
                  <motion.form
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleCreateGroup}
                    className="glass-card overflow-hidden space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="label-bento">Group Name</label>
                      <input
                        autoFocus
                        type="text"
                        placeholder="Goa Trip 🌴"
                        value={newGroupName}
                        onChange={e => setNewGroupName(e.target.value)}
                        className="w-full bg-surface-bg border border-border-card rounded-xl p-4 text-white outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="btn-primary flex-1">Create</button>
                      <button type="button" onClick={() => setIsCreatingGroup(false)} className="btn-secondary">Close</button>
                    </div>
                  </motion.form>
                )}

                {isJoiningGroup && (
                  <motion.form
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleJoinGroup}
                    className="glass-card overflow-hidden space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="label-bento">Invite Code</label>
                      <input
                        autoFocus
                        type="text"
                        placeholder="ENTER CODE"
                        value={inviteCodeInput}
                        onChange={e => setInviteCodeInput(e.target.value)}
                        className="w-full bg-surface-bg border border-border-card rounded-xl p-4 text-white outline-none font-mono text-center tracking-widest uppercase text-xl"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="btn-primary flex-1 bg-emerald-600 border-emerald-500">Join Group</button>
                      <button type="button" onClick={() => setIsJoiningGroup(false)} className="btn-secondary">Close</button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                {groups.length === 0 ? (
                  <div className="py-10 text-center text-slate-600 bg-surface-card/20 rounded-3xl border border-dashed border-border-card">
                    <p className="text-xs font-bold uppercase tracking-widest">No groups yet</p>
                  </div>
                ) : (
                  groups.map(group => (
                    <button
                      key={group.id}
                      onClick={() => {
                        setActiveGroupId(group.id);
                        setView('group');
                      }}
                      className="glass-card flex items-center justify-between group hover:border-brand-primary transition-all active:scale-[0.98] text-left w-full"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                          <Users size={28} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{group.name}</h3>
                          <p className="label-bento mb-0 font-mono text-slate-400 capitalize">{group.members.length} members • {group.currency}</p>
                        </div>
                      </div>
                      <ArrowRight size={20} className="text-slate-700 group-hover:text-brand-primary transition-colors" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {view === 'group' && activeGroup && (
            <motion.div
              key="group-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-end justify-between">
                <div>
                  <button onClick={() => setView('dashboard')} className="label-bento flex items-center gap-1 hover:text-white transition-colors">
                    <ChevronLeft size={10} /> Back to groups
                  </button>
                  <h2 className="text-3xl font-black">{activeGroup.name}</h2>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      if (confirm(`⚠️ DELETE GROUP?\n\nAre you sure you want to delete "${activeGroup.name}"? This will permanently remove all expenses and member data for this group.`)) {
                        const gid = activeGroup.id;
                        setActiveGroupId(null);
                        setView('dashboard');
                        deleteGroup(gid);
                      }
                    }} 
                    className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                    title="Delete Group"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button onClick={handleShare} className="w-12 h-12 bg-surface-card border border-border-card rounded-2xl flex items-center justify-center text-slate-400 hover:text-brand-primary transition-colors">
                    <Share2 size={20} />
                  </button>
                </div>
              </div>

              {/* Bento Grid Header */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-5 !rounded-3xl flex flex-col justify-between">
                  <label className="label-bento">Total Spent</label>
                  <p className="text-2xl font-mono font-bold text-emerald-400">
                    {formatCurrency(groupExpenses.reduce((sum, e) => sum + e.amount, 0), activeGroup.currency)}
                  </p>
                </div>
                <div className="glass-card p-5 !rounded-3xl bg-blue-600 border-blue-500 relative overflow-hidden group" onClick={handleShare}>
                  <div className="relative z-10">
                    <label className="label-bento text-blue-200">Invite Code</label>
                    <p className="text-2xl font-black text-white italic tracking-tighter">{activeGroup.inviteCode}</p>
                  </div>
                  <div className="absolute -bottom-4 -right-2 text-blue-500/30 font-black text-5xl group-hover:scale-110 transition-transform select-none">JOIN</div>
                </div>
              </div>

              {/* Members */}
              <div className="space-y-3">
                <label className="label-bento flex items-center gap-1">
                  <Users size={10} /> Group Members
                </label>
                <div className="flex flex-wrap gap-2">
                  {activeGroup.members.map(member => (
                    <div key={member.id}>
                      {editingMemberId === member.id ? (
                        <form 
                          className="flex items-center gap-1"
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (tempMemberName.trim()) {
                              updateMemberName(activeGroup.id, member.id, tempMemberName.trim());
                            }
                            setEditingMemberId(null);
                          }}
                        >
                          <input
                            autoFocus
                            type="text"
                            value={tempMemberName}
                            onChange={e => setTempMemberName(e.target.value)}
                            onBlur={() => {
                              if (tempMemberName.trim()) {
                                updateMemberName(activeGroup.id, member.id, tempMemberName.trim());
                              }
                              setEditingMemberId(null);
                            }}
                            className="h-8 bg-surface-card border border-brand-primary rounded-lg px-2 text-xs text-white outline-none w-24"
                          />
                        </form>
                      ) : (
                        <button 
                          onClick={() => {
                            setEditingMemberId(member.id);
                            setTempMemberName(member.displayName);
                          }}
                          className="bg-surface-card border border-border-card rounded-xl px-3 py-2 flex items-center gap-2 group transition-all hover:border-brand-primary/50"
                        >
                          <div className="h-6 w-6 rounded-lg overflow-hidden flex-shrink-0 bg-brand-primary/10 flex items-center justify-center">
                            {member.displayName ? (
                              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.displayName}`} alt={member.displayName} />
                            ) : (
                              <Plus size={12} className="text-brand-primary" />
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-300">
                            {member.displayName || 'Add Name'}
                          </span>
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {isAddingMember ? (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (newMemberName.trim()) {
                          addMemberToGroup(activeGroup.id, { id: crypto.randomUUID(), displayName: newMemberName.trim() });
                          setNewMemberName('');
                          setIsAddingMember(false);
                        }
                      }}
                      className="flex items-center gap-1"
                    >
                      <input
                        autoFocus
                        type="text"
                        placeholder="Friend's Name"
                        value={newMemberName}
                        onChange={e => setNewMemberName(e.target.value)}
                        className="h-10 bg-surface-card border border-brand-primary rounded-xl px-3 text-xs text-white outline-none w-32"
                      />
                      <button type="submit" className="h-10 w-10 bg-brand-primary text-white rounded-xl flex items-center justify-center">
                        <Plus size={16} />
                      </button>
                      <button type="button" onClick={() => setIsAddingMember(false)} className="h-10 px-2 text-slate-500 text-[10px] font-bold uppercase">
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <button 
                      onClick={() => setIsAddingMember(true)}
                      className="h-10 w-10 rounded-xl bg-surface-card border-2 border-dashed border-border-card flex items-center justify-center text-slate-500 hover:border-brand-primary hover:text-brand-primary transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Summary */}
              <section className="glass-card !p-0 overflow-hidden border border-border-card">
                <div className="p-5 border-b border-border-card flex items-center justify-between bg-slate-900/30">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Settlements & Status
                  </h3>
                  {debts.length > 0 && (
                    <button 
                      onClick={() => {
                        const debtText = debts.map(d => {
                          const donor = activeGroup.members.find(m => m.id === d.from)?.displayName;
                          const recipient = activeGroup.members.find(m => m.id === d.to)?.displayName;
                          return `• ${donor} ➔ ${recipient}: ${formatCurrency(d.amount, activeGroup.currency)}`;
                        }).join('\n');
                        const text = `💰 *SplitPro Summary: ${activeGroup.name}*\n\nSettlements:\n${debtText}\n\nSettle up now!`;
                        window.open(`whatsapp://send?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      className="text-[10px] font-bold text-brand-primary uppercase tracking-widest flex items-center gap-1"
                    >
                      <Share2 size={12} /> Share Summary
                    </button>
                  )}
                </div>
                <div className="p-4 space-y-4">
                  {/* Suggested Transactions */}
                  {debts.length > 0 && (
                    <div className="space-y-2">
                      <label className="label-bento !text-[8px] opacity-40">Suggested Payments (Click for details)</label>
                      {debts.map((debt) => {
                        const from = activeGroup.members.find(m => m.id === debt.from)?.displayName || '(Add Name)';
                        const to = activeGroup.members.find(m => m.id === debt.to)?.displayName || '(Add Name)';
                        return (
                          <button 
                            key={`${debt.from}-${debt.to}`} 
                            onClick={() => setSelectedDebtDetails({ from: debt.from, to: debt.to })}
                            className="w-full bg-surface-bg p-3 rounded-2xl border border-border-card/50 flex items-center justify-between hover:border-brand-primary/50 transition-all active:scale-[0.98]"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-300">{from}</span>
                              <ArrowRight size={10} className="text-slate-600" />
                              <span className="text-xs font-bold text-emerald-400">{to}</span>
                            </div>
                            <span className="font-mono font-bold text-rose-400">{formatCurrency(debt.amount, activeGroup.currency)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Individual Status (Tallied, etc) */}
                  <div className="space-y-2">
                    <label className="label-bento !text-[8px] opacity-40">Group Members Status</label>
                    <div className="grid grid-cols-1 gap-2">
                      {activeGroup.members.map(member => {
                        // Calculate net balance for this specific member
                        const balance = debts.reduce((acc, d) => {
                          if (d.from === member.id) return acc - d.amount;
                          if (d.to === member.id) return acc + d.amount;
                          return acc;
                        }, 0);

                        const isTallied = Math.abs(balance) < 0.01;
                        
                        return (
                          <div key={member.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40">
                            <div className="flex items-center gap-2">
                              <img className="w-5 h-5 rounded-lg" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.displayName}`} alt="" />
                              <span className="text-xs font-medium text-slate-400">{member.displayName || '(Add Name)'}</span>
                            </div>
                            {isTallied ? (
                              <span className="text-[10px] font-black uppercase text-slate-600 tracking-tighter">Tallied ✓</span>
                            ) : balance > 0 ? (
                              <span className="text-[10px] font-black uppercase text-emerald-500 tracking-tighter">Gets {formatCurrency(balance, activeGroup.currency)}</span>
                            ) : (
                              <span className="text-[10px] font-black uppercase text-rose-500 tracking-tighter">Owes {formatCurrency(Math.abs(balance), activeGroup.currency)}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              {/* Expenses List */}
              <section className="space-y-4 pb-20">
                <div className="flex items-center justify-between">
                  <label className="label-bento">Recent Activity</label>
                  <button onClick={() => setView('add-expense')} className="text-[10px] font-black text-brand-primary uppercase tracking-widest">
                    Add Expense
                  </button>
                </div>
                <div className="glass-card !p-0 border border-border-card divide-y divide-border-card/50 overflow-hidden">
                  {groupExpenses.length === 0 && (
                    <div className="py-20 text-center text-slate-600 flex flex-col items-center gap-3">
                      <Receipt size={48} strokeWidth={1} className="text-slate-700" />
                      <p className="font-bold uppercase tracking-widest text-xs">No expenses yet</p>
                    </div>
                  )}
                  {groupExpenses.slice().reverse().map(expense => {
                    const payer = activeGroup.members.find(m => m.id === expense.payerId)?.displayName || '(Add Name)';
                    return (
                      <div key={expense.id} className="p-5 flex items-center justify-between hover:bg-slate-900/20 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                            <Receipt size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-100">{expense.description}</h4>
                            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                              Paid by {payer} • {expense.splitType}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-bold text-emerald-400 text-lg">{formatCurrency(expense.amount, activeGroup.currency)}</span>
                            <span className="text-[9px] text-slate-600 font-bold uppercase">{new Date(expense.date).toLocaleDateString()}</span>
                          </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation();
                              startEditing(expense);
                            }} 
                            className="p-3 bg-brand-primary/5 text-slate-700 rounded-xl hover:bg-brand-primary hover:text-white transition-all border border-border-card/30 hover:border-brand-primary active:scale-90"
                            title="Edit Expense"
                          >
                            <ArrowRight size={16} className="-rotate-45" />
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation();
                              deleteExpense(activeGroup.id, expense.id);
                            }} 
                            className="p-3 bg-rose-500/5 text-slate-700 rounded-xl hover:bg-rose-500 hover:text-white transition-all border border-border-card/30 hover:border-rose-500 active:scale-90"
                            title="Delete Expense"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Floating Action */}
              <button
                onClick={() => setView('add-expense')}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 px-8 h-16 bg-brand-primary text-white rounded-full shadow-[0_8px_30px_rgb(59,130,246,0.3)] flex items-center justify-center gap-3 active:scale-95 transition-all z-50 border-4 border-surface-bg whitespace-nowrap"
              >
                <Plus size={24} />
                <span className="font-black uppercase tracking-widest text-xs italic">Add to Group</span>
              </button>
            </motion.div>
          )}

          {view === 'add-expense' && activeGroup && (
            <motion.div key="add-expense-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AddExpenseView 
                group={activeGroup} 
                initialExpense={editingExpense || undefined}
                onClose={() => {
                  setView('group');
                  setEditingExpense(null);
                }} 
                onSave={(data) => {
                  if (editingExpense) {
                    updateExpense(activeGroup.id, editingExpense.id, data);
                  } else {
                    addExpense(activeGroup.id, data);
                  }
                  setView('group');
                  setEditingExpense(null);
                }}
              />
            </motion.div>
          )}

          <AnimatePresence>
            {selectedDebtDetails && activeGroup && (
              <motion.div key="debt-details-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DebtDetailsModal 
                  debt={selectedDebtDetails}
                  expenses={groupExpenses}
                  members={activeGroup.members}
                  currency={activeGroup.currency}
                  onClose={() => setSelectedDebtDetails(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </AnimatePresence>
      </main>
    </div>
  );
}

function DebtDetailsModal({ debt, expenses, members, currency, onClose }: { 
  debt: { from: string, to: string }, 
  expenses: Expense[], 
  members: UserProfile[], 
  currency: string, 
  onClose: () => void 
}) {
  const fromUser = members.find(m => m.id === debt.from);
  const toUser = members.find(m => m.id === debt.to);

  // 1. Calculate how much 'from' owes 'to'
  const contributions = expenses.filter(e => e.payerId === debt.to && e.splits[debt.from]).map(e => {
    const splitCount = Object.keys(e.splits).length;
    let amount = 0;
    if (e.splitType === 'equal') amount = e.amount / splitCount;
    else if (e.splitType === 'percentage') amount = (e.amount * (e.splits[debt.from] as number)) / 100;
    else if (e.splitType === 'shares') {
      const total = Object.values(e.splits).reduce((a, b) => (a as number) + (b as number), 0) as number;
      amount = (e.amount * (e.splits[debt.from] as number)) / (total || 1);
    }
    return { name: e.description, amount };
  });

  const totalFOwesT = contributions.reduce((sum, c) => sum + c.amount, 0);

  // 2. Calculate how much 'to' owes 'from' (for offsetting)
  const offsets = expenses.filter(e => e.payerId === debt.from && e.splits[debt.to]).map(e => {
    const splitCount = Object.keys(e.splits).length;
    let amount = 0;
    if (e.splitType === 'equal') amount = e.amount / splitCount;
    else if (e.splitType === 'percentage') amount = (e.amount * (e.splits[debt.to] as number)) / 100;
    else if (e.splitType === 'shares') {
      const total = Object.values(e.splits).reduce((a, b) => (a as number) + (b as number), 0) as number;
      amount = (e.amount * (e.splits[debt.to] as number)) / (total || 1);
    }
    return { name: e.description, amount };
  });
  
  const totalTOwesF = offsets.reduce((sum, o) => sum + o.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="glass-card w-full max-w-md max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Total Breakdown</h3>
          <button onClick={onClose} className="p-2 bg-surface-bg rounded-xl text-slate-500 hover:text-white transition-colors">
            Close
          </button>
        </div>

        <div className="p-4 bg-brand-primary/10 rounded-3xl border border-brand-primary/20 mb-6 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{fromUser?.displayName} owes {toUser?.displayName}</p>
          <p className="text-4xl font-black text-white">{formatCurrency(totalFOwesT - totalTOwesF, currency)}</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="label-bento mb-3">Items {toUser?.displayName} paid for you</label>
            <div className="space-y-2">
              {contributions.length === 0 ? (
                <p className="text-xs text-slate-600 italic">None</p>
              ) : (
                contributions.map((c, i) => (
                  <div key={`contribution-${i}`} className="flex justify-between items-center p-3 rounded-xl bg-slate-900/40 border border-border-card/50">
                    <span className="text-sm font-medium text-slate-300">{c.name}</span>
                    <span className="font-mono text-sm text-rose-400">{formatCurrency(c.amount, currency)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {totalTOwesF > 0 && (
            <div>
              <label className="label-bento mb-3">Less: Offset (You paid {toUser?.displayName} back)</label>
              <div className="space-y-2">
                {offsets.map((o, i) => (
                  <div key={`offset-${i}`} className="flex justify-between items-center p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <span className="text-sm font-medium text-slate-400 italic">{o.name}</span>
                    <span className="font-mono text-sm text-emerald-400">-{formatCurrency(o.amount, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function AddExpenseView({ group, onClose, onSave, initialExpense }: { group: any, onClose: () => void, onSave: (data: any) => void, initialExpense?: Expense }) {
  const [desc, setDesc] = useState(initialExpense?.description || '');
  const [amount, setAmount] = useState(initialExpense?.amount.toString() || '');
  const [payerId, setPayerId] = useState(initialExpense?.payerId || group.members[0].id);
  const [selectedSplitters, setSelectedSplitters] = useState<Record<string, boolean>>(
    initialExpense 
      ? Object.fromEntries(group.memberIds.map((id: string) => [id, !!initialExpense.splits[id]]))
      : Object.fromEntries(group.memberIds.map((id: string) => [id, true]))
  );
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!desc.trim()) {
      alert('Please enter a description');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const splitUserIds = Object.entries(selectedSplitters)
      .filter(([_, selected]) => selected)
      .map(([id]) => id);

    if (splitUserIds.length === 0) {
      alert('Select at least one person to split with!');
      return;
    }

    // Default: split equally among selected members
    const splits: Record<string, number> = {};
    splitUserIds.forEach((id: string) => {
      splits[id] = 1; // equal logic
    });

    onSave({
      description: desc.trim(),
      amount: numAmount,
      payerId,
      date: initialExpense ? initialExpense.date : Date.now(),
      splitType: 'equal',
      splits
    });
  };

  const toggleSplitter = (id: string) => {
    setSelectedSplitters(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:text-white">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-black text-white">Quick Add</h2>
        <div className="w-8" />
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="space-y-4">
          <div className="glass-card space-y-4 bg-slate-900/50">
            <div className="flex gap-4">
              <div className="flex-1 space-y-1 bg-surface-bg/50 rounded-2xl p-4 border border-border-card">
                <label className="label-bento">Amount ({group.currency})</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="bg-transparent w-full font-mono text-3xl font-black focus:outline-none text-emerald-400"
                />
              </div>
              <div className="flex-1 space-y-1 bg-surface-bg/50 rounded-2xl p-4 border border-border-card">
                <label className="label-bento">Paid By</label>
                <select 
                  value={payerId}
                  onChange={e => setPayerId(e.target.value)}
                  className="bg-transparent w-full font-bold text-white outline-none cursor-pointer appearance-none"
                >
                  {group.members.map((m: UserProfile) => (
                    <option key={m.id} value={m.id} className="bg-surface-card text-white">
                      {m.displayName || `(Add Name)`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-surface-bg/50 rounded-2xl p-4 border border-border-card space-y-1">
              <label className="label-bento">Description</label>
              <input
                autoFocus
                type="text"
                placeholder="e.g. Dinner at Villa Shanti"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                className="bg-transparent w-full font-medium text-slate-100 outline-none focus:placeholder-transparent"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between ml-1">
              <label className="label-bento !mb-0">Split With (Select People)</label>
              <button 
                type="button" 
                onClick={() => {
                  const allSelected = group.memberIds.every((id: string) => selectedSplitters[id]);
                  const newState = !allSelected;
                  setSelectedSplitters(Object.fromEntries(group.memberIds.map((id: string) => [id, newState])));
                }}
                className="text-[9px] font-black uppercase text-brand-primary tracking-widest hover:underline"
              >
                {group.memberIds.every((id: string) => selectedSplitters[id]) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {group.members.map((member: UserProfile) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleSplitter(member.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl border transition-all text-left",
                    selectedSplitters[member.id] 
                      ? "bg-brand-primary/10 border-brand-primary text-white shadow-lg shadow-blue-900/20" 
                      : "bg-surface-card border-border-card text-slate-500 opacity-60"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 transition-grayscale",
                    selectedSplitters[member.id] ? "" : "grayscale"
                  )}>
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.displayName}`} alt="" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold truncate">{member.displayName || 'Add Name'}</p>
                    <p className="text-[8px] font-mono uppercase opacity-60">
                      {selectedSplitters[member.id] ? 'Included' : 'Excluded'}
                    </p>
                  </div>
                  {selectedSplitters[member.id] && (
                    <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" className="w-full btn-primary !py-5 shadow-2xl shadow-blue-500/20 active:translate-y-1">
          {initialExpense ? 'Update Expense' : 'Add Expense to Group'}
        </button>
      </form>
    </motion.div>
  );
}
