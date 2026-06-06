import React, { useEffect, useState } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2, X, Save, User, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Student, ClientInfo, SkillLevel } from '../types';

const SKILL_COLORS: Record<SkillLevel, string> = {
  beginner: 'bg-emerald-900/40 text-emerald-400',
  intermediate: 'bg-amber-900/40 text-amber-400',
  advanced: 'bg-blue-900/40 text-blue-400',
};

interface StudentFormData {
  first_name: string;
  last_name: string;
  age: string;
  skill_level: SkillLevel;
  lesson_rate: string;
  notes: string;
  is_active: boolean;
  client_id: string;
}

const defaultForm: StudentFormData = {
  first_name: '', last_name: '', age: '', skill_level: 'beginner',
  lesson_rate: '', notes: '', is_active: true, client_id: ''
};

interface StudentModalProps {
  student?: Student;
  clients: ClientInfo[];
  onSave: (data: StudentFormData) => void;
  onClose: () => void;
}

const StudentModal: React.FC<StudentModalProps> = ({ student, clients, onSave, onClose }) => {
  const [form, setForm] = useState<StudentFormData>(student ? {
    first_name: student.first_name,
    last_name: student.last_name,
    age: student.age?.toString() ?? '',
    skill_level: student.skill_level,
    lesson_rate: student.lesson_rate.toString(),
    notes: student.notes,
    is_active: student.is_active,
    client_id: student.client_id ?? '',
  } : defaultForm);

  const set = (k: keyof StudentFormData, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <h2 className="text-white font-medium">{student ? 'Edit Student' : 'New Student'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-stone-400 hover:text-white" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">First Name</label>
              <input className="input-dark w-full" value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="First" required />
            </div>
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Last Name</label>
              <input className="input-dark w-full" value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Last" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Age</label>
              <input type="number" className="input-dark w-full" value={form.age} onChange={e => set('age', e.target.value)} placeholder="Age" min="0" max="99" />
            </div>
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Skill Level</label>
              <select className="input-dark w-full" value={form.skill_level} onChange={e => set('skill_level', e.target.value as SkillLevel)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Lesson Rate ($/lesson)</label>
            <input type="number" step="0.01" className="input-dark w-full" value={form.lesson_rate} onChange={e => set('lesson_rate', e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Parent/Client</label>
            <select className="input-dark w-full" value={form.client_id} onChange={e => set('client_id', e.target.value)}>
              <option value="">— No client linked —</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.user?.display_name ?? c.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Notes</label>
            <textarea className="input-dark w-full resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes..." />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="accent-amber-600" />
            <span className="text-stone-300 text-sm">Active student</span>
          </label>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-stone-800">
          <button onClick={onClose} className="px-4 py-2 text-stone-400 hover:text-white text-sm">Cancel</button>
          <button onClick={() => onSave(form)} className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-sm">
            <Save className="w-4 h-4" />Save
          </button>
        </div>
      </div>
    </div>
  );
};

const StudentsView: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('active');
  const [modal, setModal] = useState<{ open: boolean; student?: Student }>({ open: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [studentsRes, clientsRes] = await Promise.all([
      supabase.from('students').select('*, client:client_info(*, user:users(display_name))').order('first_name'),
      supabase.from('client_info').select('*, user:users(display_name)').order('id'),
    ]);
    setStudents((studentsRes.data ?? []) as Student[]);
    setClients((clientsRes.data ?? []) as ClientInfo[]);
    setLoading(false);
  };

  const handleSave = async (data: StudentFormData) => {
    const payload = {
      first_name: data.first_name,
      last_name: data.last_name,
      age: data.age ? parseInt(data.age) : null,
      skill_level: data.skill_level,
      lesson_rate: parseFloat(data.lesson_rate) || 0,
      notes: data.notes,
      is_active: data.is_active,
      client_id: data.client_id || null,
    };
    if (modal.student?.id) {
      await supabase.from('students').update(payload).eq('id', modal.student.id);
    } else {
      await supabase.from('students').insert([payload]);
    }
    setModal({ open: false });
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this student?')) return;
    await supabase.from('students').delete().eq('id', id);
    loadData();
  };

  const filtered = students.filter(s => {
    const matchSearch = `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase());
    const matchActive = filterActive === 'all' || (filterActive === 'active' ? s.is_active : !s.is_active);
    return matchSearch && matchActive;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-serif text-white">Students</h1>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm"
        >
          <Plus className="w-4 h-4" />Add Student
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input
            className="input-dark w-full pl-9"
            placeholder="Search students..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-stone-700">
          {(['active', 'inactive', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilterActive(f)}
              className={`px-3 py-2 text-xs capitalize transition-colors ${filterActive === f ? 'bg-amber-700 text-white' : 'bg-stone-800 text-stone-400 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-stone-500">
            <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
            No students found
          </div>
        )}
        {filtered.map(s => (
          <div key={s.id} className="bg-stone-800 border border-stone-700/50 rounded-2xl p-5 hover:border-stone-600 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white font-medium">{s.first_name} {s.last_name}</h3>
                {s.age && <p className="text-stone-400 text-xs mt-0.5">Age {s.age}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => setModal({ open: true, student: s })} className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-stone-700 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-stone-700 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs ${SKILL_COLORS[s.skill_level]}`}>{s.skill_level}</span>
              {s.lesson_rate > 0 && <span className="px-2 py-0.5 rounded-full text-xs bg-stone-700 text-stone-300">${s.lesson_rate}/lesson</span>}
              {!s.is_active && <span className="px-2 py-0.5 rounded-full text-xs bg-stone-700 text-stone-500">Inactive</span>}
            </div>
            {s.notes && <p className="text-stone-500 text-xs mt-2 line-clamp-2">{s.notes}</p>}
          </div>
        ))}
      </div>

      {modal.open && (
        <StudentModal
          student={modal.student}
          clients={clients}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
};

export default StudentsView;
