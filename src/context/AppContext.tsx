import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Trip,
  Traveler,
  TripRegistration,
  RegistrationPayment,
  Expense,
  Partner,
  AuditLog,
  AgencySettings,
  UserProfile,
  RegistrationStatus,
  FinancialStatus,
  PaymentMethod,
  BoardingStatus,
  BoardingSession,
  BoardingSessionRecord,
  TripChecklistItem,
  TripNotice,
  TripCompanionGroup,
  Product,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_USER,
  INITIAL_PARTNERS,
  INITIAL_TRIPS,
  INITIAL_TRAVELERS,
  INITIAL_REGISTRATIONS,
  INITIAL_PAYMENTS,
  INITIAL_EXPENSES,
  INITIAL_AUDIT_LOGS,
  INITIAL_PRODUCTS,
} from '../lib/initialData';
import { generateId, slugify, calculateTripOccupancy, formatBRL, buildWhatsAppLink } from '../lib/utils';
import { testSupabaseConnection } from '../lib/supabase';

export type ActiveMenu =
  | 'dashboard'
  | 'trips'
  | 'travelers'
  | 'financial'
  | 'partners'
  | 'products'
  | 'reports'
  | 'settings';

interface AppContextType {
  // Navigation & Public Views
  activeMenu: ActiveMenu;
  setActiveMenu: (menu: ActiveMenu) => void;
  selectedTripId: string | null;
  setSelectedTripId: (id: string | null) => void;
  publicTripSlug: string | null;
  setPublicTripSlug: (slug: string | null) => void;
  publicCheckinSlug: string | null;
  setPublicCheckinSlug: (slug: string | null) => void;
  currentUser: UserProfile | null;
  isLoggedIn: boolean;
  login: (email?: string, password?: string) => boolean;
  logout: () => void;

  // Domain state
  trips: Trip[];
  travelers: Traveler[];
  registrations: TripRegistration[];
  payments: RegistrationPayment[];
  expenses: Expense[];
  partners: Partner[];
  auditLogs: AuditLog[];
  settings: AgencySettings;

  // Supabase status
  supabaseStatus: { connected: boolean; message: string; checked: boolean };
  checkSupabase: (url?: string, key?: string) => Promise<{ success: boolean; message: string }>;

  // Trip operations
  createTrip: (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => Trip;
  updateTrip: (id: string, trip: Partial<Trip>) => void;
  duplicateTrip: (id: string) => Trip;
  deleteTrip: (id: string) => { success: boolean; message?: string };

  // Boarding & Real-time Checklist operations
  updateBoardingStatus: (
    registrationId: string,
    status: BoardingStatus,
    options?: { selfChecked?: boolean; seatNumber?: string; roomType?: string }
  ) => void;
  selfPassengerCheckin: (
    tripSlug: string,
    cpf: string
  ) => { success: boolean; message: string; registration?: TripRegistration; traveler?: Traveler; sessionTitle?: string };

  // On-demand Transport Boarding Sessions (Conferências do dia a dia)
  createBoardingSession: (
    tripId: string,
    data: { title: string; transportType?: string; location?: string; scheduledTime?: string; setAsActive?: boolean }
  ) => BoardingSession;
  setActiveBoardingSession: (tripId: string, sessionId: string) => void;
  closeBoardingSession: (tripId: string, sessionId: string) => void;
  deleteBoardingSession: (tripId: string, sessionId: string) => void;
  updateSessionPassengerStatus: (
    tripId: string,
    sessionId: string,
    registrationId: string,
    status: BoardingStatus,
    selfChecked?: boolean
  ) => void;

  // Trip Preparation Checklist operations
  toggleChecklistItem: (tripId: string, itemId: string, isCompleted: boolean) => void;
  addChecklistItem: (tripId: string, item: Omit<TripChecklistItem, 'id'>) => void;
  deleteChecklistItem: (tripId: string, itemId: string) => void;

  // Trip Notices & Announcements
  addNotice: (tripId: string, notice: Omit<TripNotice, 'id' | 'publishedAt'>) => void;
  deleteNotice: (tripId: string, noticeId: string) => void;

  // Companion Groups & Accommodations
  addCompanionGroup: (tripId: string, group: Omit<TripCompanionGroup, 'id' | 'createdAt'>) => void;
  deleteCompanionGroup: (tripId: string, groupId: string) => void;
  assignTravelerToGroup: (
    registrationId: string,
    groupId?: string,
    seatNumber?: string,
    roomType?: string
  ) => void;

  // Traveler operations
  createTraveler: (traveler: Omit<Traveler, 'id' | 'createdAt'>) => Traveler;
  updateTraveler: (id: string, traveler: Partial<Traveler>) => void;
  deleteTraveler: (id: string) => { success: boolean; message?: string };

  // Registration & Booking operations
  registerTravelerToTrip: (
    tripId: string,
    travelerData: Partial<Traveler> & { fullName: string; phone: string; cpf: string },
    options?: {
      isPublic?: boolean;
      contractedAmount?: number;
      discount?: number;
      paymentMethod?: PaymentMethod;
      notes?: string;
      initialPayment?: { amount: number; paymentMethod: PaymentMethod; notes?: string };
    }
  ) => { success: boolean; registrationId?: string; status?: RegistrationStatus; message: string };

  updateRegistrationStatus: (
    registrationId: string,
    newStatus: RegistrationStatus,
    reason?: string
  ) => { success: boolean; message?: string };

  deleteRegistration: (registrationId: string) => void;

  // Payments
  recordPayment: (payment: {
    registrationId: string;
    amount: number;
    paymentDate: string;
    dueDate?: string;
    paymentMethod: PaymentMethod;
    notes?: string;
    receiptName?: string;
    receiptUrl?: string;
  }) => { success: boolean; paymentId?: string };

  refundPayment: (paymentId: string, reason: string) => void;

  // Expenses
  createExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Expense;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Partners
  createPartner: (partner: Omit<Partner, 'id' | 'createdAt'>) => Partner;
  updatePartner: (id: string, partner: Partial<Partner>) => void;
  deletePartner: (id: string) => { success: boolean; message?: string };

  // Products
  products: Product[];
  createProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
  resetProductsToInitial: () => void;
  buyProduct: (
    productId: string,
    cpf: string,
    quantity?: number,
    deliveryOption?: string
  ) => { success: boolean; whatsappUrl: string; message: string };

  // Settings & Backups
  updateSettings: (newSettings: Partial<AgencySettings>) => void;
  resetAllData: () => void;
  exportDatabaseJson: () => string;
  importDatabaseJson: (json: string) => { success: boolean; message: string };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'dinho_tour_app_state_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('dashboard');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [publicTripSlug, setPublicTripSlug] = useState<string | null>(null);
  const [publicCheckinSlug, setPublicCheckinSlug] = useState<string | null>(null);

  // Auth State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('dinho_tour_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.name === 'Dinho Oliveira' || !u.name) {
          u.name = 'Raon admin';
          u.email = 'somosraon@gmail.com';
        }
        return u;
      } catch {}
    }
    return INITIAL_USER;
  });
  const isLoggedIn = !!currentUser;

  // Domain Collections with Local Storage hydration
  const [trips, setTrips] = useState<Trip[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_trips');
      if (saved) {
        const parsed: Trip[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(t => {
            if (t.imageUrl?.includes('/src/assets/images/trip_beach_maragogi')) {
              return { ...t, imageUrl: '/images/trips/maragogi.jpg' };
            }
            if (t.imageUrl?.includes('/src/assets/images/trip_cultural_colonial')) {
              return { ...t, imageUrl: '/images/trips/colonial.jpg' };
            }
            if (t.imageUrl?.includes('/src/assets/images/trip_adventure_waterfall')) {
              return { ...t, imageUrl: '/images/trips/aventura.jpg' };
            }
            return t;
          });
        }
      }
      return INITIAL_TRIPS;
    } catch {
      return INITIAL_TRIPS;
    }
  });

  const [travelers, setTravelers] = useState<Traveler[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_travelers');
      return saved ? JSON.parse(saved) : INITIAL_TRAVELERS;
    } catch {
      return INITIAL_TRAVELERS;
    }
  });

  const [registrations, setRegistrations] = useState<TripRegistration[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_registrations');
      return saved ? JSON.parse(saved) : INITIAL_REGISTRATIONS;
    } catch {
      return INITIAL_REGISTRATIONS;
    }
  });

  const [payments, setPayments] = useState<RegistrationPayment[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_payments');
      return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
    } catch {
      return INITIAL_PAYMENTS;
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_expenses');
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [partners, setPartners] = useState<Partner[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_partners');
      return saved ? JSON.parse(saved) : INITIAL_PARTNERS;
    } catch {
      return INITIAL_PARTNERS;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_products');
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If stored products have external unsplash URLs or broken images, migrate them to local bundled images
          return parsed.map(p => {
            const initialMatch = INITIAL_PRODUCTS.find(ip => ip.id === p.id);
            if (p.imageUrl?.includes('unsplash.com') || !p.imageUrl || p.imageUrl.includes('404')) {
              return { ...p, imageUrl: initialMatch?.imageUrl || '/images/products/bone.jpg' };
            }
            return p;
          });
        }
      }
      return INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_audit');
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [settings, setSettings] = useState<AgencySettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_settings');
      if (saved) {
        const s = JSON.parse(saved);
        if (s.agencyName?.includes('DINHO TOUR')) {
          s.agencyName = 'Raon System — Gestão de Viagens';
        }
        if (s.logoUrl?.includes('/src/assets/images')) {
          s.logoUrl = '/images/logo.jpg';
        }
        return s;
      }
      return INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [supabaseStatus, setSupabaseStatus] = useState<{ connected: boolean; message: string; checked: boolean }>({
    connected: false,
    message: 'Supabase não configurado. Operando em modo local protegido.',
    checked: false,
  });

  // Check URL parameters for public page access (e.g. ?viagem=slug, ?public=slug, ?portal=slug, ?viajante=slug, ?checkin=slug, ?embarque=slug)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const portalSlug = params.get('portal') || params.get('viajante') || params.get('checkin') || params.get('embarque');
    if (portalSlug) {
      setPublicCheckinSlug(portalSlug);
      return;
    }
    const tripSlug =
      params.get('viagem') ||
      params.get('public') ||
      params.get('adesao') ||
      params.get('cadastro') ||
      params.get('reservar') ||
      params.get('quero-viajar') ||
      params.get('link');
    if (tripSlug) {
      setPublicTripSlug(tripSlug);
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY + '_trips', JSON.stringify(trips));
    } catch (e) { console.error(e); }
  }, [trips]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY + '_travelers', JSON.stringify(travelers));
    } catch (e) { console.error(e); }
  }, [travelers]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY + '_registrations', JSON.stringify(registrations));
    } catch (e) { console.error(e); }
  }, [registrations]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY + '_payments', JSON.stringify(payments));
    } catch (e) { console.error(e); }
  }, [payments]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY + '_expenses', JSON.stringify(expenses));
    } catch (e) { console.error(e); }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY + '_partners', JSON.stringify(partners));
    } catch (e) { console.error(e); }
  }, [partners]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY + '_products', JSON.stringify(products));
    } catch (e) { console.error(e); }
  }, [products]);

  // Ensure products list is never left empty if initialized with empty cache
  useEffect(() => {
    if (products.length === 0) {
      setProducts(INITIAL_PRODUCTS);
    }
  }, [products.length]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY + '_audit', JSON.stringify(auditLogs));
    } catch (e) { console.error(e); }
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY + '_settings', JSON.stringify(settings));
    } catch (e) { console.error(e); }
  }, [settings]);

  // Check Supabase if configured
  const checkSupabase = async (url?: string, key?: string) => {
    const targetUrl = url || settings.supabaseUrl;
    const targetKey = key || settings.supabaseAnonKey;
    if (!targetUrl || !targetKey) {
      const res = { connected: false, message: 'URL e Anon Key do Supabase não fornecidas.', checked: true };
      setSupabaseStatus(res);
      return { success: false, message: res.message };
    }
    const test = await testSupabaseConnection(targetUrl, targetKey);
    const res = {
      connected: test.success,
      message: test.message,
      checked: true,
    };
    setSupabaseStatus(res);
    return test;
  };

  useEffect(() => {
    if (settings.supabaseUrl && settings.supabaseAnonKey) {
      checkSupabase(settings.supabaseUrl, settings.supabaseAnonKey);
    }
  }, []);

  // Helper to add audit log
  const logAction = (action: string, entityType: AuditLog['entityType'], entityId: string, details: string) => {
    const newLog: AuditLog = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      action,
      entityType,
      entityId,
      details,
      user: currentUser?.name || 'Sistema Raon System',
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 499)]); // keep latest 500
  };

  // Auth
  const login = (_email?: string, _password?: string) => {
    const user = INITIAL_USER;
    setCurrentUser(user);
    localStorage.setItem('dinho_tour_user', JSON.stringify(user));
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('dinho_tour_user');
  };

  // TRIP ACTIONS
  const createTrip = (tripData: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = generateId();
    const now = new Date().toISOString();
    const finalSlug = tripData.slug ? slugify(tripData.slug) : slugify(tripData.name);
    
    // Ensure slug uniqueness
    let uniqueSlug = finalSlug;
    let counter = 1;
    while (trips.some(t => t.slug === uniqueSlug)) {
      uniqueSlug = `${finalSlug}-${counter}`;
      counter++;
    }

    const newTrip: Trip = {
      ...tripData,
      id,
      slug: uniqueSlug,
      createdAt: now,
      updatedAt: now,
    };

    setTrips(prev => [newTrip, ...prev]);
    logAction('Criação de Viagem', 'trip', id, `Viagem "${newTrip.name}" cadastrada com ${newTrip.capacity} vagas.`);
    return newTrip;
  };

  const updateTrip = (id: string, tripData: Partial<Trip>) => {
    setTrips(prev =>
      prev.map(t => {
        if (t.id === id) {
          const updated = {
            ...t,
            ...tripData,
            slug: tripData.slug ? slugify(tripData.slug) : t.slug,
            updatedAt: new Date().toISOString(),
          };
          return updated;
        }
        return t;
      })
    );
    logAction('Edição de Viagem', 'trip', id, `Dados da viagem ID ${id} atualizados.`);
  };

  const duplicateTrip = (id: string): Trip => {
    const source = trips.find(t => t.id === id);
    if (!source) throw new Error('Viagem não encontrada');

    const newId = generateId();
    const now = new Date().toISOString();
    const newName = `${source.name} (Cópia)`;
    let newSlug = slugify(newName);
    let counter = 1;
    while (trips.some(t => t.slug === newSlug)) {
      newSlug = `${slugify(newName)}-${counter}`;
      counter++;
    }

    const duplicated: Trip = {
      ...source,
      id: newId,
      name: newName,
      slug: newSlug,
      status: 'rascunho',
      createdAt: now,
      updatedAt: now,
    };

    setTrips(prev => [duplicated, ...prev]);
    logAction('Duplicação de Viagem', 'trip', newId, `Viagem clonada a partir de "${source.name}".`);
    return duplicated;
  };

  const deleteTrip = (id: string): { success: boolean; message?: string } => {
    const hasActiveRegs = registrations.some(r => r.tripId === id && r.status !== 'cancelled');
    if (hasActiveRegs) {
      return {
        success: false,
        message: 'Não é possível excluir esta viagem pois existem viajantes inscritos. Cancele as inscrições ou arquive a viagem primeiro.',
      };
    }

    const trip = trips.find(t => t.id === id);
    setTrips(prev => prev.filter(t => t.id !== id));
    setExpenses(prev => prev.filter(e => e.tripId !== id));
    setPayments(prev => prev.filter(p => p.tripId !== id));
    setRegistrations(prev => prev.filter(r => r.tripId !== id));

    logAction('Exclusão de Viagem', 'trip', id, `Viagem "${trip?.name || id}" excluída com sucesso.`);
    return { success: true };
  };

  // TRAVELER ACTIONS
  const createTraveler = (travelerData: Omit<Traveler, 'id' | 'createdAt'>): Traveler => {
    const id = generateId();
    const newTraveler: Traveler = {
      ...travelerData,
      id,
      createdAt: new Date().toISOString(),
    };
    setTravelers(prev => [newTraveler, ...prev]);
    logAction('Cadastro de Viajante', 'traveler', id, `Viajante "${newTraveler.fullName}" cadastrado.`);
    return newTraveler;
  };

  const updateTraveler = (id: string, travelerData: Partial<Traveler>) => {
    setTravelers(prev =>
      prev.map(t => (t.id === id ? { ...t, ...travelerData } : t))
    );
    logAction('Edição de Viajante', 'traveler', id, `Dados do viajante ID ${id} atualizados.`);
  };

  const deleteTraveler = (id: string): { success: boolean; message?: string } => {
    const hasRegs = registrations.some(r => r.travelerId === id && r.status !== 'cancelled');
    if (hasRegs) {
      return {
        success: false,
        message: 'Este viajante possui inscrições ativas em viagens e não pode ser excluído.',
      };
    }
    const traveler = travelers.find(t => t.id === id);
    setTravelers(prev => prev.filter(t => t.id !== id));
    logAction('Exclusão de Viajante', 'traveler', id, `Viajante "${traveler?.fullName || id}" removido.`);
    return { success: true };
  };

  // REGISTRATIONS & CAPACITY MANAGEMENT (ATOMIC LOGIC)
  const registerTravelerToTrip = (
    tripId: string,
    travelerData: Partial<Traveler> & { fullName: string; phone: string; cpf: string },
    options: {
      isPublic?: boolean;
      contractedAmount?: number;
      discount?: number;
      paymentMethod?: PaymentMethod;
      notes?: string;
      initialPayment?: { amount: number; paymentMethod: PaymentMethod; notes?: string };
    } = {}
  ): { success: boolean; registrationId?: string; status?: RegistrationStatus; message: string } => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) {
      return { success: false, message: 'Viagem selecionada não foi encontrada.' };
    }

    if (trip.status === 'cancelada' || trip.status === 'encerrada') {
      return { success: false, message: `Esta viagem está com status "${trip.status}" e não aceita novas inscrições.` };
    }

    // Clean CPF for deduplication
    const cleanCpf = travelerData.cpf.replace(/\D/g, '');
    let existingTraveler = travelers.find(t => t.cpf.replace(/\D/g, '') === cleanCpf);

    let travelerId = existingTraveler?.id;
    if (!existingTraveler) {
      // Create new traveler
      const newT = createTraveler({
        fullName: travelerData.fullName.trim(),
        cpf: travelerData.cpf,
        rg: travelerData.rg || '',
        birthDate: travelerData.birthDate || '',
        phone: travelerData.phone,
        email: travelerData.email || '',
        city: travelerData.city || '',
        state: travelerData.state || '',
        address: travelerData.address || '',
        emergencyContactName: travelerData.emergencyContactName || '',
        emergencyContactPhone: travelerData.emergencyContactPhone || '',
        notes: travelerData.notes || '',
        documentUrl: travelerData.documentUrl || '',
        documentName: travelerData.documentName || '',
        documentType: travelerData.documentType || '',
      });
      travelerId = newT.id;
    } else {
      // Update traveler contact info if new provided
      updateTraveler(existingTraveler.id, {
        phone: travelerData.phone || existingTraveler.phone,
        email: travelerData.email || existingTraveler.email,
        city: travelerData.city || existingTraveler.city,
        state: travelerData.state || existingTraveler.state,
      });
    }

    // Check if traveler is already registered for this trip
    const alreadyRegistered = registrations.find(
      r => r.tripId === tripId && r.travelerId === travelerId && r.status !== 'cancelled'
    );
    if (alreadyRegistered) {
      return {
        success: false,
        message: `O viajante ${travelerData.fullName} já possui uma inscrição ativa nesta viagem.`,
      };
    }

    // Capacity Check
    const occupancy = calculateTripOccupancy(trip, registrations);
    let assignedStatus: RegistrationStatus;

    if (options.isPublic) {
      // Public flow
      if (occupancy.isFull) {
        assignedStatus = 'waitlist'; // Over capacity goes to waitlist
      } else {
        assignedStatus = 'pending'; // Normal registration goes to pending approval
      }
    } else {
      // Admin manual flow
      if (occupancy.isFull) {
        assignedStatus = 'waitlist';
      } else {
        assignedStatus = 'confirmed';
      }
    }

    const regId = generateId();
    const basePrice = options.contractedAmount ?? trip.pricePerPerson;
    const discount = options.discount ?? 0;
    const effectiveDue = Math.max(0, basePrice - discount);

    let initialFinancialStatus: FinancialStatus = 'unpaid';
    if (options.initialPayment && options.initialPayment.amount > 0) {
      if (options.initialPayment.amount >= effectiveDue && effectiveDue > 0) {
        initialFinancialStatus = 'paid';
      } else {
        initialFinancialStatus = 'partial';
      }
    }

    const newReg: TripRegistration = {
      id: regId,
      tripId,
      travelerId: travelerId!,
      status: assignedStatus,
      financialStatus: initialFinancialStatus,
      contractedAmount: basePrice,
      discount,
      effectiveDue,
      paymentMethod: options.paymentMethod,
      notes: options.notes || (options.isPublic ? 'Inscrição realizada via link público' : 'Cadastrado pelo administrador'),
      registeredAt: new Date().toISOString(),
      approvedAt: assignedStatus === 'confirmed' ? new Date().toISOString() : undefined,
    };

    setRegistrations(prev => [newReg, ...prev]);

    // If initial payment provided
    if (options.initialPayment && options.initialPayment.amount > 0) {
      const payId = generateId();
      const newPay: RegistrationPayment = {
        id: payId,
        registrationId: regId,
        tripId,
        travelerId: travelerId!,
        amount: options.initialPayment.amount,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: options.initialPayment.paymentMethod,
        notes: options.initialPayment.notes || 'Pagamento inicial no ato do cadastro',
        refunded: false,
        createdAt: new Date().toISOString(),
      };
      setPayments(prev => [newPay, ...prev]);
    }

    const msg =
      assignedStatus === 'waitlist'
        ? `A viagem está lotada (${trip.capacity} vagas). A inscrição foi incluída com sucesso na LISTA DE ESPERA.`
        : options.isPublic
        ? 'Inscrição recebida com sucesso! A equipe da Raon System analisará a solicitação e confirmará sua reserva.'
        : `Viajante inscrito com sucesso com status "${assignedStatus === 'confirmed' ? 'Confirmado' : 'Aguardando Aprovação'}".`;

    logAction(
      'Inscrição em Viagem',
      'registration',
      regId,
      `Viajante ${travelerData.fullName} inscrito em "${trip.name}" (${assignedStatus}).`
    );

    return {
      success: true,
      registrationId: regId,
      status: assignedStatus,
      message: msg,
    };
  };

  const updateRegistrationStatus = (
    registrationId: string,
    newStatus: RegistrationStatus,
    reason?: string
  ): { success: boolean; message?: string } => {
    const reg = registrations.find(r => r.id === registrationId);
    if (!reg) return { success: false, message: 'Inscrição não encontrada.' };

    const trip = trips.find(t => t.id === reg.tripId);
    if (!trip) return { success: false, message: 'Viagem não encontrada.' };

    // If promoting to 'confirmed' or 'pending', check capacity
    if ((newStatus === 'confirmed' || newStatus === 'pending') && reg.status === 'waitlist') {
      const occupancy = calculateTripOccupancy(trip, registrations);
      if (occupancy.isFull) {
        return {
          success: false,
          message: 'Não é possível aprovar ou promover da lista de espera pois a viagem já atingiu a capacidade máxima. Aumente as vagas da viagem nas configurações se desejar.',
        };
      }
    }

    setRegistrations(prev =>
      prev.map(r => {
        if (r.id === registrationId) {
          return {
            ...r,
            status: newStatus,
            approvedAt: newStatus === 'confirmed' ? new Date().toISOString() : r.approvedAt,
            cancellationReason: newStatus === 'cancelled' ? reason : undefined,
          };
        }
        return r;
      })
    );

    logAction(
      'Alteração de Status de Inscrição',
      'registration',
      registrationId,
      `Status alterado de "${reg.status}" para "${newStatus}".`
    );

    return { success: true };
  };

  const deleteRegistration = (registrationId: string) => {
    const reg = registrations.find(r => r.id === registrationId);
    setRegistrations(prev => prev.filter(r => r.id !== registrationId));
    setPayments(prev => prev.filter(p => p.registrationId !== registrationId));
    logAction('Remoção de Inscrição', 'registration', registrationId, `Inscrição removida.`);
  };

  // BOARDING & REAL-TIME CHECKLIST OPERATIONS
  const updateBoardingStatus = (
    registrationId: string,
    status: BoardingStatus,
    options?: { selfChecked?: boolean; seatNumber?: string; roomType?: string }
  ) => {
    setRegistrations(prev =>
      prev.map(r => {
        if (r.id === registrationId) {
          const now = new Date().toISOString();
          return {
            ...r,
            boardingStatus: status,
            boardingTime: status === 'embarcou' ? now : undefined,
            boardingSelfChecked: options?.selfChecked ?? r.boardingSelfChecked,
            seatNumber: options?.seatNumber ?? r.seatNumber,
            roomType: options?.roomType ?? r.roomType,
          };
        }
        return r;
      })
    );
    const reg = registrations.find(r => r.id === registrationId);
    const traveler = travelers.find(t => t.id === reg?.travelerId);
    logAction(
      'Atualização de Embarque',
      'registration',
      registrationId,
      `Passageiro ${traveler?.fullName || ''} marcado como "${status}".`
    );
  };

  const selfPassengerCheckin = (
    tripSlug: string,
    cpf: string
  ): { success: boolean; message: string; registration?: TripRegistration; traveler?: Traveler; sessionTitle?: string } => {
    const trip = trips.find(t => t.slug === tripSlug);
    if (!trip) {
      return { success: false, message: 'Viagem não encontrada.' };
    }

    const cleanCpfInput = cpf.replace(/\D/g, '');
    const traveler = travelers.find(t => t.cpf.replace(/\D/g, '') === cleanCpfInput);
    if (!traveler) {
      return {
        success: false,
        message: 'CPF não encontrado na lista de passageiros desta viagem. Verifique os números digitados ou fale com a Raon System.',
      };
    }

    const reg = registrations.find(
      r => r.tripId === trip.id && r.travelerId === traveler.id && r.status !== 'cancelled'
    );
    if (!reg) {
      return {
        success: false,
        message: `O viajante ${traveler.fullName} não possui inscrição ativa nesta viagem.`,
      };
    }

    // Update boarding to 'embarcou'
    const now = new Date().toISOString();
    setRegistrations(prev =>
      prev.map(r =>
        r.id === reg.id
          ? {
              ...r,
              boardingStatus: 'embarcou',
              boardingTime: now,
              boardingSelfChecked: true,
            }
          : r
      )
    );

    // If there is an active boarding session for this trip, record in that session as well
    const activeSession = trip.boardingSessions?.find(s => s.isActive);
    let sessionTitle: string | undefined = undefined;

    if (activeSession) {
      sessionTitle = activeSession.title;
      setTrips(prev =>
        prev.map(t => {
          if (t.id === trip.id) {
            const sessions = (t.boardingSessions || []).map(s => {
              if (s.id === activeSession.id) {
                return {
                  ...s,
                  records: {
                    ...s.records,
                    [reg.id]: {
                      status: 'embarcou' as BoardingStatus,
                      confirmedAt: now,
                      selfChecked: true,
                    },
                  },
                };
              }
              return s;
            });
            return { ...t, boardingSessions: sessions };
          }
          return t;
        })
      );
    }

    logAction(
      'Auto Check-in do Passageiro',
      'registration',
      reg.id,
      `Passageiro ${traveler.fullName} confirmou presença e embarque com CPF (${now})${sessionTitle ? ` na conferência "${sessionTitle}"` : ''}.`
    );

    return {
      success: true,
      message: sessionTitle
        ? `Presença confirmada para a conferência "${sessionTitle}"! Bem-vindo(a) ao transporte, ${traveler.fullName}!`
        : `Presença confirmada com sucesso! Bem-vindo(a) a bordo, ${traveler.fullName}!`,
      sessionTitle,
      registration: { ...reg, boardingStatus: 'embarcou', boardingTime: now, boardingSelfChecked: true },
      traveler,
    };
  };

  // ON-DEMAND TRANSPORT BOARDING SESSIONS (CONFERÊNCIAS DO DIA A DIA)
  const createBoardingSession = (
    tripId: string,
    data: { title: string; transportType?: string; location?: string; scheduledTime?: string; setAsActive?: boolean }
  ): BoardingSession => {
    const newSessionId = generateId();
    const now = new Date().toISOString();

    // Prepare initial records for all confirmed & pending registrations in this trip
    const initialRecords: Record<string, BoardingSessionRecord> = {};
    const tripRegs = registrations.filter(
      r => r.tripId === tripId && (r.status === 'confirmed' || r.status === 'pending')
    );
    tripRegs.forEach(r => {
      initialRecords[r.id] = {
        status: 'aguardando',
        selfChecked: false,
      };
    });

    const isNewActive = data.setAsActive !== false;

    const newSession: BoardingSession = {
      id: newSessionId,
      tripId,
      title: data.title.trim(),
      transportType: data.transportType?.trim() || 'Ônibus Executivo',
      location: data.location?.trim() || undefined,
      scheduledTime: data.scheduledTime?.trim() || undefined,
      isActive: isNewActive,
      createdAt: now,
      records: initialRecords,
    };

    setTrips(prev =>
      prev.map(t => {
        if (t.id === tripId) {
          const existing = (t.boardingSessions || []).map(s => ({
            ...s,
            isActive: isNewActive ? false : s.isActive,
          }));
          return {
            ...t,
            boardingSessions: [newSession, ...existing],
          };
        }
        return t;
      })
    );

    // If new session is active, reset current registrations' boarding status to 'aguardando' for this new round
    if (isNewActive) {
      setRegistrations(prev =>
        prev.map(r => {
          if (r.tripId === tripId && (r.status === 'confirmed' || r.status === 'pending')) {
            return {
              ...r,
              boardingStatus: 'aguardando',
              boardingTime: undefined,
              boardingSelfChecked: false,
            };
          }
          return r;
        })
      );
    }

    logAction(
      'Nova Conferência de Embarque',
      'trip',
      tripId,
      `Chamada de embarque criada: "${newSession.title}" (${newSession.transportType}).`
    );

    return newSession;
  };

  const setActiveBoardingSession = (tripId: string, sessionId: string) => {
    setTrips(prev =>
      prev.map(t => {
        if (t.id === tripId) {
          const sessions = (t.boardingSessions || []).map(s => ({
            ...s,
            isActive: s.id === sessionId,
          }));
          return { ...t, boardingSessions: sessions };
        }
        return t;
      })
    );

    // Sync registrations with the activated session's records
    const targetTrip = trips.find(t => t.id === tripId);
    const targetSession = targetTrip?.boardingSessions?.find(s => s.id === sessionId);
    if (targetSession) {
      setRegistrations(prev =>
        prev.map(r => {
          if (r.tripId === tripId) {
            const rec = targetSession.records[r.id];
            if (rec) {
              return {
                ...r,
                boardingStatus: rec.status,
                boardingTime: rec.confirmedAt,
                boardingSelfChecked: rec.selfChecked,
              };
            }
          }
          return r;
        })
      );
    }

    logAction('Conferência Ativada', 'trip', tripId, `Sessão de embarque ativada.`);
  };

  const closeBoardingSession = (tripId: string, sessionId: string) => {
    const now = new Date().toISOString();
    setTrips(prev =>
      prev.map(t => {
        if (t.id === tripId) {
          const sessions = (t.boardingSessions || []).map(s =>
            s.id === sessionId
              ? { ...s, isActive: false, closedAt: now }
              : s
          );
          return { ...t, boardingSessions: sessions };
        }
        return t;
      })
    );
    logAction('Conferência Finalizada', 'trip', tripId, `Conferência de embarque encerrada.`);
  };

  const deleteBoardingSession = (tripId: string, sessionId: string) => {
    setTrips(prev =>
      prev.map(t => {
        if (t.id === tripId) {
          const sessions = (t.boardingSessions || []).filter(s => s.id !== sessionId);
          return { ...t, boardingSessions: sessions };
        }
        return t;
      })
    );
  };

  const updateSessionPassengerStatus = (
    tripId: string,
    sessionId: string,
    registrationId: string,
    status: BoardingStatus,
    selfChecked?: boolean
  ) => {
    const now = new Date().toISOString();
    setTrips(prev =>
      prev.map(t => {
        if (t.id === tripId) {
          const sessions = (t.boardingSessions || []).map(s => {
            if (s.id === sessionId) {
              const currentRecord = s.records[registrationId] || { status: 'aguardando', selfChecked: false };
              return {
                ...s,
                records: {
                  ...s.records,
                  [registrationId]: {
                    ...currentRecord,
                    status,
                    confirmedAt: status === 'embarcou' ? now : undefined,
                    selfChecked: selfChecked ?? currentRecord.selfChecked,
                  },
                },
              };
            }
            return s;
          });
          return { ...t, boardingSessions: sessions };
        }
        return t;
      })
    );

    // If session is currently active, keep registration status synchronized
    const targetTrip = trips.find(t => t.id === tripId);
    const session = targetTrip?.boardingSessions?.find(s => s.id === sessionId);
    if (session?.isActive) {
      updateBoardingStatus(registrationId, status, { selfChecked });
    }
  };

  // TRIP PREPARATION CHECKLIST
  const toggleChecklistItem = (tripId: string, itemId: string, isCompleted: boolean) => {
    setTrips(prev =>
      prev.map(t => {
        if (t.id === tripId) {
          const checklist = (t.checklist || []).map(item =>
            item.id === itemId
              ? {
                  ...item,
                  isCompleted,
                  completedAt: isCompleted ? new Date().toISOString() : undefined,
                }
              : item
          );
          return { ...t, checklist };
        }
        return t;
      })
    );
  };

  const addChecklistItem = (tripId: string, item: Omit<TripChecklistItem, 'id'>) => {
    const newItem: TripChecklistItem = {
      ...item,
      id: generateId(),
    };
    setTrips(prev =>
      prev.map(t => {
        if (t.id === tripId) {
          return {
            ...t,
            checklist: [...(t.checklist || []), newItem],
          };
        }
        return t;
      })
    );
    logAction('Checklist da Viagem', 'trip', tripId, `Item "${item.title}" adicionado ao checklist.`);
  };

  const deleteChecklistItem = (tripId: string, itemId: string) => {
    setTrips(prev =>
      prev.map(t => {
        if (t.id === tripId) {
          return {
            ...t,
            checklist: (t.checklist || []).filter(i => i.id !== itemId),
          };
        }
        return t;
      })
    );
  };

  // TRIP NOTICES & ANNOUNCEMENTS
  const addNotice = (tripId: string, notice: Omit<TripNotice, 'id' | 'publishedAt'>) => {
    const newNotice: TripNotice = {
      ...notice,
      id: generateId(),
      publishedAt: new Date().toISOString(),
    };
    setTrips(prev =>
      prev.map(t => {
        if (t.id === tripId) {
          return {
            ...t,
            notices: [newNotice, ...(t.notices || [])],
          };
        }
        return t;
      })
    );
    logAction('Aviso Publicado', 'trip', tripId, `Aviso "${notice.title}" publicado.`);
  };

  const deleteNotice = (tripId: string, noticeId: string) => {
    setTrips(prev =>
      prev.map(t => {
        if (t.id === tripId) {
          return {
            ...t,
            notices: (t.notices || []).filter(n => n.id !== noticeId),
          };
        }
        return t;
      })
    );
  };

  // COMPANION GROUPS & ACCOMMODATIONS
  const addCompanionGroup = (tripId: string, group: Omit<TripCompanionGroup, 'id' | 'createdAt'>) => {
    const newGroup: TripCompanionGroup = {
      ...group,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setTrips(prev =>
      prev.map(t => {
        if (t.id === tripId) {
          return {
            ...t,
            groups: [...(t.groups || []), newGroup],
          };
        }
        return t;
      })
    );
    logAction('Grupo Criado', 'trip', tripId, `Grupo "${group.name}" criado.`);
  };

  const deleteCompanionGroup = (tripId: string, groupId: string) => {
    setTrips(prev =>
      prev.map(t => {
        if (t.id === tripId) {
          return {
            ...t,
            groups: (t.groups || []).filter(g => g.id !== groupId),
          };
        }
        return t;
      })
    );
    setRegistrations(prev =>
      prev.map(r => (r.groupId === groupId ? { ...r, groupId: undefined } : r))
    );
  };

  const assignTravelerToGroup = (
    registrationId: string,
    groupId?: string,
    seatNumber?: string,
    roomType?: string
  ) => {
    setRegistrations(prev =>
      prev.map(r => {
        if (r.id === registrationId) {
          return {
            ...r,
            groupId: groupId !== undefined ? groupId : r.groupId,
            seatNumber: seatNumber !== undefined ? seatNumber : r.seatNumber,
            roomType: roomType !== undefined ? roomType : r.roomType,
          };
        }
        return r;
      })
    );
  };

  // PAYMENTS & FINANCIAL
  const recordPayment = (paymentData: {
    registrationId: string;
    amount: number;
    paymentDate: string;
    dueDate?: string;
    paymentMethod: PaymentMethod;
    notes?: string;
    receiptName?: string;
    receiptUrl?: string;
  }): { success: boolean; paymentId?: string } => {
    const reg = registrations.find(r => r.id === paymentData.registrationId);
    if (!reg) return { success: false };

    const payId = generateId();
    const newPayment: RegistrationPayment = {
      id: payId,
      registrationId: reg.id,
      tripId: reg.tripId,
      travelerId: reg.travelerId,
      amount: paymentData.amount,
      paymentDate: paymentData.paymentDate,
      dueDate: paymentData.dueDate,
      paymentMethod: paymentData.paymentMethod,
      notes: paymentData.notes,
      receiptName: paymentData.receiptName,
      receiptUrl: paymentData.receiptUrl,
      refunded: false,
      createdAt: new Date().toISOString(),
    };

    // Calculate updated financial status for the registration
    const existingPayments = payments.filter(p => p.registrationId === reg.id && !p.refunded);
    const newTotalPaid = existingPayments.reduce((acc, p) => acc + p.amount, 0) + paymentData.amount;

    let updatedFinancialStatus: FinancialStatus = 'unpaid';
    if (newTotalPaid >= reg.effectiveDue && reg.effectiveDue > 0) {
      updatedFinancialStatus = 'paid';
    } else if (newTotalPaid > 0) {
      updatedFinancialStatus = 'partial';
    }

    setPayments(prev => [newPayment, ...prev]);
    setRegistrations(prev =>
      prev.map(r => (r.id === reg.id ? { ...r, financialStatus: updatedFinancialStatus } : r))
    );

    logAction(
      'Registro de Pagamento',
      'payment',
      payId,
      `Pagamento de R$ ${paymentData.amount.toFixed(2)} registrado via ${paymentData.paymentMethod}.`
    );

    return { success: true, paymentId: payId };
  };

  const refundPayment = (paymentId: string, reason: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;

    setPayments(prev =>
      prev.map(p => {
        if (p.id === paymentId) {
          return {
            ...p,
            refunded: true,
            refundReason: reason,
          };
        }
        return p;
      })
    );

    // Recompute registration financial status
    const remainingPayments = payments.filter(
      p => p.registrationId === payment.registrationId && p.id !== paymentId && !p.refunded
    );
    const totalPaid = remainingPayments.reduce((acc, p) => acc + p.amount, 0);

    const reg = registrations.find(r => r.id === payment.registrationId);
    if (reg) {
      let updatedStatus: FinancialStatus = 'unpaid';
      if (totalPaid >= reg.effectiveDue && reg.effectiveDue > 0) {
        updatedStatus = 'paid';
      } else if (totalPaid > 0) {
        updatedStatus = 'partial';
      }

      setRegistrations(prev =>
        prev.map(r => (r.id === reg.id ? { ...r, financialStatus: updatedStatus } : r))
      );
    }

    logAction(
      'Estorno de Pagamento',
      'payment',
      paymentId,
      `Estorno de R$ ${payment.amount.toFixed(2)} realizado. Motivo: ${reason}`
    );
  };

  // EXPENSES
  const createExpense = (expenseData: Omit<Expense, 'id' | 'createdAt'>): Expense => {
    const id = generateId();
    const newExpense: Expense = {
      ...expenseData,
      id,
      createdAt: new Date().toISOString(),
    };
    setExpenses(prev => [newExpense, ...prev]);
    logAction('Cadastro de Despesa', 'expense', id, `Despesa "${newExpense.description}" no valor de R$ ${newExpense.amount.toFixed(2)} lançada.`);
    return newExpense;
  };

  const updateExpense = (id: string, expenseData: Partial<Expense>) => {
    setExpenses(prev =>
      prev.map(e => (e.id === id ? { ...e, ...expenseData } : e))
    );
    logAction('Edição de Despesa', 'expense', id, `Despesa ID ${id} atualizada.`);
  };

  const deleteExpense = (id: string) => {
    const exp = expenses.find(e => e.id === id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    logAction('Exclusão de Despesa', 'expense', id, `Despesa "${exp?.description || id}" removida.`);
  };

  // PARTNERS
  const createPartner = (partnerData: Omit<Partner, 'id' | 'createdAt'>): Partner => {
    const id = generateId();
    const newPartner: Partner = {
      ...partnerData,
      id,
      createdAt: new Date().toISOString(),
    };
    setPartners(prev => [newPartner, ...prev]);
    logAction('Cadastro de Parceiro', 'partner', id, `Parceiro "${newPartner.name}" cadastrado.`);
    return newPartner;
  };

  const updatePartner = (id: string, partnerData: Partial<Partner>) => {
    setPartners(prev =>
      prev.map(p => (p.id === id ? { ...p, ...partnerData } : p))
    );
    logAction('Edição de Parceiro', 'partner', id, `Parceiro ID ${id} atualizado.`);
  };

  const deletePartner = (id: string): { success: boolean; message?: string } => {
    const isUsed = expenses.some(e => e.partnerId === id);
    if (isUsed) {
      return {
        success: false,
        message: 'Este parceiro possui despesas vinculadas e não pode ser excluído diretamente.',
      };
    }
    const partner = partners.find(p => p.id === id);
    setPartners(prev => prev.filter(p => p.id !== id));
    logAction('Exclusão de Parceiro', 'partner', id, `Parceiro "${partner?.name || id}" removido.`);
    return { success: true };
  };

  // PRODUCTS
  const createProduct = (productData: Omit<Product, 'id' | 'createdAt'>): Product => {
    const id = generateId();
    const newProduct: Product = {
      ...productData,
      id,
      createdAt: new Date().toISOString(),
    };
    setProducts(prev => [newProduct, ...prev]);
    logAction('Cadastro de Produto', 'product', id, `Produto "${newProduct.name}" cadastrado com estoque ${newProduct.stock}.`);
    return newProduct;
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, ...productData } : p))
    );
    logAction('Edição de Produto', 'product', id, `Produto ${id} atualizado.`);
  };

  const deleteProduct = (id: string) => {
    const prod = products.find(p => p.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
    logAction('Exclusão de Produto', 'product', id, `Produto "${prod?.name || id}" excluído.`);
  };

  const adjustStock = (id: string, delta: number) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const newStock = Math.max(0, p.stock + delta);
          return { ...p, stock: newStock };
        }
        return p;
      })
    );
  };

  const resetProductsToInitial = () => {
    setProducts(INITIAL_PRODUCTS);
    localStorage.setItem(LOCAL_STORAGE_KEY + '_products', JSON.stringify(INITIAL_PRODUCTS));
    logAction('Restauração de Catálogo', 'product', 'all', 'Catálogo de produtos restaurado para os itens padrão da Raon System.');
  };

  const buyProduct = (
    productId: string,
    cpf: string,
    quantity: number = 1,
    deliveryOption?: string
  ): { success: boolean; whatsappUrl: string; message: string } => {
    const prod = products.find(p => p.id === productId);
    if (!prod) {
      return { success: false, whatsappUrl: '', message: 'Produto não encontrado.' };
    }
    if (prod.stock < quantity) {
      return { success: false, whatsappUrl: '', message: `Estoque insuficiente! Restam apenas ${prod.stock} unidade(s) disponíveis.` };
    }

    // Decrement stock immediately
    adjustStock(productId, -quantity);

    // Look up traveler by CPF if registered
    const cleanCpf = cpf.replace(/\D/g, '');
    const traveler = travelers.find(t => t.cpf.replace(/\D/g, '') === cleanCpf);
    const travelerName = traveler?.fullName || 'Cliente da Agência';
    const totalAmount = prod.price * quantity;

    const formattedCpf = cleanCpf.length === 11
      ? cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      : cpf;

    const messageLines = [
      `Olá Raon System! Gostaria de comprar o produto da agência:`,
      ``,
      `🛍️ *Produto:* ${prod.name}`,
      `🔢 *Quantidade:* ${quantity} unidade(s)`,
      `💰 *Valor Unitário:* ${formatBRL(prod.price)}`,
      `💵 *Valor Total:* ${formatBRL(totalAmount)}`,
      `👤 *Cliente:* ${travelerName}`,
      `📄 *CPF:* ${formattedCpf}`,
      deliveryOption ? `📍 *Entrega:* ${deliveryOption}` : `📍 *Entrega:* Durante o embarque / na viagem`,
      ``,
      `Por favor, me envie a chave PIX ou dados de pagamento para finalizar o pedido. Obrigado!`,
    ];

    const message = messageLines.join('\n');
    const whatsappUrl = buildWhatsAppLink(settings.whatsapp, message);

    logAction(
      'Venda de Produto',
      'product',
      productId,
      `Pedido de ${quantity}x "${prod.name}" gerado para CPF ${formattedCpf} (${formatBRL(totalAmount)}). WhatsApp acionado.`
    );

    return {
      success: true,
      whatsappUrl,
      message: `Pedido confirmado! Redirecionando para o WhatsApp da agência...`,
    };
  };

  // SETTINGS & BACKUPS
  const updateSettings = (newSettings: Partial<AgencySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    logAction('Atualização de Configurações', 'setting', 'main', 'Configurações da agência atualizadas.');
  };

  const resetAllData = () => {
    setTrips(INITIAL_TRIPS);
    setTravelers(INITIAL_TRAVELERS);
    setRegistrations(INITIAL_REGISTRATIONS);
    setPayments(INITIAL_PAYMENTS);
    setExpenses(INITIAL_EXPENSES);
    setPartners(INITIAL_PARTNERS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setSettings(INITIAL_SETTINGS);
    localStorage.clear();
    logAction('Restauração de Fábrica', 'setting', 'main', 'Todos os dados foram resetados para a configuração padrão.');
  };

  const exportDatabaseJson = (): string => {
    const backup = {
      agency: 'Raon System',
      exportDate: new Date().toISOString(),
      trips,
      travelers,
      registrations,
      payments,
      expenses,
      partners,
      settings,
      auditLogs,
    };
    return JSON.stringify(backup, null, 2);
  };

  const importDatabaseJson = (json: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(json);
      if (!data.trips || !data.travelers || !data.registrations) {
        return { success: false, message: 'Arquivo JSON inválido. Estrutura não compatível com o Raon System.' };
      }
      setTrips(data.trips);
      setTravelers(data.travelers);
      setRegistrations(data.registrations);
      if (data.payments) setPayments(data.payments);
      if (data.expenses) setExpenses(data.expenses);
      if (data.partners) setPartners(data.partners);
      if (data.settings) setSettings(data.settings);
      if (data.auditLogs) setAuditLogs(data.auditLogs);

      logAction('Restauração de Backup', 'setting', 'main', 'Backup completo de dados restaurado com sucesso.');
      return { success: true, message: 'Dados restaurados com sucesso!' };
    } catch (e: any) {
      return { success: false, message: `Erro ao importar arquivo: ${e?.message}` };
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeMenu,
        setActiveMenu,
        selectedTripId,
        setSelectedTripId,
        publicTripSlug,
        setPublicTripSlug,
        publicCheckinSlug,
        setPublicCheckinSlug,
        currentUser,
        isLoggedIn,
        login,
        logout,
        trips,
        travelers,
        registrations,
        payments,
        expenses,
        partners,
        auditLogs,
        settings,
        supabaseStatus,
        checkSupabase,
        createTrip,
        updateTrip,
        duplicateTrip,
        deleteTrip,
        updateBoardingStatus,
        selfPassengerCheckin,
        createBoardingSession,
        setActiveBoardingSession,
        closeBoardingSession,
        deleteBoardingSession,
        updateSessionPassengerStatus,
        toggleChecklistItem,
        addChecklistItem,
        deleteChecklistItem,
        addNotice,
        deleteNotice,
        addCompanionGroup,
        deleteCompanionGroup,
        assignTravelerToGroup,
        createTraveler,
        updateTraveler,
        deleteTraveler,
        registerTravelerToTrip,
        updateRegistrationStatus,
        deleteRegistration,
        recordPayment,
        refundPayment,
        createExpense,
        updateExpense,
        deleteExpense,
        createPartner,
        updatePartner,
        deletePartner,
        products,
        createProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        resetProductsToInitial,
        buyProduct,
        updateSettings,
        resetAllData,
        exportDatabaseJson,
        importDatabaseJson,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
