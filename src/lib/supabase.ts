import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(url?: string, anonKey?: string): SupabaseClient | null {
  const targetUrl = url || (import.meta as any).env?.VITE_SUPABASE_URL || localStorage.getItem('dinho_supabase_url');
  const targetKey = anonKey || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || localStorage.getItem('dinho_supabase_anon_key');

  if (!targetUrl || !targetKey) {
    return null;
  }

  try {
    if (!supabaseInstance || (url && anonKey)) {
      supabaseInstance = createClient(targetUrl, targetKey);
    }
    return supabaseInstance;
  } catch (err) {
    console.error('Erro ao inicializar Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    const client = createClient(url, key);
    const { error } = await client.from('trips').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, try basic auth ping
      const authCheck = await client.auth.getSession();
      if (authCheck.error) {
        return { success: false, message: `Erro de conexão: ${authCheck.error.message}` };
      }
      return { 
        success: true, 
        message: 'Conectado ao Supabase! As tabelas precisam ser criadas executando o script SQL fornecido abaixo.' 
      };
    }
    return { success: true, message: 'Conexão com Supabase estabelecida e tabelas detectadas com sucesso!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Falha ao conectar com o Supabase' };
  }
}

export const SUPABASE_SQL_MIGRATION = `-- ========================================================
-- DINHO TOUR — SCRIPT COMPLETO DE ESTRUTURA POSTGRESQL (SUPABASE)
-- Execute este script no SQL Editor do seu projeto Supabase.
-- ========================================================

-- 1. Tabela de Viagens (trips)
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    destination TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Excursão',
    description TEXT,
    image_url TEXT,
    departure_date DATE NOT NULL,
    return_date DATE NOT NULL,
    departure_time TEXT NOT NULL DEFAULT '06:00',
    departure_location TEXT NOT NULL,
    arrival_location TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 40,
    responsible TEXT NOT NULL DEFAULT 'Raon System',
    price_per_person NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'publicada', -- 'rascunho', 'publicada', 'encerrada', 'cancelada'
    inclusions JSONB DEFAULT '[]'::jsonb,
    exclusions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Roteiros - Dias (itinerary_days)
CREATE TABLE IF NOT EXISTS public.itinerary_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    date DATE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Roteiros - Atividades (itinerary_activities)
CREATE TABLE IF NOT EXISTS public.itinerary_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id UUID NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
    time TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Viajantes (travelers)
CREATE TABLE IF NOT EXISTS public.travelers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    rg TEXT,
    birth_date DATE,
    phone TEXT NOT NULL,
    email TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    notes TEXT,
    document_url TEXT,
    document_name TEXT,
    document_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Inscrições / Vagas na Viagem (trip_registrations)
CREATE TABLE IF NOT EXISTS public.trip_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    traveler_id UUID NOT NULL REFERENCES public.travelers(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'waitlist', 'cancelled'
    financial_status TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid', 'overdue'
    contracted_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    effective_due NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT,
    notes TEXT,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    UNIQUE(trip_id, traveler_id)
);

-- 6. Tabela de Pagamentos das Inscrições (registration_payments)
CREATE TABLE IF NOT EXISTS public.registration_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES public.trip_registrations(id) ON DELETE CASCADE,
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    traveler_id UUID NOT NULL REFERENCES public.travelers(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    payment_method TEXT NOT NULL DEFAULT 'Pix',
    notes TEXT,
    receipt_name TEXT,
    receipt_url TEXT,
    refunded BOOLEAN NOT NULL DEFAULT FALSE,
    refund_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de Despesas das Viagens (expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Transporte',
    partner_id UUID,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    payment_method TEXT,
    notes TEXT,
    receipt_name TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabela de Parceiros (partners)
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Transportadora',
    responsible_name TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    city TEXT,
    state TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabela de Serviços de Parceiros na Viagem (trip_partners)
CREATE TABLE IF NOT EXISTS public.trip_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE RESTRICT,
    service_description TEXT NOT NULL,
    agreed_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'contratado',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tabela de Logs de Auditoria (audit_logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details TEXT,
    user_name TEXT NOT NULL DEFAULT 'Equipe Raon System'
);

-- 11. Tabela de Configurações da Agência (app_settings)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY DEFAULT 'dinho_main_config',
    agency_name TEXT NOT NULL DEFAULT 'RAON SYSTEM',
    cnpj TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pix_key TEXT,
    pix_key_type TEXT,
    bank_name TEXT,
    bank_account TEXT,
    logo_url TEXT,
    terms_and_conditions TEXT,
    pending_reservation_expiration_hours INTEGER DEFAULT 48,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de desempenho
CREATE INDEX IF NOT EXISTS idx_trips_slug ON public.trips(slug);
CREATE INDEX IF NOT EXISTS idx_registrations_trip ON public.trip_registrations(trip_id);
CREATE INDEX IF NOT EXISTS idx_registrations_traveler ON public.trip_registrations(traveler_id);
CREATE INDEX IF NOT EXISTS idx_payments_registration ON public.registration_payments(registration_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip ON public.expenses(trip_id);

-- Storage bucket para documentos de viagem
INSERT INTO storage.buckets (id, name, public) 
VALUES ('trip-documents', 'trip-documents', false)
ON CONFLICT (id) DO NOTHING;
`;
