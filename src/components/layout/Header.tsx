import React from 'react';
import { Menu, Plus, Compass } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenNewTripModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, onOpenNewTripModal }) => {
  const { activeMenu, selectedTripId, trips, setSelectedTripId } = useApp();

  const selectedTrip = trips.find(t => t.id === selectedTripId);

  const getMenuTitle = () => {
    switch (activeMenu) {
      case 'dashboard':
        return 'Dashboard Geral';
      case 'trips':
        return selectedTrip ? selectedTrip.name : 'Gestão de Viagens';
      case 'travelers':
        return 'Viajantes & Documentos';
      case 'financial':
        return 'Controle Financeiro Geral';
      case 'partners':
        return 'Parceiros & Fornecedores';
      case 'products':
        return 'Produtos & Loja da Agência';
      case 'reports':
        return 'Relatórios & Exportações';
      case 'settings':
        return 'Configurações da Agência';
      default:
        return 'Raon System';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-8">
      {/* Zone 1: Mobile toggle + Breadcrumb Trail */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-slate-900 tracking-tight text-base sm:text-lg">
            {getMenuTitle()}
          </span>

          {selectedTrip && activeMenu === 'trips' && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <span aria-hidden="true">/</span>
              <button
                onClick={() => setSelectedTripId(null)}
                className="hover:text-orange-600 transition-colors"
              >
                Todas as Viagens
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Zone 2: Contextual shortcuts / quick status */}
      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          <Compass className="h-3.5 w-3.5 text-orange-600" />
          <span>{trips.filter(t => t.status === 'publicada').length} viagens publicadas</span>
        </div>
      </div>

      {/* Zone 3: Primary Action Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenNewTripModal}
          className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-orange-700 active:scale-[0.99] transition-all whitespace-nowrap"
        >
          <Plus className="h-4 w-4 shrink-0 stroke-[2.5]" />
          <span>+ Criar nova viagem</span>
        </button>
      </div>
    </header>
  );
};
