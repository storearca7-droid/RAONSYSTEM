import React, { useState, useEffect } from 'react';
import { X, Image, Compass } from 'lucide-react';
import { Trip, TripCategory, TripStatus } from '../../types';
import { slugify } from '../../lib/utils';

interface TripFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tripData: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Trip | null;
}

const CATEGORIES: TripCategory[] = [
  'Excursão',
  'Passeio',
  'Praia',
  'Cultural',
  'Religioso',
  'Corporativo',
  'Internacional',
  'Nacional',
  'Aventura',
  'Outro',
];

const PRESET_IMAGES = [
  { label: 'Maragogi e Praias', url: '/src/assets/images/trip_beach_maragogi_1791434573087.jpg' },
  { label: 'Histórico & Cultural', url: '/src/assets/images/trip_cultural_colonial_1791434591937.jpg' },
  { label: 'Cachoeira & Ecoturismo', url: '/src/assets/images/trip_adventure_waterfall_1791434600106.jpg' },
];

export const TripFormModal: React.FC<TripFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [destination, setDestination] = useState('');
  const [category, setCategory] = useState<TripCategory>('Excursão');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [departureTime, setDepartureTime] = useState('06:00');
  const [departureLocation, setDepartureLocation] = useState('');
  const [arrivalLocation, setArrivalLocation] = useState('');
  const [transportType, setTransportType] = useState('Ônibus Leito Turismo com ar-condicionado');
  const [flightNumber, setFlightNumber] = useState('');
  const [gatheringTime, setGatheringTime] = useState('05:30');
  const [returnTime, setReturnTime] = useState('14:00');
  const [returnArrivalLocation, setReturnArrivalLocation] = useState('');
  const [capacity, setCapacity] = useState(40);
  const [responsible, setResponsible] = useState('Dinho Oliveira');
  const [pricePerPerson, setPricePerPerson] = useState(1200);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<TripStatus>('publicada');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSlug(initialData.slug);
      setDestination(initialData.destination);
      setCategory(initialData.category);
      setDescription(initialData.description || '');
      setImageUrl(initialData.imageUrl || '');
      setDepartureDate(initialData.departureDate);
      setReturnDate(initialData.returnDate);
      setDepartureTime(initialData.departureTime || '06:00');
      setDepartureLocation(initialData.departureLocation);
      setArrivalLocation(initialData.arrivalLocation);
      setTransportType(initialData.transportType || 'Ônibus Leito Turismo com ar-condicionado');
      setFlightNumber(initialData.flightNumber || '');
      setGatheringTime(initialData.gatheringTime || '05:30');
      setReturnTime(initialData.returnTime || '14:00');
      setReturnArrivalLocation(initialData.returnArrivalLocation || '');
      setCapacity(initialData.capacity);
      setResponsible(initialData.responsible || 'Dinho Oliveira');
      setPricePerPerson(initialData.pricePerPerson);
      setNotes(initialData.notes || '');
      setStatus(initialData.status);
    } else {
      setName('');
      setSlug('');
      setDestination('');
      setCategory('Excursão');
      setDescription('');
      setImageUrl(PRESET_IMAGES[0].url);
      setDepartureDate('');
      setReturnDate('');
      setDepartureTime('06:00');
      setDepartureLocation('Posto Central / Sede Dinho Tour');
      setArrivalLocation('Hotel ou Pousada no Destino');
      setTransportType('Ônibus Leito Turismo com ar-condicionado');
      setFlightNumber('');
      setGatheringTime('05:30');
      setReturnTime('14:00');
      setReturnArrivalLocation('');
      setCapacity(40);
      setResponsible('Dinho Oliveira');
      setPricePerPerson(1200);
      setNotes('');
      setStatus('publicada');
    }
  }, [initialData, isOpen]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!initialData) {
      setSlug(slugify(val));
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !destination.trim() || !departureDate || !returnDate) {
      alert('Por favor, preencha todos os campos obrigatórios (Nome, Destino e Datas).');
      return;
    }

    onSubmit({
      name: name.trim(),
      slug: slug || slugify(name),
      destination: destination.trim(),
      category,
      description,
      imageUrl,
      departureDate,
      returnDate,
      departureTime,
      departureLocation,
      arrivalLocation,
      transportType,
      flightNumber: flightNumber.trim() || undefined,
      gatheringTime,
      returnTime,
      returnArrivalLocation: returnArrivalLocation.trim() || undefined,
      capacity: Number(capacity) || 1,
      responsible,
      pricePerPerson: Number(pricePerPerson) || 0,
      notes,
      status,
      inclusions: initialData?.inclusions || [
        'Transporte em Ônibus Leito Turismo com ar-condicionado',
        'Hospedagem com café da manhã incluso',
        'Guia de Turismo credenciado Cadastur',
        'Seguro Viagem Nacional',
      ],
      exclusions: initialData?.exclusions || [
        'Refeições e bebidas extras não listadas',
        'Despesas pessoais',
      ],
      itinerary: initialData?.itinerary || [],
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialData ? 'Editar Viagem' : 'Cadastrar Nova Viagem'}
              </h3>
              <p className="text-xs text-slate-500">
                Preencha os dados operacionais e financeiros da viagem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Seção 1: Identificação Básica */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              1. Identificação Principal
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Viagem *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Excursão Maragogi & Piscinas Naturais 2026"
                  value={name}
                  onChange={handleNameChange}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destino Principal *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Maragogi, AL"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as TripCategory)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:border-orange-500 focus:outline-hidden"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Slug do Link Público
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  <span className="shrink-0 text-slate-400">dinhotour.com.br/viagem/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => setSlug(slugify(e.target.value))}
                    className="ml-1 w-full bg-transparent font-medium text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Imagem de Destaque */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              2. Imagem Principal da Viagem
            </h4>
            <div className="space-y-3">
              {/* Presets */}
              <div className="flex flex-wrap gap-2">
                {PRESET_IMAGES.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setImageUrl(img.url)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                      imageUrl === img.url
                        ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {img.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Ou cole a URL da imagem aqui..."
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-orange-500 focus:outline-hidden"
                />
                <label className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
                  <Image className="h-4 w-4 text-slate-500" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {imageUrl && (
                <div className="relative h-32 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  <img
                    src={imageUrl}
                    alt="Pré-visualização"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Seção 3: Datas, Horários e Locais */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              3. Datas, Horários & Embarque
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data de Saída *
                </label>
                <input
                  type="date"
                  required
                  value={departureDate}
                  onChange={e => setDepartureDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data de Retorno *
                </label>
                <input
                  type="date"
                  required
                  value={returnDate}
                  onChange={e => setReturnDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Horário de Saída
                </label>
                <input
                  type="time"
                  value={departureTime}
                  onChange={e => setDepartureTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Local de Embarque
                </label>
                <input
                  type="text"
                  placeholder="Ex: Posto Tigre - Av. Fernandes Lima, Maceió"
                  value={departureLocation}
                  onChange={e => setDepartureLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Local de Desembarque / Hospedagem
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pousada Sol & Mar - Maragogi"
                  value={arrivalLocation}
                  onChange={e => setArrivalLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              {/* Informações detalhadas de transporte e voo */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Transporte / Veículo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ônibus Leito Turismo com ar-condicionado e Wi-Fi"
                  value={transportType}
                  onChange={e => setTransportType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nº do Voo / Cia Aérea (se aplicável)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Voo GOL G3 1482 / LA 3420"
                  value={flightNumber}
                  onChange={e => setFlightNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Horário de Apresentação / Concentração
                </label>
                <input
                  type="time"
                  value={gatheringTime}
                  onChange={e => setGatheringTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Horário Previsto de Saída do Retorno
                </label>
                <input
                  type="time"
                  value={returnTime}
                  onChange={e => setReturnTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Local Previsto de Chegada do Retorno
                </label>
                <input
                  type="text"
                  placeholder="Ex: Posto Tigre - Chegada às 17:30"
                  value={returnArrivalLocation}
                  onChange={e => setReturnArrivalLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-orange-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Seção 4: Capacidade, Preço e Status */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              4. Vagas, Valores & Responsável
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Capacidade Total (Vagas) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={capacity}
                  onChange={e => setCapacity(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold tabular-nums focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preço por Viajante (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={pricePerPerson}
                  onChange={e => setPricePerPerson(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold tabular-nums focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Responsável
                </label>
                <input
                  type="text"
                  value={responsible}
                  onChange={e => setResponsible(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status da Viagem
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as TripStatus)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:border-orange-500 focus:outline-hidden"
                >
                  <option value="publicada">Publicada</option>
                  <option value="rascunho">Rascunho</option>
                  <option value="encerrada">Encerrada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
            </div>
          </div>

          {/* Descrição e Observações */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descrição da Viagem
              </label>
              <textarea
                rows={3}
                placeholder="Apresentação atrativa para os viajantes..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observações Internas (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Levar calçado aquático, taxa ambiental inclusa, etc."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-orange-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-orange-700 transition-colors"
            >
              {initialData ? 'Salvar Alterações' : 'Criar Viagem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
