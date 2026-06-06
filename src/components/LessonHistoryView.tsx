import React, { useEffect, useState } from 'react';
import { Plus, Search, BookOpen, Star, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LessonHistory, Student, AppUser } from '../types';
import { format, parseISO } from 'date-fns';

interface HistoryFormData {
  student_id: string;
  lesson_date: string;
  duration_minutes: string;
  topics_covered: string;
  homework: string;
  notes: string;
  rating: string;
}

const defaultForm: HistoryFormData = {
  student_id: '', lesson_date: new Date().toISOString().split('T')[0],
  duration_minutes: '30', topics_covered: '', homework: '', notes: '', rating: ''
};

const HistoryModal: React.FC<{
  record?: LessonHistory;
  students: Student[];
  userId: string;
  onSave: (data: HistoryFormData) => void;
  onClose: () => void;
}> = ({ record, students, userId, onSave, onClose }) => {
  const [form, setForm] = useState<HistoryFormData>(record ? {
    student_id: record.student_id,
    lesson_date: record.lesson_date,
    duration_minutes: record.duration_minutes.toString(),
    topics_covered: record.topics_covered,
    homework: record.homework,
    notes: record.notes,
    rating: record.rating?.toString() ?? '',
  } : defaultForm);

  const set = (k: keyof HistoryFormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <h2 className="text-white font-medium">{record ? 'Edit Lesson Record' : 'Log Lesson'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-stone-400 hover:text-white" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Student</label>
              <select className="input-dark w-full" value={form.student_id} onChange={e => set('student_id', e.target.value)} required>
                <option value="">— Select —</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Date</label>
              <input type="date" className="input-dark w-full" value={form.lesson_date} onChange={e => set('lesson_date', e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Duration (min)</label>
              <select className="input-dark w-full" value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)}>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
              </select>
            </div>
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Rating (1–5)</label>
              <div className="flex gap-1 pt-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => set('rating', n.toString())}
                    className={`w-8 h-8 rounded-lg text-sm transition-colors ${parseInt(form.rating) >= n ? 'bg-amber-600 text-white' : 'bg-stone-700 text-stone-400 hover:bg-stone-600'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Topics Covered</label>
            <textarea className="input-dark w-full resize-none" rows={2} value={form.topics_covered} onChange={e => set('topics_covered', e.target.value)} placeholder="Scales, pieces, theory..." />
          </div>
          <div>
            <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Homework Assigned</label>
            <textarea className="input-dark w-full resize-none" rows={2} value={form.homework} onChange={e => set('homework', e.target.value)} placeholder="Practice assignments..." />
          </div>
          <div>
            <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Notes</label>
            <textarea className="input-dark w-full resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="General observations..." />
          </div>
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

const LessonHistoryView: React.FC<{ user: AppUser }> = ({ user }) => {
  const [records, setRecords] = useState<LessonHistory[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; record?: LessonHistory }>({ open: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [recordsRes, studentsRes] = await Promise.all([
      supabase.from('lesson_history').select('*, student:students(first_name,last_name)').order('lesson_date', { ascending: false }),
      supabase.from('students').select('*').eq('is_active', true).order('first_name'),
    ]);
    setRecords((recordsRes.data ?? []) as LessonHistory[]);
    setStudents((studentsRes.data ?? []) as Student[]);
    setLoading(false);
  };

  const handleSave = async (data: HistoryFormData) => {
    const payload = {
      student_id: data.student_id,
      teacher_id: user.id,
      lesson_date: data.lesson_date,
      duration_minutes: parseInt(data.duration_minutes),
      topics_covered: data.topics_covered,
      homework: data.homework,
      notes: data.notes,
      rating: data.rating ? parseInt(data.rating) : null,
    };
    if (modal.record?.id) {
      await supabase.from('lesson_history').update(payload).eq('id', modal.record.id);
    } else {
      await supabase.from('lesson_history').insert([payload]);
    }
    setModal({ open: false });
    loadData();
  };

  const filtered = records.filter(r => {
    const student = (r as any).student;
    return !search || (student && `${student.first_name} ${student.last_name}`.toLowerCase().includes(search.toLowerCase()));
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-serif text-white">Lesson History</h1>
        <button onClick={() => setModal({ open: true })} className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm">
          <Plus className="w-4 h-4" />Log Lesson
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
        <input className="input-dark w-full pl-9" placeholder="Search by student..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-stone-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            No lesson records found
          </div>
        )}
        {filtered.map(r => {
          const student = (r as any).student;
          return (
            <div key={r.id} className="bg-stone-800 border border-stone-700/50 rounded-2xl p-5 hover:border-stone-600 transition-all cursor-pointer"
              onClick={() => setModal({ open: true, record: r })}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-white font-medium">{student ? `${student.first_name} ${student.last_name}` : '—'}</p>
                  <p className="text-stone-400 text-xs mt-0.5">{format(parseISO(r.lesson_date), 'EEEE, MMMM d, yyyy')} · {r.duration_minutes} min</p>
                </div>
                {r.rating && (
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating! ? 'text-amber-400 fill-amber-400' : 'text-stone-600'}`} />
                    ))}
                  </div>
                )}
              </div>
              {r.topics_covered && (
                <p className="text-stone-400 text-xs mb-1"><span className="text-stone-500">Topics:</span> {r.topics_covered}</p>
              )}
              {r.homework && (
                <p className="text-stone-400 text-xs"><span className="text-stone-500">HW:</span> {r.homework}</p>
              )}
            </div>
          );
        })}
      </div>

      {modal.open && (
        <HistoryModal
          record={modal.record}
          students={students}
          userId={user.id}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
};

export default LessonHistoryView;
