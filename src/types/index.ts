export type TripCategory =
  | 'Excursão'
  | 'Passeio'
  | 'Praia'
  | 'Cultural'
  | 'Religioso'
  | 'Corporativo'
  | 'Internacional'
  | 'Nacional'
  | 'Aventura'
  | 'Outro';

export type TripStatus = 'rascunho' | 'publicada' | 'encerrada' | 'cancelada';

export type BoardingStatus = 'aguardando' | 'embarcou' | 'faltou';

export type RegistrationStatus =
  | 'pending'    // Aguardando aprovação
  | 'confirmed'  // Confirmada (ocupa vaga)
  | 'waitlist'   // Lista de espera (não ocupa vaga)
  | 'cancelled'; // Cancelada

export type FinancialStatus =
  | 'unpaid'     // Não pago
  | 'partial'    // Parcialmente pago
  | 'paid'       // Totalmente pago
  | 'overdue';   // Atrasado

export type PaymentMethod =
  | 'Pix'
  | 'Dinheiro'
  | 'Cartão de Crédito'
  | 'Cartão de Débito'
  | 'Transferência Bancária'
  | 'Boleto'
  | 'Negociar com Operador'
  | 'Outro';

export type ExpenseCategory =
  | 'Transporte'
  | 'Hospedagem'
  | 'Hotel'
  | 'Alimentação'
  | 'Marketing'
  | 'Taxas'
  | 'Guias'
  | 'Passeios'
  | 'Seguro'
  | 'Outras';

export type PartnerCategory =
  | 'Transportadora'
  | 'Hotel / Pousada'
  | 'Guia de Turismo'
  | 'Restaurante'
  | 'Agência Parceira'
  | 'Empresa de Passeios'
  | 'Seguradora'
  | 'Outro';

export interface TripActivity {
  id: string;
  time: string; // "08:30"
  title: string;
  description: string;
  location?: string;
  notes?: string;
  order: number;
}

export interface ItineraryDay {
  id: string;
  dayNumber: number; // 1, 2, 3...
  date?: string; // "2026-11-15"
  title: string; // "Chegada e Check-in"
  description?: string;
  activities: TripActivity[];
}

export interface TripNotice {
  id: string;
  tripId: string;
  title: string;
  message: string;
  priority: 'informativo' | 'importante' | 'urgente';
  publishedAt: string;
  isActive: boolean;
}

export interface TripChecklistItem {
  id: string;
  tripId: string;
  title: string;
  category: 'transporte' | 'hospedagem' | 'passageiros' | 'documentos' | 'brindes' | 'financeiro' | 'roteiro' | 'outro';
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
}

export interface TripCompanionGroup {
  id: string;
  tripId: string;
  name: string; // Ex: "Família Albuquerque", "Casal Bruno & Carla"
  type: 'familia' | 'casal' | 'amigos' | 'outro';
  roomNotes?: string; // Ex: "Quarto Casal com Vista"
  notes?: string;
  createdAt: string;
}

export interface BoardingSessionRecord {
  status: BoardingStatus; // 'aguardando' | 'embarcou' | 'faltou'
  confirmedAt?: string;
  selfChecked: boolean; // Se o passageiro confirmou pelo link com CPF
  notes?: string;
}

export interface BoardingSession {
  id: string;
  tripId: string;
  title: string; // Ex: "Saída de Maceió", "Retorno do Catamarã às 14h", "Entrando no Ônibus após Almoço"
  transportType: string; // Ex: "Ônibus Leito", "Catamarã", "Van 01", "Geral"
  location?: string; // Ex: "Posto Tigre", "Píer de Embarque", "Estacionamento Restaurante"
  scheduledTime?: string; // "14:00"
  isActive: boolean; // Se esta conferência está aberta agora para os viajantes darem OK
  createdAt: string;
  closedAt?: string;
  records: Record<string, BoardingSessionRecord>;
}

export interface Trip {
  id: string;
  slug: string;
  name: string;
  destination: string;
  category: TripCategory;
  description: string;
  imageUrl: string;
  departureDate: string; // "YYYY-MM-DD"
  returnDate: string; // "YYYY-MM-DD"
  departureTime: string; // "06:00"
  departureLocation: string; // "Praça Central de Embarque"
  arrivalLocation: string; // "Hotel / Pousada Destino"
  capacity: number; // Vagas totais
  responsible: string; // "Raon admin / Equipe"
  pricePerPerson: number; // BRL
  notes?: string;
  status: TripStatus;
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryDay[];
  transportType?: string; // Ex: "Ônibus Leito Turismo", "Aéreo (Voo G3 1542)", "Van Executiva"
  flightNumber?: string; // Ex: "G3 1542 / Voo Direto", "LA 3420"
  gatheringTime?: string; // Horário de apresentação/concentração (ex: "05:30")
  returnTime?: string; // Horário de saída de retorno (ex: "14:00")
  returnArrivalLocation?: string; // Local de chegada do retorno
  notices?: TripNotice[];
  checklist?: TripChecklistItem[];
  groups?: TripCompanionGroup[];
  boardingSessions?: BoardingSession[];
  createdAt: string;
  updatedAt: string;
}

export interface Traveler {
  id: string;
  fullName: string;
  cpf: string;
  rg: string;
  birthDate: string; // "YYYY-MM-DD"
  phone: string; // WhatsApp
  email: string;
  city: string;
  state: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  documentUrl?: string;
  documentName?: string;
  documentType?: string; // "image/jpeg", "application/pdf"
  createdAt: string;
}

export interface TripRegistration {
  id: string;
  tripId: string;
  travelerId: string;
  status: RegistrationStatus;
  financialStatus: FinancialStatus;
  contractedAmount: number; // Valor acordado
  discount: number; // Desconto em R$
  effectiveDue: number; // contractedAmount - discount
  paymentMethod?: PaymentMethod;
  notes?: string;
  registeredAt: string;
  approvedAt?: string;
  cancellationReason?: string;
  // Boarding and Logistics fields
  boardingStatus?: BoardingStatus; // 'aguardando' | 'embarcou' | 'faltou'
  boardingTime?: string; // Timestamp de embarque
  boardingSelfChecked?: boolean; // Confirmado pelo próprio passageiro via link com CPF
  seatNumber?: string; // Ex: "04", "12B"
  groupId?: string; // ID do grupo/família
  roomType?: string; // Ex: "Casal", "Duplo Solteiro", "Triplo"
}

export interface RegistrationPayment {
  id: string;
  registrationId: string;
  tripId: string;
  travelerId: string;
  amount: number;
  paymentDate: string; // "YYYY-MM-DD"
  dueDate?: string; // "YYYY-MM-DD"
  paymentMethod: PaymentMethod;
  notes?: string;
  receiptName?: string;
  receiptUrl?: string;
  refunded: boolean;
  refundReason?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  tripId: string;
  description: string;
  category: ExpenseCategory;
  partnerId?: string;
  amount: number;
  date: string; // "YYYY-MM-DD"
  dueDate?: string;
  isPaid: boolean;
  paymentMethod?: PaymentMethod;
  notes?: string;
  receiptName?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface Partner {
  id: string;
  name: string;
  category: PartnerCategory;
  responsibleName: string;
  phone: string;
  whatsapp: string;
  email: string;
  city: string;
  state: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface TripPartnerService {
  id: string;
  tripId: string;
  partnerId: string;
  serviceDescription: string;
  agreedAmount: number;
  status: 'contratado' | 'em_negociacao' | 'concluido' | 'cancelado';
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  entityType: 'trip' | 'traveler' | 'registration' | 'payment' | 'expense' | 'partner' | 'setting' | 'product';
  entityId: string;
  details: string;
  user: string;
}

export interface AgencySettings {
  agencyName: string;
  cnpj: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pixKey: string;
  pixKeyType: 'CPF' | 'CNPJ' | 'Email' | 'Telefone' | 'Aleatória';
  bankName: string;
  bankAccount: string;
  logoUrl?: string;
  termsAndConditions?: string;
  pendingReservationExpirationHours: number; // Horas para expirar reserva pendente
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  useSupabase: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operador';
  avatar?: string;
}

export type ProductCategory =
  | 'Vestuário'
  | 'Eletrônicos'
  | 'Acessórios'
  | 'Utilidades'
  | 'Outro';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  badge?: string;
  tripId?: string;
  availableDuringTrip: boolean;
  createdAt: string;
}

