import React, { useEffect, useState } from 'react';
import { Plus, Search, DollarSign, X, Save, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Clock, CreditCard, Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BillingRecord, Student, ClientInfo, BillingStatus, PaymentMethod } from '../types';
import { format, parseISO } from 'date-fns';

const STATUS_STYLES: Record<BillingStatus, string> = {
  pending: 'bg-amber-900/40 text-amber-400',
  paid: 'bg-green-900/40 text-green-400',
  overdue: 'bg-red-900/40 text-red-400',
  cancelled: 'bg-stone-700 text-stone-400',
  refunded: 'bg-blue-900/40 text-blue-400',
};

const STATUS_ICONS: Record<BillingStatus, React.FC<{ className?: string }>> = {
  pending: Clock,
  paid: CheckCircle,
  overdue: AlertCircle,
  cancelled: X,
  refunded: CreditCard,
};

interface BillingFormData {
  student_id: string;
  client_id: string;
  amount: string;
  description: string;
  due_date: string;
  paid_date: string;
  status: BillingStatus;
  payment_method: PaymentMethod;
  notes: string;
  invoice_number: string;
}

const defaultForm: BillingFormData = {
  student_id: '', client_id: '', amount: '', description: '',
  due_date: '', paid_date: '', status: 'pending', payment_method: '',
  notes: '', invoice_number: ''
};

const BillingModal: React.FC<{
  record?: BillingRecord;
  students: Student[];
  clients: ClientInfo[];
  onSave: (data: BillingFormData) => void;
  onClose: () => void;
}> = ({ record, students, clients, onSave, onClose }) => {
  const [form, setForm] = useState<BillingFormData>(record ? {
    student_id: record.student_id ?? '',
    client_id: record.client_id ?? '',
    amount: record.amount.toString(),
    description: record.description,
    due_date: record.due_date ?? '',
    paid_date: record.paid_date ?? '',
    status: record.status,
    payment_method: record.payment_method,
    notes: record.notes,
    invoice_number: record.invoice_number,
  } : defaultForm);

  const set = (k: keyof BillingFormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <h2 className="text-white font-medium">{record ? 'Edit Invoice' : 'New Invoice'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-stone-400 hover:text-white" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Student</label>
              <select className="input-dark w-full" value={form.student_id} onChange={e => set('student_id', e.target.value)}>
                <option value="">— Select —</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Invoice #</label>
              <input className="input-dark w-full" value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)} placeholder="INV-001" />
            </div>
          </div>
          <div>
            <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Description</label>
            <input className="input-dark w-full" value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Piano lessons – July 2025" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                <input type="number" step="0.01" min="0" className="input-dark w-full pl-7" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" required />
              </div>
            </div>
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Status</label>
              <select className="input-dark w-full" value={form.status} onChange={e => set('status', e.target.value as BillingStatus)}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Due Date</label>
              <input type="date" className="input-dark w-full" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Paid Date</label>
              <input type="date" className="input-dark w-full" value={form.paid_date} onChange={e => set('paid_date', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Payment Method</label>
            <select className="input-dark w-full" value={form.payment_method} onChange={e => set('payment_method', e.target.value as PaymentMethod)}>
              <option value="">— Not yet paid —</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="stripe">Stripe (Online)</option>
              <option value="stripe_terminal">Stripe Terminal (Tap to Pay)</option>
              <option value="venmo">Venmo</option>
              <option value="zelle">Zelle</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Notes</label>
            <textarea className="input-dark w-full resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes..." />
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

const BillingView: React.FC = () => {
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<BillingStatus | 'all'>('all');
  const [modal, setModal] = useState<{ open: boolean; record?: BillingRecord }>({ open: false });
  const [loading, setLoading] = useState(true);
  const [stripeNote, setStripeNote] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [recordsRes, studentsRes, clientsRes] = await Promise.all([
      supabase.from('billing_records').select('*, student:students(first_name,last_name)').order('created_at', { ascending: false }),
      supabase.from('students').select('*').eq('is_active', true).order('first_name'),
      supabase.from('client_info').select('*, user:users(display_name)').order('id'),
    ]);
    setRecords((recordsRes.data ?? []) as BillingRecord[]);
    setStudents((studentsRes.data ?? []) as Student[]);
    setClients((clientsRes.data ?? []) as ClientInfo[]);
    setLoading(false);
  };

  const handleSave = async (data: BillingFormData) => {
    const payload = {
      student_id: data.student_id || null,
      client_id: data.client_id || null,
      amount: parseFloat(data.amount) || 0,
      description: data.description,
      due_date: data.due_date || null,
      paid_date: data.paid_date || null,
      status: data.status,
      payment_method: data.payment_method,
      notes: data.notes,
      invoice_number: data.invoice_number,
    };
    if (modal.record?.id) {
      await supabase.from('billing_records').update(payload).eq('id', modal.record.id);
    } else {
      await supabase.from('billing_records').insert([payload]);
    }
    setModal({ open: false });
    loadData();
  };

  const markPaid = async (id: string, method: PaymentMethod) => {
    await supabase.from('billing_records').update({
      status: 'paid',
      paid_date: new Date().toISOString().split('T')[0],
      payment_method: method,
    }).eq('id', id);
    loadData();
  };

  const handleStripeCheckout = async (record: BillingRecord) => {
    // Stripe integration notice
    setStripeNote(`Stripe checkout for $${record.amount.toFixed(2)} — configure your Stripe secret key in Supabase Edge Function secrets to enable live payments.`);
    setTimeout(() => setStripeNote(''), 5000);
  };

  const filtered = records.filter(r => {
    const student = (r as any).student;
    const name = student ? `${student.first_name} ${student.last_name}` : '';
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totals = {
    pending: records.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0),
    paid: records.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0),
    overdue: records.filter(r => r.status === 'overdue').reduce((s, r) => s + r.amount, 0),
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-serif text-white">Billing</h1>
        <button onClick={() => setModal({ open: true })} className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm">
          <Plus className="w-4 h-4" />New Invoice
        </button>
      </div>

      {/* Stripe notice */}
      {stripeNote && (
        <div className="p-4 bg-blue-900/30 border border-blue-700/40 rounded-xl text-blue-300 text-sm flex items-start gap-2">
          <CreditCard className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {stripeNote}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-stone-800 border border-stone-700/50 rounded-xl p-4">
          <p className="text-stone-400 text-xs mb-1">Pending</p>
          <p className="text-amber-400 font-bold text-lg">${totals.pending.toFixed(2)}</p>
        </div>
        <div className="bg-stone-800 border border-stone-700/50 rounded-xl p-4">
          <p className="text-stone-400 text-xs mb-1">Paid (all time)</p>
          <p className="text-green-400 font-bold text-lg">${totals.paid.toFixed(2)}</p>
        </div>
        <div className="bg-stone-800 border border-stone-700/50 rounded-xl p-4">
          <p className="text-stone-400 text-xs mb-1">Overdue</p>
          <p className="text-red-400 font-bold text-lg">${totals.overdue.toFixed(2)}</p>
        </div>
      </div>

      {/* Stripe Terminal Notice */}
      <div className="p-4 bg-stone-800 border border-stone-700/50 rounded-xl flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-700/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <p className="text-white text-sm font-medium">Stripe Terminal — Tap to Pay</p>
          <p className="text-stone-400 text-xs">Accept in-person contactless payments via iPhone or Android. Configure your Stripe secret key to activate. https://bolt.new/setup/stripe</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input className="input-dark w-full pl-9" placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-stone-700">
          {(['all', 'pending', 'overdue', 'paid'] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-3 py-2 text-xs capitalize transition-colors ${filterStatus === f ? 'bg-amber-700 text-white' : 'bg-stone-800 text-stone-400 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Records table */}
      <div className="bg-stone-800 border border-stone-700/50 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
            No billing records found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-stone-500 text-xs uppercase tracking-wide border-b border-stone-700 bg-stone-900/40">
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Due</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Method</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-700/30">
                {filtered.map(r => {
                  const StatusIcon = STATUS_ICONS[r.status];
                  const student = (r as any).student;
                  return (
                    <tr key={r.id} className="hover:bg-stone-700/30 transition-colors">
                      <td className="px-4 py-3 text-white">{student ? `${student.first_name} ${student.last_name}` : '—'}</td>
                      <td className="px-4 py-3 text-stone-300 max-w-xs truncate">{r.description}</td>
                      <td className="px-4 py-3 text-right font-medium text-white">${r.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-stone-400">{r.due_date ? format(parseISO(r.due_date), 'MMM d, yyyy') : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs ${STATUS_STYLES[r.status]}`}>
                          <StatusIcon className="w-3 h-3" />{r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-400 text-xs">{r.payment_method || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {r.status === 'pending' && (
                            <>
                              <button onClick={() => markPaid(r.id, 'cash')} className="px-2 py-1 text-xs bg-green-900/30 hover:bg-green-900/60 text-green-400 rounded-lg transition-colors">Cash</button>
                              <button onClick={() => handleStripeCheckout(r)} className="px-2 py-1 text-xs bg-blue-900/30 hover:bg-blue-900/60 text-blue-400 rounded-lg transition-colors flex items-center gap-0.5">
                                <CreditCard className="w-3 h-3" />Pay
                              </button>
                            </>
                          )}
                          <button onClick={() => setModal({ open: true, record: r })} className="px-2 py-1 text-xs bg-stone-700 hover:bg-stone-600 text-stone-300 rounded-lg transition-colors">Edit</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.open && (
        <BillingModal
          record={modal.record}
          students={students}
          clients={clients}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
};

export default BillingView;
