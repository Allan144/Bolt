import React, { useEffect, useState } from 'react';
import { Plus, Bell, X, Save, CircleCheck as CheckCircle, Circle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TicklerItem, Student, AppUser, Priority } from '../types';
import { format, parseISO, isPast } from 'date-fns';

const PRIORITY_STYLES: Record<Priority, string> = {
  high: 'bg-red-900/40 text-red-400 border-red-700/40',
  medium: 'bg-amber-900/40 text-amber-400 border-amber-700/40',
  low: 'bg-stone-700/60 text-stone-400 border-stone-600/40',
};

const TicklerModal: React.FC<{
  item?: TicklerItem;
  students: Student[];
  userId: string;
  onSave: (data: Partial<TicklerItem>) => void;
  onClose: () => void;
}> = ({ item, students, userId, onSave, onClose }) => {
  const [form, setForm] = useState({
    title: item?.title ?? '',
    description: item?.description ?? '',
    due_date: item?.due_date ?? '',
    priority: (item?.priority ?? 'medium') as Priority,
    related_student_id: item?.related_student_id ?? '',
    is_completed: item?.is_completed ?? false,
  });

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <h2 className="text-white font-medium">{item ? 'Edit Reminder' : 'New Reminder'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-stone-400 hover:text-white" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Title</label>
            <input className="input-dark w-full" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Reminder title" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Due Date</label>
              <input type="date" className="input-dark w-full" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Priority</label>
              <select className="input-dark w-full" value={form.priority} onChange={e => set('priority', e.target.value as Priority)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Related Student</label>
            <select className="input-dark w-full" value={form.related_student_id} onChange={e => set('related_student_id', e.target.value)}>
              <option value="">— None —</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Description</label>
            <textarea className="input-dark w-full resize-none" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Details..." />
          </div>
          {item && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_completed} onChange={e => set('is_completed', e.target.checked)} className="accent-amber-600" />
              <span className="text-stone-300 text-sm">Mark as completed</span>
            </label>
          )}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-stone-800">
          <button onClick={onClose} className="px-4 py-2 text-stone-400 hover:text-white text-sm">Cancel</button>
          <button
            onClick={() => onSave({ ...item, ...form, user_id: userId, related_student_id: form.related_student_id || null, due_date: form.due_date || null })}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-sm"
          >
            <Save className="w-4 h-4" />Save
          </button>
        </div>
      </div>
    </div>
  );
};

const TicklerView: React.FC<{ user: AppUser }> = ({ user }) => {
  const [items, setItems] = useState<TicklerItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; item?: TicklerItem }>({ open: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [itemsRes, studentsRes] = await Promise.all([
      supabase.from('tickler').select('*, student:students(first_name,last_name)').eq('user_id', user.id).order('due_date').order('priority'),
      supabase.from('students').select('*').eq('is_active', true).order('first_name'),
    ]);
    setItems((itemsRes.data ?? []) as TicklerItem[]);
    setStudents((studentsRes.data ?? []) as Student[]);
    setLoading(false);
  };

  const handleSave = async (data: Partial<TicklerItem>) => {
    if (modal.item?.id) {
      await supabase.from('tickler').update(data).eq('id', modal.item.id);
    } else {
      await supabase.from('tickler').insert([{ ...data, user_id: user.id }]);
    }
    setModal({ open: false });
    loadData();
  };

  const toggleComplete = async (item: TicklerItem) => {
    await supabase.from('tickler').update({ is_completed: !item.is_completed }).eq('id', item.id);
    loadData();
  };

  const filtered = items.filter(i => showCompleted ? i.is_completed : !i.is_completed);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-serif text-white">Reminders</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCompleted(s => !s)}
            className={`px-3 py-2 rounded-xl text-sm transition-colors border ${showCompleted ? 'bg-stone-700 border-stone-600 text-white' : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-white'}`}
          >
            {showCompleted ? 'Show Active' : 'Show Completed'}
          </button>
          <button onClick={() => setModal({ open: true })} className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm">
            <Plus className="w-4 h-4" />New Reminder
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-stone-500">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            {showCompleted ? 'No completed reminders' : 'No pending reminders'}
          </div>
        )}
        {filtered.map(item => {
          const isOverdue = !item.is_completed && item.due_date && isPast(parseISO(item.due_date));
          const student = (item as any).student;
          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${item.is_completed ? 'bg-stone-900/50 border-stone-800 opacity-60' : 'bg-stone-800 border-stone-700/50 hover:border-stone-600'}`}
            >
              <button onClick={() => toggleComplete(item)} className="mt-0.5 flex-shrink-0">
                {item.is_completed
                  ? <CheckCircle className="w-5 h-5 text-green-500" />
                  : <Circle className="w-5 h-5 text-stone-500 hover:text-amber-400 transition-colors" />
                }
              </button>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setModal({ open: true, item })}>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-medium ${item.is_completed ? 'text-stone-500 line-through' : 'text-white'}`}>{item.title}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${PRIORITY_STYLES[item.priority]}`}>{item.priority}</span>
                  {isOverdue && <span className="px-2 py-0.5 rounded-full text-xs bg-red-900/40 text-red-400 border border-red-700/40">Overdue</span>}
                </div>
                {item.due_date && (
                  <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-400' : 'text-stone-400'}`}>
                    Due {format(parseISO(item.due_date), 'EEEE, MMM d')}
                  </p>
                )}
                {student && (
                  <p className="text-stone-500 text-xs mt-0.5">{student.first_name} {student.last_name}</p>
                )}
                {item.description && (
                  <p className="text-stone-400 text-xs mt-1 line-clamp-2">{item.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal.open && (
        <TicklerModal
          item={modal.item}
          students={students}
          userId={user.id}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
};

export default TicklerView;
