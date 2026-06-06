import React, { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/interaction';
import { Plus, X, Save, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CalendarEvent, Student, LessonType, EventStatus, AppUser } from '../types';
import { format, parseISO } from 'date-fns';

interface CalendarViewProps {
  user: AppUser;
}

const LESSON_COLORS: Record<LessonType, string> = {
  private: '#b45309',
  group: '#1d4ed8',
  recital: '#7c3aed',
  makeup: '#0f766e',
  trial: '#b45309',
};

const EventModal: React.FC<{
  event?: Partial<CalendarEvent>;
  students: Student[];
  userId: string;
  onSave: (evt: Partial<CalendarEvent>) => void;
  onDelete?: () => void;
  onClose: () => void;
}> = ({ event, students, userId, onSave, onDelete, onClose }) => {
  const [form, setForm] = useState({
    title: event?.title ?? '',
    student_id: event?.student_id ?? '',
    start_time: event?.start_time ? event.start_time.slice(0, 16) : '',
    end_time: event?.end_time ? event.end_time.slice(0, 16) : '',
    lesson_type: (event?.lesson_type ?? 'private') as LessonType,
    status: (event?.status ?? 'scheduled') as EventStatus,
    notes: event?.notes ?? '',
    color: event?.color ?? '#b45309',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title || !form.start_time || !form.end_time) return;
    onSave({
      ...event,
      ...form,
      teacher_id: userId,
      color: LESSON_COLORS[form.lesson_type],
      student_id: form.student_id || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <h2 className="text-white font-medium">{event?.id ? 'Edit Lesson' : 'New Lesson'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-stone-400 hover:text-white" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Title</label>
            <input className="input-dark w-full" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Lesson title" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Type</label>
              <select className="input-dark w-full" value={form.lesson_type} onChange={e => set('lesson_type', e.target.value)}>
                <option value="private">Private</option>
                <option value="group">Group</option>
                <option value="recital">Recital</option>
                <option value="makeup">Makeup</option>
                <option value="trial">Trial</option>
              </select>
            </div>
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Status</label>
              <select className="input-dark w-full" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Student</label>
            <select className="input-dark w-full" value={form.student_id} onChange={e => set('student_id', e.target.value)}>
              <option value="">— Select student —</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Start</label>
              <input type="datetime-local" className="input-dark w-full" value={form.start_time} onChange={e => set('start_time', e.target.value)} />
            </div>
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">End</label>
              <input type="datetime-local" className="input-dark w-full" value={form.end_time} onChange={e => set('end_time', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Notes</label>
            <textarea className="input-dark w-full resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes..." />
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-800 gap-3">
          {onDelete ? (
            <button onClick={onDelete} className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm"><Trash2 className="w-4 h-4" />Delete</button>
          ) : <div />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-stone-400 hover:text-white text-sm">Cancel</button>
            <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-sm">
              <Save className="w-4 h-4" />Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CalendarView: React.FC<CalendarViewProps> = ({ user }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [modalEvent, setModalEvent] = useState<Partial<CalendarEvent> | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [eventsRes, studentsRes] = await Promise.all([
      supabase.from('calendar_events').select('*').order('start_time'),
      supabase.from('students').select('*').eq('is_active', true).order('first_name'),
    ]);
    setEvents((eventsRes.data ?? []) as CalendarEvent[]);
    setStudents((studentsRes.data ?? []) as Student[]);
  };

  const fcEvents = events.map(e => ({
    id: e.id,
    title: e.title,
    start: e.start_time,
    end: e.end_time,
    backgroundColor: e.color || '#b45309',
    borderColor: e.color || '#b45309',
    extendedProps: e,
  }));

  const handleDateSelect = (info: DateSelectArg) => {
    setModalEvent({
      start_time: info.startStr,
      end_time: info.endStr,
    });
    setShowModal(true);
  };

  const handleEventClick = (info: EventClickArg) => {
    setModalEvent(info.event.extendedProps as CalendarEvent);
    setShowModal(true);
  };

  const handleEventDrop = async (info: EventDropArg) => {
    const { id } = info.event;
    const start = info.event.startStr;
    const end = info.event.endStr;
    await supabase.from('calendar_events').update({ start_time: start, end_time: end }).eq('id', id);
    loadData();
  };

  const handleSave = async (data: Partial<CalendarEvent>) => {
    if (data.id) {
      await supabase.from('calendar_events').update(data).eq('id', data.id);
    } else {
      await supabase.from('calendar_events').insert([{ ...data, teacher_id: user.id }]);
    }
    setShowModal(false);
    setModalEvent(null);
    loadData();
  };

  const handleDelete = async () => {
    if (modalEvent?.id) {
      await supabase.from('calendar_events').delete().eq('id', modalEvent.id);
      setShowModal(false);
      setModalEvent(null);
      loadData();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-serif text-white">Calendar</h1>
        <button
          onClick={() => { setModalEvent({}); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm"
        >
          <Plus className="w-4 h-4" />New Lesson
        </button>
      </div>

      <div className="flex-1 bg-stone-800 border border-stone-700/50 rounded-2xl p-4 overflow-hidden lce-calendar">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          height="100%"
          events={fcEvents}
          selectable
          editable
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          allDaySlot={false}
          nowIndicator
          businessHours={{ daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: '08:00', endTime: '20:00' }}
        />
      </div>

      {showModal && (
        <EventModal
          event={modalEvent ?? {}}
          students={students}
          userId={user.id}
          onSave={handleSave}
          onDelete={modalEvent?.id ? handleDelete : undefined}
          onClose={() => { setShowModal(false); setModalEvent(null); }}
        />
      )}
    </div>
  );
};

export default CalendarView;
