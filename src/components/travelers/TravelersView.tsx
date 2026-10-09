import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  FileText,
  Eye,
  Trash2,
  Edit2,
  Compass,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Traveler } from '../../types';
import {
  formatPhoneBR,
  maskCPF,
  formatDateBR,
  buildWhatsAppLink,
  isValidCPF,
} from '../../lib/utils';

export const TravelersView: React.FC = () => {
  const {
    travelers,
    trips,
    registrations,
    createTraveler,
    updateTraveler,
    deleteTraveler,
    setSelectedTripId,
    setActiveMenu,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTraveler, setEditingTraveler] = useState<Traveler | null>(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);

  const filteredTravelers = travelers.filter(t => {
    const term = searchTerm.toLowerCase();
    return (
      t.fullName.toLowerCase().includes(term) ||
      t.cpf.includes(term) ||
      t.phone.includes(term) ||
      t.city.toLowerCase().includes(term)
    );
  });

  const handleOpenNew = () => {
    setEditingTraveler(null);
    setIsModalOpen(true);
  };

  const handleEdit = (traveler: Traveler) => {
    setEditingTraveler(traveler);
    setIsModalOpen(true);
  };

  const handleDelete = (traveler: Traveler) => {
    if (confirm(`Deseja remover o cadastro de "${traveler.fullName}"?`)) {
      const res = deleteTraveler(traveler.id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF, telefone ou cidade..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
          />
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" />
          <span>+ Novo Viajante</span>
        </button>
      </div>

      {/* Travelers Table */}
      {filteredTravelers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-800">
            Nenhum viajante encontrado
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Cadastre novos viajantes ou ajuste os termos de busca.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nome Completo</th>
                <th className="py-3 px-3">CPF (LGPD) / RG</th>
                <th className="py-3 px-3">WhatsApp / Contato</th>
                <th className="py-3 px-3">Localização</th>
                <th className="py-3 px-3">Documento</th>
                <th className="py-3 px-3">Viagens Vinculadas</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTravelers.map(t => {
                const travelerRegs = registrations.filter(r => r.travelerId === t.id && r.status !== 'cancelled');

                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{t.fullName}</div>
                      <div className="text-[11px] text-slate-400">
                        Nasc: {formatDateBR(t.birthDate)}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-mono text-slate-700">{maskCPF(t.cpf)}</div>
                      <div className="text-[11px] text-slate-400">{t.rg || 'RG não informado'}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5 font-medium text-slate-900">
                        <span>{formatPhoneBR(t.phone)}</span>
                        {t.phone && (
                          <a
                            href={buildWhatsAppLink(t.phone, `Olá ${t.fullName}, equipe Raon System falando:`)}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100"
                          >
                            WhatsApp
                          </a>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{t.email || '-'}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-slate-800 font-medium">
                        {t.city} - {t.state}
                      </div>
                      {t.emergencyContactName && (
                        <div className="text-[10px] text-slate-500">
                          Emergência: {t.emergencyContactName}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      {t.documentUrl ? (
                        <button
                          onClick={() => setDocumentPreviewUrl(t.documentUrl!)}
                          className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Ver documento</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Não anexado</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {travelerRegs.length === 0 ? (
                          <span className="text-[11px] text-slate-400">Nenhuma viagem ativa</span>
                        ) : (
                          travelerRegs.map(reg => {
                            const trip = trips.find(tp => tp.id === reg.tripId);
                            if (!trip) return null;
                            return (
                              <button
                                key={reg.id}
                                onClick={() => {
                                  setSelectedTripId(trip.id);
                                  setActiveMenu('trips');
                                }}
                                className="rounded-md bg-slate-100 hover:bg-orange-50 hover:text-orange-700 px-2 py-0.5 text-[10px] font-medium text-slate-700 truncate max-w-[140px]"
                                title={`Ver detalhes de ${trip.name}`}
                              >
                                {trip.destination}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(t)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          title="Editar viajante"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="Excluir viajante"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR VIAJANTE */}
      {isModalOpen && (
        <TravelerFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={editingTraveler}
          onSubmit={travelerData => {
            if (editingTraveler) {
              updateTraveler(editingTraveler.id, travelerData);
            } else {
              createTraveler(travelerData);
            }
            setIsModalOpen(false);
          }}
        />
      )}

      {/* MODAL: PREVIEW DOCUMENTO */}
      {documentPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="relative max-w-2xl w-full rounded-2xl bg-white p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-sm text-slate-900">Documento do Viajante</h4>
              <button
                onClick={() => setDocumentPreviewUrl(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold"
              >
                ✕ Fechar
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-xl border border-slate-200">
              <img
                src={documentPreviewUrl}
                alt="Documento"
                className="w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// SUBCOMPONENT: MODAL EDITAR / NOVO VIAJANTE
interface TravelerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Traveler | null;
  onSubmit: (data: Omit<Traveler, 'id' | 'createdAt'>) => void;
}

const TravelerFormModal: React.FC<TravelerFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
}) => {
  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [cpf, setCpf] = useState(initialData?.cpf || '');
  const [rg, setRg] = useState(initialData?.rg || '');
  const [birthDate, setBirthDate] = useState(initialData?.birthDate || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [city, setCity] = useState(initialData?.city || 'Maceió');
  const [state, setState] = useState(initialData?.state || 'AL');
  const [address, setAddress] = useState(initialData?.address || '');
  const [emergencyName, setEmergencyName] = useState(initialData?.emergencyContactName || '');
  const [emergencyPhone, setEmergencyPhone] = useState(initialData?.emergencyContactPhone || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [documentUrl, setDocumentUrl] = useState(initialData?.documentUrl || '');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setDocumentUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !cpf.trim() || !phone.trim()) {
      alert('Nome, CPF e WhatsApp são obrigatórios.');
      return;
    }

    onSubmit({
      fullName: fullName.trim(),
      cpf: cpf.trim(),
      rg: rg.trim(),
      birthDate,
      phone: phone.trim(),
      email: email.trim(),
      city: city.trim(),
      state: state.trim(),
      address: address.trim(),
      emergencyContactName: emergencyName.trim(),
      emergencyContactPhone: emergencyPhone.trim(),
      notes: notes.trim(),
      documentUrl,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-base font-bold text-slate-900">
            {initialData ? 'Editar Cadastro do Viajante' : 'Novo Cadastro de Viajante'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">CPF *</label>
              <input
                type="text"
                required
                value={cpf}
                onChange={e => setCpf(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">RG</label>
              <input
                type="text"
                value={rg}
                onChange={e => setRg(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cidade / UF</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 p-2 text-xs"
                />
                <input
                  type="text"
                  value={state}
                  maxLength={2}
                  onChange={e => setState(e.target.value.toUpperCase())}
                  className="w-12 rounded-xl border border-slate-200 p-2 text-xs text-center"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço</label>
              <input
                type="text"
                placeholder="Rua, número, bairro..."
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contato de Emergência
              </label>
              <input
                type="text"
                placeholder="Nome (Parentesco)"
                value={emergencyName}
                onChange={e => setEmergencyName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone de Emergência
              </label>
              <input
                type="text"
                placeholder="(82) 90000-0000"
                value={emergencyPhone}
                onChange={e => setEmergencyPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs"
              />
            </div>
          </div>

          {/* Document Upload */}
          <div className="border-t border-slate-100 pt-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Documento Anexado (RG, CNH ou Passaporte)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
                <Upload className="h-4 w-4 text-slate-500" />
                <span>Escolher Arquivo</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {documentUrl && (
                <span className="text-xs text-emerald-600 font-semibold">
                  ✓ Documento anexado com sucesso
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações (restrições alimentares, assentos preferenciais, etc.)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs"
            />
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
              Salvar Viajante
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
