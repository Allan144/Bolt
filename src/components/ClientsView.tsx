import React, { useEffect, useState } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2, X, Save, Users, Phone, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ClientInfo } from '../types';

interface ClientFormData {
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  emergency_contact: string;
  notes: string;
  display_name: string;
  email: string;
}

const defaultForm: ClientFormData = {
  phone: '', address: '', city: '', state: '', zip: '',
  emergency_contact: '', notes: '', display_name: '', email: ''
};

interface ClientModalProps {
  client?: ClientInfo;
  onSave: (data: ClientFormData) => void;
  onClose: () => void;
}

const ClientModal: React.FC<ClientModalProps> = ({ client, onSave, onClose }) => {
  const [form, setForm] = useState<ClientFormData>(client ? {
    phone: client.phone,
    address: client.address,
    city: client.city,
    state: client.state,
    zip: client.zip,
    emergency_contact: client.emergency_contact,
    notes: client.notes,
    display_name: client.user?.display_name ?? '',
    email: client.user?.email ?? '',
  } : defaultForm);

  const set = (k: keyof ClientFormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <h2 className="text-white font-medium">{client ? 'Edit Client' : 'New Client'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-stone-400 hover:text-white" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Display Name</label>
              <input className="input-dark w-full" value={form.display_name} onChange={e => set('display_name', e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Email</label>
              <input type="email" className="input-dark w-full" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
            </div>
          </div>
          <div>
            <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Phone</label>
            <input className="input-dark w-full" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 555-5555" />
          </div>
          <div>
            <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Address</label>
            <input className="input-dark w-full" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">City</label>
              <input className="input-dark w-full" value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" />
            </div>
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">State</label>
              <input className="input-dark w-full" value={form.state} onChange={e => set('state', e.target.value)} placeholder="ST" maxLength={2} />
            </div>
            <div>
              <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">ZIP</label>
              <input className="input-dark w-full" value={form.zip} onChange={e => set('zip', e.target.value)} placeholder="00000" />
            </div>
          </div>
          <div>
            <label className="text-stone-400 text-xs uppercase tracking-wide block mb-1.5">Emergency Contact</label>
            <input className="input-dark w-full" value={form.emergency_contact} onChange={e => set('emergency_contact', e.target.value)} placeholder="Name & phone" />
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

const ClientsView: React.FC = () => {
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; client?: ClientInfo }>({ open: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data } = await supabase.from('client_info').select('*, user:users(display_name, email)').order('id');
    setClients((data ?? []) as ClientInfo[]);
    setLoading(false);
  };

  const handleSave = async (data: ClientFormData) => {
    if (modal.client?.id) {
      await supabase.from('client_info').update({
        phone: data.phone, address: data.address, city: data.city,
        state: data.state, zip: data.zip, emergency_contact: data.emergency_contact, notes: data.notes
      }).eq('id', modal.client.id);
    } else {
      // Create a new client without a linked auth user (standalone contact)
      await supabase.from('client_info').insert([{
        phone: data.phone, address: data.address, city: data.city,
        state: data.state, zip: data.zip, emergency_contact: data.emergency_contact, notes: data.notes
      }]);
    }
    setModal({ open: false });
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client record?')) return;
    await supabase.from('client_info').delete().eq('id', id);
    loadData();
  };

  const filtered = clients.filter(c => {
    const name = c.user?.display_name ?? '';
    return name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-serif text-white">Clients</h1>
        <button onClick={() => setModal({ open: true })} className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm">
          <Plus className="w-4 h-4" />Add Client
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
        <input className="input-dark w-full pl-9" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-stone-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            No clients found
          </div>
        )}
        {filtered.map(c => (
          <div key={c.id} className="bg-stone-800 border border-stone-700/50 rounded-2xl p-5 hover:border-stone-600 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white font-medium">{c.user?.display_name ?? 'Unnamed Client'}</h3>
                {c.user?.email && <p className="text-stone-400 text-xs mt-0.5">{c.user.email}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => setModal({ open: true, client: c })} className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-stone-700 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-stone-700 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {c.phone && (
              <p className="flex items-center gap-1.5 text-stone-400 text-xs mb-1">
                <Phone className="w-3 h-3" />{c.phone}
              </p>
            )}
            {(c.city || c.state) && (
              <p className="flex items-center gap-1.5 text-stone-400 text-xs">
                <MapPin className="w-3 h-3" />{[c.city, c.state].filter(Boolean).join(', ')}
              </p>
            )}
            {c.notes && <p className="text-stone-500 text-xs mt-2 line-clamp-2">{c.notes}</p>}
          </div>
        ))}
      </div>

      {modal.open && (
        <ClientModal
          client={modal.client}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
};

export default ClientsView;
