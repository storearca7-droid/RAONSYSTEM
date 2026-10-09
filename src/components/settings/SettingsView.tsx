import React, { useState } from 'react';
import {
  Settings,
  Building,
  Upload,
  Database,
  Shield,
  Download,
  UploadCloud,
  Check,
  Copy,
  AlertTriangle,
  RefreshCw,
  FileCode,
  History,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SUPABASE_SQL_MIGRATION } from '../../lib/supabase';
import { formatDateBR } from '../../lib/utils';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    supabaseStatus,
    checkSupabase,
    resetAllData,
    exportDatabaseJson,
    importDatabaseJson,
    auditLogs,
  } = useApp();

  const [agencyName, setAgencyName] = useState(settings.agencyName);
  const [cnpj, setCnpj] = useState(settings.cnpj);
  const [phone, setPhone] = useState(settings.phone);
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp);
  const [email, setEmail] = useState(settings.email);
  const [address, setAddress] = useState(settings.address);
  const [city, setCity] = useState(settings.city);
  const [state, setState] = useState(settings.state);
  const [pixKey, setPixKey] = useState(settings.pixKey);
  const [pixKeyType, setPixKeyType] = useState(settings.pixKeyType);
  const [bankName, setBankName] = useState(settings.bankName);
  const [bankAccount, setBankAccount] = useState(settings.bankAccount);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [terms, setTerms] = useState(settings.termsAndConditions || '');
  const [expirationHours, setExpirationHours] = useState(settings.pendingReservationExpirationHours || 48);

  // Supabase credentials
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabaseAnonKey || '');
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLogoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAgencySettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      agencyName,
      cnpj,
      phone,
      whatsapp,
      email,
      address,
      city,
      state,
      pixKey,
      pixKeyType,
      bankName,
      bankAccount,
      logoUrl,
      termsAndConditions: terms,
      pendingReservationExpirationHours: Number(expirationHours),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleTestAndSaveSupabase = async () => {
    setIsTestingSupabase(true);
    const result = await checkSupabase(supabaseUrl, supabaseAnonKey);
    setIsTestingSupabase(false);

    if (result.success || (supabaseUrl && supabaseAnonKey)) {
      updateSettings({
        supabaseUrl,
        supabaseAnonKey,
        useSupabase: true,
      });
      alert(result.message);
    } else {
      alert(`Atenção: ${result.message}`);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleDownloadBackup = () => {
    const json = exportDatabaseJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_dinho_tour_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const res = importDatabaseJson(content);
        alert(res.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Configurações da Agência & Integrações
        </h2>
        <p className="text-xs text-slate-500">
          Dados institucionais, chave Pix de recebimento, banco de dados Supabase e backups
        </p>
      </div>

      {/* SECTION 1: DADOS DA AGÊNCIA & LOGO */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <Building className="h-5 w-5 text-orange-600" />
          <h3 className="font-bold text-base text-slate-900">
            Identidade Oficial da Raon System
          </h3>
        </div>

        <form onSubmit={handleSaveAgencySettings} className="space-y-6">
          {/* Logo Upload Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Logo Oficial da Raon System
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-xs flex items-center justify-center">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo Raon System"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="font-extrabold text-orange-600 text-xl">RS</span>
                )}
              </div>

              <div className="space-y-1.5 text-center sm:text-left">
                <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors shadow-xs">
                  <Upload className="h-4 w-4 text-slate-500" />
                  <span>Substituir Logo (PNG ou JPG)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400">
                  Recomendado imagem quadrada com fundo transparente ou escuro.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Comercial da Agência
              </label>
              <input
                type="text"
                value={agencyName}
                onChange={e => setAgencyName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">CNPJ</label>
              <input
                type="text"
                value={cnpj}
                onChange={e => setCnpj(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WhatsApp Oficial
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone Fixo
              </label>
              <input
                type="text"
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

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cidade</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>
              <div className="w-14">
                <label className="block text-xs font-semibold text-slate-700 mb-1">UF</label>
                <input
                  type="text"
                  maxLength={2}
                  value={state}
                  onChange={e => setState(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs text-center focus:border-orange-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Dados Bancários & Pix */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Dados para Recebimento Pix & Depósito
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo da Chave Pix
                </label>
                <select
                  value={pixKeyType}
                  onChange={e => setPixKeyType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white"
                >
                  <option value="CNPJ">CNPJ</option>
                  <option value="CPF">CPF</option>
                  <option value="Email">E-mail</option>
                  <option value="Telefone">Telefone</option>
                  <option value="Aleatória">Chave Aleatória</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chave Pix Oficial
                </label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={e => setPixKey(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Banco</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agência e Conta Corrente
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={e => setBankAccount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Regra de Reserva */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Política de Expiração de Reservas Pendentes
            </h4>
            <div className="max-w-xs">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tempo limite para confirmação (Horas)
              </label>
              <input
                type="number"
                min="1"
                value={expirationHours}
                onChange={e => setExpirationHours(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold tabular-nums"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Inscrições sem validação ou pagamento prévio serão sinalizadas após esse prazo.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            {saveSuccess && (
              <span className="text-xs font-semibold text-emerald-600">
                ✓ Configurações salvas com sucesso!
              </span>
            )}
            <button
              type="submit"
              className="rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-orange-700"
            >
              Salvar Dados da Agência
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: CONEXÃO SUPABASE / POSTGRESQL */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Database className="h-5 w-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Banco de Dados & Autenticação (Supabase PostgreSQL)
              </h3>
              <p className="text-xs text-slate-500">
                Conecte seu banco de dados persistente em nuvem com PostgreSQL e Storage privado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                supabaseStatus.connected
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {supabaseStatus.connected ? '● Conectado ao Supabase' : '● Modo Local Seguro'}
            </span>
          </div>
        </div>

        {/* Status Explanation */}
        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 text-xs text-slate-600 space-y-2">
          <p className="font-semibold text-slate-800">
            {supabaseStatus.message}
          </p>
          <p>
            O Raon System funciona de forma 100% autônoma no navegador guardando todos os dados
            com segurança referencial e sem perder nada entre recargas. Para sincronizar em tempo
            real entre múltiplos dispositivos ou armazenar arquivos no bucket do Supabase, basta
            informar a URL e a Anon Key do seu projeto Supabase abaixo.
          </p>
        </div>

        {/* Credentials Inputs */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project URL do Supabase
              </label>
              <input
                type="text"
                placeholder="https://sua-instancia.supabase.co"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Anon / Public Key do Supabase
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseAnonKey}
                onChange={e => setSupabaseAnonKey(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono focus:border-orange-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestAndSaveSupabase}
              disabled={isTestingSupabase}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isTestingSupabase ? 'animate-spin' : ''}`} />
              <span>{isTestingSupabase ? 'Testando Conexão...' : 'Testar & Conectar Supabase'}</span>
            </button>
          </div>
        </div>

        {/* SQL Script Box with Copy Button */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <FileCode className="h-4 w-4 text-orange-600" />
              <span>Script SQL de Migração (14 Tabelas, Índices e Storage)</span>
            </div>
            <button
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {copiedSql ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedSql ? 'Copiado!' : 'Copiar Script SQL'}</span>
            </button>
          </div>

          <pre className="max-h-44 overflow-y-auto rounded-xl bg-slate-950 p-3 text-[11px] font-mono text-slate-300">
            {SUPABASE_SQL_MIGRATION}
          </pre>
        </div>
      </div>

      {/* SECTION 3: BACKUP E RESTAURAÇÃO JSON */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <Shield className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Cópia de Segurança & Restauração (Backup)
            </h3>
            <p className="text-xs text-slate-500">
              Exporte todos os cadastros, inscrições e relatórios em formato seguro
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="h-4 w-4 text-blue-600" />
            <span>Baixar Backup Completo (JSON)</span>
          </button>

          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs">
            <UploadCloud className="h-4 w-4 text-emerald-600" />
            <span>Restaurar de Arquivo JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (confirm('Deseja realmente restaurar os dados de fábrica? Essa ação substituirá os cadastros atuais pelos dados de demonstração da Raon System.')) {
                resetAllData();
              }
            }}
            className="text-xs text-slate-400 hover:text-rose-600 font-semibold"
          >
            Restaurar Dados de Demonstração
          </button>
        </div>
      </div>

      {/* SECTION 4: HISTÓRICO DE AUDITORIA (LOGS RECENTES) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <History className="h-5 w-5 text-slate-600" />
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Registro de Auditoria & Conformidade LGPD
            </h3>
            <p className="text-xs text-slate-500">
              Rastreabilidade de alterações cadastrais e financeiras da agência
            </p>
          </div>
        </div>

        <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
          {auditLogs.slice(0, 15).map(log => (
            <div key={log.id} className="py-2.5 flex items-start justify-between gap-4">
              <div>
                <span className="font-bold text-slate-800">{log.action}: </span>
                <span className="text-slate-600">{log.details}</span>
              </div>
              <div className="text-[11px] text-slate-400 shrink-0 text-right">
                <div>{new Date(log.timestamp).toLocaleDateString('pt-BR')}</div>
                <div>{log.user}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
