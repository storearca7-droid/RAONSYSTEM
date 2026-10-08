import React from 'react';
import {
  LayoutDashboard,
  Compass,
  Users,
  Wallet,
  Handshake,
  BarChart3,
  Settings,
  LogOut,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useApp, ActiveMenu } from '../../context/AppContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeMenu, setActiveMenu, setSelectedTripId, settings, currentUser, logout, trips, setPublicTripSlug } = useApp();

  const menuItems: { id: ActiveMenu; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'trips', label: 'Viagens', icon: Compass },
    { id: 'travelers', label: 'Viajantes', icon: Users },
    { id: 'financial', label: 'Financeiro', icon: Wallet },
    { id: 'partners', label: 'Parceiros', icon: Handshake },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handleSelect = (id: ActiveMenu) => {
    setActiveMenu(id);
    setSelectedTripId(null);
    onClose();
  };

  const handleOpenLatestPublic = () => {
    const published = trips.find(t => t.status === 'publicada');
    if (published) {
      setPublicTripSlug(published.slug);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col bg-[#0F172A] text-slate-100 transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Area */}
        <div className="flex h-20 items-center gap-3 border-b border-slate-800/80 px-6">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-600 shadow-md">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo Dinho Tour"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="font-extrabold text-white text-lg tracking-wider">DT</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold text-white tracking-tight leading-tight truncate">
              DINHO TOUR
            </h1>
            <p className="text-[11px] font-medium text-orange-400 tracking-wide uppercase truncate">
              Gestão de Viagens
            </p>
          </div>
        </div>

        {/* Navigation List - Exact 7 Menus */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu Principal
          </div>
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-5 w-5 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-orange-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="h-4 w-4 text-orange-200" />}
              </button>
            );
          })}

          {/* Quick link to preview public trip */}
          <div className="pt-6">
            <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Página Pública
            </div>
            <button
              onClick={handleOpenLatestPublic}
              className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:border-orange-500/40 hover:text-orange-300 transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <ExternalLink className="h-4 w-4 text-orange-400 shrink-0" />
                <span className="truncate">Visualizar Página de Inscrição</span>
              </div>
            </button>
          </div>
        </nav>

        {/* Agency Team Footer */}
        <div className="border-t border-slate-800/80 p-4">
          <div className="flex items-center justify-between rounded-xl bg-slate-900/80 p-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 font-semibold text-slate-200 text-sm">
                {currentUser?.name?.charAt(0) || 'D'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">
                  {currentUser?.name || 'Dinho Oliveira'}
                </p>
                <p className="truncate text-[10px] text-slate-400">
                  {currentUser?.role === 'admin' ? 'Administrador' : 'Equipe Dinho'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Encerrar sessão"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
