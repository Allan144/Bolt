import React, { useEffect, useState } from 'react';
import { Shield, Users, MessageSquare, Plus, CreditCard as Edit2, Trash2, X, Save, Database } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AppUser, ChatAnswer, UserRole } from '../types';

type AdminTab = 'users' | 'chat' | 'tables';

const ChatAnswerForm: React.FC<{
  answer?: ChatAnswer;
  onSave: (data: Partial<ChatAnswer>) => void;
  onClose: () => void;
}> = ({ answer, onSave, onClose }) => {
  const [form, setForm] = useState({
    question: answer?.question ?? '',
    answer: answer?.answer ?? '',
    keywords: answer?.keywords.join(', ') ?? '',
    is_active: answer?.is_active ?? true,
    display_order: answer?.display_order ?? 0,
  });

  const handleSave = () => {
    onSave({
      id: answer?.id,
      question: form.question,
      answer: form.answer,
      keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
      is_active: form.is_active,
      display_order: form.display_order,
    });
  };

  return (
    <div className="bg-stone-900 border border-amber-700/40 rounded-2xl p-5 space-y-3">
      <div>
        <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Question</label>
        <input className="input-dark w-full" value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} placeholder="What do users ask?" />
      </div>
      <div>
        <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Answer</label>
        <textarea className="input-dark w-full resize-none" rows={3} value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} placeholder="Helpful response..." />
      </div>
      <div>
        <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Keywords (comma-separated)</label>
        <input className="input-dark w-full" value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} placeholder="rate, price, cost, fee" />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-amber-600" />
          <span className="text-stone-300 text-sm">Active</span>
        </label>
        <div className="flex gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-stone-400 hover:text-white text-sm">Cancel</button>
          <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-sm">
            <Save className="w-3.5 h-3.5" />Save
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminPanel: React.FC<{ user: AppUser }> = ({ user }) => {
  const [tab, setTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [chatAnswers, setChatAnswers] = useState<ChatAnswer[]>([]);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editingChat, setEditingChat] = useState<ChatAnswer | null>(null);
  const [newChat, setNewChat] = useState(false);
  const [loading, setLoading] = useState(false);

  const KNOWN_TABLES = ['users', 'client_info', 'students', 'calendar_events', 'billing_records', 'lesson_history', 'tickler', 'chat_answers'];

  useEffect(() => {
    if (tab === 'users') loadUsers();
    if (tab === 'chat') loadChat();
  }, [tab]);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('users').select('*').order('created_at');
    setUsers((data ?? []) as AppUser[]);
    setLoading(false);
  };

  const loadChat = async () => {
    setLoading(true);
    const { data } = await supabase.from('chat_answers').select('*').order('display_order');
    setChatAnswers((data ?? []) as ChatAnswer[]);
    setLoading(false);
  };

  const updateUserRole = async (id: string, role: UserRole) => {
    await supabase.from('users').update({ role }).eq('id', id);
    loadUsers();
    setEditingUser(null);
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    await supabase.from('users').delete().eq('id', id);
    loadUsers();
  };

  const saveChatAnswer = async (data: Partial<ChatAnswer>) => {
    if (data.id) {
      await supabase.from('chat_answers').update({
        question: data.question, answer: data.answer,
        keywords: data.keywords, is_active: data.is_active, display_order: data.display_order
      }).eq('id', data.id);
    } else {
      await supabase.from('chat_answers').insert([{
        question: data.question, answer: data.answer,
        keywords: data.keywords ?? [], is_active: data.is_active ?? true, display_order: data.display_order ?? 0
      }]);
    }
    loadChat();
    setEditingChat(null);
    setNewChat(false);
  };

  const deleteChatAnswer = async (id: string) => {
    if (!confirm('Delete this Q&A entry?')) return;
    await supabase.from('chat_answers').delete().eq('id', id);
    loadChat();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-amber-700/30 flex items-center justify-center">
          <Shield className="w-5 h-5 text-amber-400" />
        </div>
        <h1 className="text-2xl font-serif text-white">Admin Panel</h1>
      </div>

      <div className="flex rounded-xl overflow-hidden border border-stone-700 w-fit">
        {([
          { id: 'users', label: 'Users', icon: Users },
          { id: 'chat', label: 'Chatbot Q&A', icon: MessageSquare },
          { id: 'tables', label: 'Tables', icon: Database },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${tab === id ? 'bg-amber-700 text-white' : 'bg-stone-800 text-stone-400 hover:text-white'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {loading && <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" /></div>}

      {tab === 'users' && !loading && (
        <div className="bg-stone-800 border border-stone-700/50 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-stone-500 text-xs uppercase tracking-wide border-b border-stone-700 bg-stone-900/40">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-700/30">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-stone-700/20 transition-colors">
                  <td className="px-4 py-3 text-white">{u.display_name}</td>
                  <td className="px-4 py-3 text-stone-400">{u.email}</td>
                  <td className="px-4 py-3">
                    {editingUser?.id === u.id ? (
                      <select className="input-dark text-xs" defaultValue={u.role} onChange={e => updateUserRole(u.id, e.target.value as UserRole)}>
                        <option value="admin">admin</option>
                        <option value="teacher">teacher</option>
                        <option value="parent">parent</option>
                        <option value="student">student</option>
                      </select>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-stone-700 text-stone-300 capitalize">{u.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditingUser(editingUser?.id === u.id ? null : u)} className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-stone-700 rounded-lg">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {u.id !== user.id && (
                        <button onClick={() => deleteUser(u.id)} className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-stone-700 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'chat' && !loading && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setNewChat(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm">
              <Plus className="w-4 h-4" />Add Q&A
            </button>
          </div>
          {(newChat || editingChat) && (
            <ChatAnswerForm
              answer={newChat ? undefined : editingChat ?? undefined}
              onSave={saveChatAnswer}
              onClose={() => { setNewChat(false); setEditingChat(null); }}
            />
          )}
          {chatAnswers.map(a => (
            <div key={a.id} className="bg-stone-800 border border-stone-700/50 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-white text-sm font-medium mb-1">{a.question}</p>
                  <p className="text-stone-400 text-sm leading-relaxed">{a.answer}</p>
                  {a.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {a.keywords.map(k => (
                        <span key={k} className="px-1.5 py-0.5 bg-stone-700 text-stone-400 text-xs rounded">{k}</span>
                      ))}
                    </div>
                  )}
                  {!a.is_active && <span className="text-xs text-stone-500 mt-1 block">Inactive</span>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setEditingChat(a); setNewChat(false); }} className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-stone-700 rounded-lg">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteChatAnswer(a.id)} className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-stone-700 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'tables' && (
        <div className="space-y-3">
          <p className="text-stone-400 text-sm">Database tables in the LCE Lessons application. Use the Supabase dashboard for advanced schema management.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {KNOWN_TABLES.map(t => (
              <div key={t} className="bg-stone-800 border border-stone-700/50 rounded-xl p-4 flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-stone-300 text-sm font-mono">{t}</span>
              </div>
            ))}
          </div>
          <p className="text-stone-500 text-xs">Tables: users, client_info, students, calendar_events, billing_records, lesson_history, tickler, chat_answers — all with RLS enabled.</p>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
