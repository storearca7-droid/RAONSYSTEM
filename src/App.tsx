import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { TripsListView } from './components/trips/TripsListView';
import { TripFormModal } from './components/trips/TripFormModal';
import { TripDetailsView } from './components/trips/TripDetailsView';
import { TravelersView } from './components/travelers/TravelersView';
import { FinancialView } from './components/financial/FinancialView';
import { PartnersView } from './components/partners/PartnersView';
import { ProductsView } from './components/products/ProductsView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { PublicTripPage } from './components/public/PublicTripPage';
import { PassengerCheckinPage } from './components/public/PassengerCheckinPage';
import { LoginModal } from './components/auth/LoginModal';
import { Trip } from './types';

const AppContent: React.FC = () => {
  const {
    activeMenu,
    setActiveMenu,
    selectedTripId,
    setSelectedTripId,
    publicTripSlug,
    setPublicTripSlug,
    publicCheckinSlug,
    setPublicCheckinSlug,
    isLoggedIn,
    createTrip,
    updateTrip,
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  // If public checkin slug is set, render the passenger boarding checklist page
  if (publicCheckinSlug) {
    return (
      <PassengerCheckinPage
        slug={publicCheckinSlug}
        onBackToTrip={() => {
          setPublicTripSlug(publicCheckinSlug);
          setPublicCheckinSlug(null);
        }}
        onBackToAdmin={() => setPublicCheckinSlug(null)}
      />
    );
  }

  // If public trip slug is set, render the public registration page
  if (publicTripSlug) {
    return (
      <PublicTripPage
        slug={publicTripSlug}
        onBackToAdmin={() => setPublicTripSlug(null)}
      />
    );
  }

  // If user is not logged in, render secure Login Modal
  if (!isLoggedIn) {
    return <LoginModal />;
  }

  const handleOpenNewTrip = () => {
    setEditingTrip(null);
    setIsNewTripModalOpen(true);
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setIsNewTripModalOpen(true);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F6F8FC]">
      {/* Sidebar with menus and Raon System branding */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenNewTripModal={handleOpenNewTrip}
        />

        {/* Dynamic Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="mx-auto max-w-7xl">
            {selectedTripId ? (
              <TripDetailsView
                tripId={selectedTripId}
                onBack={() => setSelectedTripId(null)}
                onEditTrip={handleEditTrip}
              />
            ) : (
              <>
                {activeMenu === 'dashboard' && (
                  <DashboardView onOpenNewTripModal={handleOpenNewTrip} />
                )}
                {activeMenu === 'trips' && (
                  <TripsListView
                    onOpenNewTripModal={handleOpenNewTrip}
                    onEditTrip={handleEditTrip}
                  />
                )}
                {activeMenu === 'travelers' && <TravelersView />}
                {activeMenu === 'financial' && <FinancialView />}
                {activeMenu === 'partners' && <PartnersView />}
                {activeMenu === 'products' && <ProductsView />}
                {activeMenu === 'reports' && <ReportsView />}
                {activeMenu === 'settings' && <SettingsView />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Create / Edit Trip Modal */}
      {isNewTripModalOpen && (
        <TripFormModal
          isOpen={isNewTripModalOpen}
          onClose={() => {
            setIsNewTripModalOpen(false);
            setEditingTrip(null);
          }}
          initialData={editingTrip}
          onSubmit={tripData => {
            if (editingTrip) {
              updateTrip(editingTrip.id, tripData);
            } else {
              const newTrip = createTrip(tripData);
              setSelectedTripId(newTrip.id);
              setActiveMenu('trips');
            }
            setIsNewTripModalOpen(false);
            setEditingTrip(null);
          }}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
