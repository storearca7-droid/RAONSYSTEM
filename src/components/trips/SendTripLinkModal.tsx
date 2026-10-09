import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  QrCode,
  Bus,
  Sparkles,
  CreditCard,
  FileText,
  Users,
  Smartphone,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { Trip } from '../../types';
import {
  formatBRL,
  formatDateRangeBR,
  buildWhatsAppLink,
  calculateTripOccupancy,
} from '../../lib/utils';
import { useApp } from '../../context/AppContext';

interface SendTripLinkModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onOpenPublicView: (slug: string) => void;
}

export const SendTripLinkModal: React.FC<SendTripLinkModalProps> = ({
  trip,
  isOpen,
  onClose,
  onOpenPublicView,
}) => {
  const { registrations, settings } = useApp();
  const [copiedType, setCopiedType] = useState<'link' | 'msg_full' | 'msg_short' | 'portal' | null>(null);
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'link' | 'qrcode'>('whatsapp');

  if (!isOpen) return null;

  const occ = calculateTripOccupancy(trip, registrations);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  
  // Registration link that leads directly to the "Quero Viajar" page
  const tripUrl = `${origin}${pathname}?viagem=${trip.slug}`;
  // Portal link for passengers who are already booked to check boarding with their CPF
  const portalUrl = `${origin}${pathname}?portal=${trip.slug}`;

  // Complete enticing invitation message for WhatsApp
  const fullWhatsAppMessage = `🌟 *CONVITE ESPECIAL: VIAGEM PARA ${trip.destination.toUpperCase()}!* 🚌✨

Olá! Venha viajar com a *${settings.agencyName || 'Raon System'}* para *${trip.name}*!

🗓 *Datas:* ${formatDateRangeBR(trip.departureDate, trip.returnDate)}
⏰ *Horário de Saída:* ${trip.departureTime}
📍 *Ponto de Embarque:* ${trip.departureLocation}
💰 *Valor por pessoa:* ${formatBRL(trip.pricePerPerson)}
💳 *Formas de Pagamento:* Pix, Cartão de Crédito (até 12x), Boleto ou Negocie diretamente com o operador!

👉 *Clique no link para ver fotos, programação e RESERVAR sua vaga:*
${tripUrl}

${occ.availableSlots <= 5 ? `⚠️ *Atenção:* Restam apenas ${occ.availableSlots} vagas!` : 'Garanta logo a sua vaga!'}`;

  // Short direct message
  const shortWhatsAppMessage = `Olá! 🚌 Venha com a gente para *${trip.name}* (${formatDateRangeBR(trip.departureDate, trip.returnDate)}) por apenas ${formatBRL(trip.pricePerPerson)}! 
Cadastre seus dados e escolha o pagamento (Pix, Cartão, Boleto ou com o operador) no link: ${tripUrl}`;

  const handleCopy = (text: string, type: 'link' | 'msg_full' | 'msg_short' | 'portal') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleOpenWhatsApp = (text: string) => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    tripUrl
  )}&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="relative border-b border-slate-100 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-white/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                  Link de Adesão & Inscrição
                </span>
                <span className="text-xs text-orange-100 font-medium">
                  {occ.availableSlots} vagas livres
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                Enviar Link da Viagem ao Cliente
              </h2>
              <p className="text-xs sm:text-sm text-orange-100 line-clamp-1">
                {trip.name} · {trip.destination}
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Explanation Banner */}
          <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4 text-xs sm:text-sm text-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-orange-950">
              <Sparkles className="h-4 w-4 text-orange-600 shrink-0" />
              <span>Como o cliente utiliza este link?</span>
            </div>
            <p className="leading-relaxed text-slate-600 text-xs">
              Quando o cliente clicar no link, ele verá a <strong>página oficial da viagem</strong> com fotos, fotos dos produtos, roteiro dia a dia, e o botão <strong>"Quero Viajar / Reservar Agora"</strong>. Ele preenche Nome, CPF, WhatsApp, e escolhe a forma de pagamento: <strong>Pix</strong>, <strong>Cartão de Crédito</strong>, <strong>Boleto</strong> ou <strong>Negociar diretamente com você</strong>.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'whatsapp'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              <span>Enviar via WhatsApp</span>
            </button>
            <button
              onClick={() => setActiveTab('link')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'link'
                  ? 'bg-white text-orange-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Copy className="h-4 w-4 text-orange-600" />
              <span>Copiar Link Direto</span>
            </button>
            <button
              onClick={() => setActiveTab('qrcode')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'qrcode'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="h-4 w-4 text-slate-700" />
              <span>QR Code na Tela</span>
            </button>
          </div>

          {/* TAB 1: WHATSAPP */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              {/* Option A: Full Message */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4.5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                    Mensagem Completa (Recomendada)
                  </span>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                    Com fotos, roteiro e link
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 font-mono whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto border border-slate-200/60 select-all">
                  {fullWhatsAppMessage}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleOpenWhatsApp(fullWhatsAppMessage)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 shadow-sm transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Abrir e Enviar no WhatsApp</span>
                  </button>

                  <button
                    onClick={() => handleCopy(fullWhatsAppMessage, 'msg_full')}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 px-3 transition-colors"
                  >
                    {copiedType === 'msg_full' ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-700">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 text-slate-400" />
                        <span>Copiar Texto</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Option B: Short Direct Message */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-600 block">
                  Mensagem Curta e Objetiva
                </span>
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {shortWhatsAppMessage}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenWhatsApp(shortWhatsAppMessage)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-3 transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Enviar Texto Curto</span>
                  </button>
                  <button
                    onClick={() => handleCopy(shortWhatsAppMessage, 'msg_short')}
                    className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 text-xs"
                    title="Copiar texto curto"
                  >
                    {copiedType === 'msg_short' ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIRECT LINK */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Link Direto da Página da Viagem (Inscrição & Pagamento)
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    Cole no Instagram, e-mail, grupo de amigos ou envie no chat:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={tripUrl}
                      onClick={e => (e.target as HTMLInputElement).select()}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:outline-hidden"
                    />
                    <button
                      onClick={() => handleCopy(tripUrl, 'link')}
                      className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold shadow-xs transition-colors shrink-0 ${
                        copiedType === 'link'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-orange-600 hover:bg-orange-700 text-white'
                      }`}
                    >
                      {copiedType === 'link' ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Link Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Link ativo e pronto para compartilhamento</span>
                  </div>
                  <button
                    onClick={() => onOpenPublicView(trip.slug)}
                    className="flex items-center gap-1 text-orange-600 hover:text-orange-700 font-bold"
                  >
                    <span>Abrir e testar agora</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Portal link info */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                    <Bus className="h-3.5 w-3.5 text-orange-600" />
                    Link do Portal do Viajante (Para quem já é passageiro)
                  </span>
                  <button
                    onClick={() => handleCopy(portalUrl, 'portal')}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700"
                  >
                    {copiedType === 'portal' ? 'Copiado!' : 'Copiar Link do Portal'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Envie este outro link para quem já se inscreveu e precisa consultar sua vaga digitando o CPF, ver se o pagamento está quitado, consultar horários e confirmar embarque.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: QR CODE */}
          {activeTab === 'qrcode' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-4 shadow-2xs">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  QR Code para Escanear no Celular
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mostre na recepção ou em atendimento presencial para o cliente apontar a câmera do celular
                </p>
              </div>

              <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white p-3 shadow-inner">
                <img
                  src={qrCodeUrl}
                  alt={`QR Code para ${trip.name}`}
                  className="h-full w-full object-contain rounded-lg"
                />
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => handleCopy(tripUrl, 'link')}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>{copiedType === 'link' ? 'Copiado!' : 'Copiar Link'}</span>
                </button>

                <button
                  onClick={() => onOpenPublicView(trip.slug)}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Ver Página</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onOpenPublicView(trip.slug);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span>Ver Como o Cliente Vê a Página ("Quero Viajar")</span>
          </button>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
