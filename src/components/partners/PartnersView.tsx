import React, { useState } from 'react';
import {
  Handshake,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Edit2,
  ExternalLink,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Partner, PartnerCategory } from '../../types';
import { formatPhoneBR, buildWhatsAppLink } from '../../lib/utils';

const CATEGORIES: PartnerCategory[] = [
  'Transportadora',
  'Hotel / Pousada',
  'Guia de Turismo',
  'Restaurante',
  'Agência Parceira',
  'Empresa de Passeios',
  'Seguradora',
  'Outro',
];

export const PartnersView: React.FC = () => {
  const { partners, expenses, createPartner, updatePartner, deletePartner } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | PartnerCategory>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  const filteredPartners = partners.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(term) ||
      p.responsibleName.toLowerCase().includes(term) ||
      p.city.toLowerCase().includes(term);
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleOpenNew = () => {
    setEditingPartner(null);
    setIsModalOpen(true);
  };

  const handleEdit = (p: Partner) => {
    setEditingPartner(p);
    setIsModalOpen(true);
  };

  const handleDelete = (p: Partner) => {
    if (confirm(`Deseja excluir o parceiro "${p.name}"?`)) {
      const res = deletePartner(p.id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Filter and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar parceiros por nome, cidade ou responsável..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">Todas Categorias</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" />
          <span>+ Novo Parceiro</span>
        </button>
      </div>

      {/* Partners Grid */}
      {filteredPartners.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Handshake className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-800">
            Nenhum parceiro cadastrado
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Cadastre transportadoras, hotéis, guias de turismo e restaurantes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map(p => {
            const partnerExpensesCount = expenses.filter(e => e.partnerId === p.id).length;

            return (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                      {p.category}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(p)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-slate-800"
                        title="Editar"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="mt-2 text-base font-bold text-slate-900">{p.name}</h3>
                  <p className="text-xs text-slate-500">Contato: {p.responsibleName}</p>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{formatPhoneBR(p.phone)}</span>
                    </div>

                    {p.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{p.email}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        {p.city} - {p.state}
                      </span>
                    </div>
                  </div>

                  {p.notes && (
                    <div className="mt-3 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-600">
                      {p.notes}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {partnerExpensesCount} serviços contratados
                  </span>

                  <a
                    href={buildWhatsAppLink(
                      p.whatsapp || p.phone,
                      `Olá ${p.responsibleName}, contato da Raon System:`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700"
                  >
                    <span>Falar no WhatsApp</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR PARCEIRO */}
      {isModalOpen && (
        <PartnerFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={editingPartner}
          onSubmit={partnerData => {
            if (editingPartner) {
              updatePartner(editingPartner.id, partnerData);
            } else {
              createPartner(partnerData);
            }
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

interface PartnerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Partner | null;
  onSubmit: (data: Omit<Partner, 'id' | 'createdAt'>) => void;
}

const PartnerFormModal: React.FC<PartnerFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState<PartnerCategory>(initialData?.category || 'Transportadora');
  const [responsibleName, setResponsibleName] = useState(initialData?.responsibleName || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [whatsapp, setWhatsapp] = useState(initialData?.whatsapp || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [city, setCity] = useState(initialData?.city || 'Maceió');
  const [state, setState] = useState(initialData?.state || 'AL');
  const [address, setAddress] = useState(initialData?.address || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !responsibleName.trim() || !phone.trim()) {
      alert('Nome da empresa, responsável e telefone são obrigatórios.');
      return;
    }

    onSubmit({
      name: name.trim(),
      category,
      responsibleName: responsibleName.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      email: email.trim(),
      city: city.trim(),
      state: state.trim(),
      address: address.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-base font-bold text-slate-900">
            {initialData ? 'Editar Parceiro' : 'Cadastrar Novo Parceiro'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome da Empresa / Parceiro *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Categoria *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as PartnerCategory)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Responsável *
              </label>
              <input
                type="text"
                required
                value={responsibleName}
                onChange={e => setResponsibleName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone Comercial *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WhatsApp
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cidade</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">UF</label>
              <input
                type="text"
                maxLength={2}
                value={state}
                onChange={e => setState(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs text-center"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observações do Contrato / Frota
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-orange-600 px-5 py-2 text-xs font-semibold text-white hover:bg-orange-700"
            >
              Salvar Parceiro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
