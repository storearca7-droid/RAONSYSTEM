import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Check,
  AlertCircle,
  MessageCircle,
  X,
  Tag,
  Package,
  Edit2,
  Trash2,
  Sparkles,
  TrendingUp,
  UserCheck,
  RotateCcw,
  ShieldCheck,
  ExternalLink,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory } from '../../types';
import { formatBRL, formatCPF, buildWhatsAppLink } from '../../lib/utils';

export const ProductsView: React.FC = () => {
  const {
    products,
    createProduct,
    updateProduct,
    deleteProduct,
    buyProduct,
    resetProductsToInitial,
    travelers,
    settings,
  } = useApp();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock'>('all');

  // Purchase Modal State
  const [buyingProduct, setBuyingProduct] = useState<Product | null>(null);
  const [buyQuantity, setBuyQuantity] = useState<number>(1);
  const [buyerCpf, setBuyerCpf] = useState<string>('');
  const [buyerName, setBuyerName] = useState<string>('');
  const [deliveryOption, setDeliveryOption] = useState<string>('Entregar no dia do embarque');
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<{
    whatsappUrl: string;
    productName: string;
    quantity: number;
    totalAmount: number;
  } | null>(null);

  // Admin Product Form Modal (Create / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ProductCategory>('Vestuário');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<number>(50);
  const [formStock, setFormStock] = useState<number>(20);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formBadge, setFormBadge] = useState('');

  // Computed: stats
  const totalItemsInStock = useMemo(
    () => products.reduce((acc, p) => acc + (p.stock || 0), 0),
    [products]
  );
  const totalInventoryValue = useMemo(
    () => products.reduce((acc, p) => acc + (p.stock || 0) * (p.price || 0), 0),
    [products]
  );

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Search filter
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.badge && p.badge.toLowerCase().includes(searchTerm.toLowerCase()));

      // Category filter
      const matchesCategory =
        selectedCategory === 'all' || p.category === selectedCategory;

      // Stock filter
      let matchesStock = true;
      if (stockFilter === 'in_stock') {
        matchesStock = p.stock > 0;
      } else if (stockFilter === 'low_stock') {
        matchesStock = p.stock > 0 && p.stock <= 10;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, selectedCategory, stockFilter]);

  // Categories present in catalog
  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'Todos os Produtos' },
    { id: 'Vestuário', label: 'Vestuário' },
    { id: 'Eletrônicos', label: 'Eletrônicos' },
    { id: 'Utilidades', label: 'Utilidades' },
    { id: 'Acessórios', label: 'Acessórios' },
  ];

  // Helper: auto-detect registered traveler when CPF changes
  const detectedTraveler = useMemo(() => {
    const clean = buyerCpf.replace(/\D/g, '');
    if (clean.length === 11) {
      return travelers.find(t => t.cpf.replace(/\D/g, '') === clean);
    }
    return null;
  }, [buyerCpf, travelers]);

  // Handle open purchase modal
  const handleOpenBuyModal = (prod: Product) => {
    setBuyingProduct(prod);
    setBuyQuantity(1);
    setBuyerCpf('');
    setBuyerName('');
    setDeliveryOption('Entregar no dia do embarque');
    setPurchaseError(null);
    setPurchaseSuccess(null);
  };

  // Handle submit purchase
  const handleConfirmPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyingProduct) return;

    const cleanCpf = buyerCpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      setPurchaseError('Por favor, informe um CPF válido com 11 dígitos.');
      return;
    }

    if (buyQuantity <= 0) {
      setPurchaseError('A quantidade deve ser no mínimo 1 unidade.');
      return;
    }

    if (buyQuantity > buyingProduct.stock) {
      setPurchaseError(`Estoque insuficiente! Restam apenas ${buyingProduct.stock} unidade(s).`);
      return;
    }

    // Call buyProduct from AppContext
    const res = buyProduct(buyingProduct.id, cleanCpf, buyQuantity, deliveryOption);

    if (!res.success) {
      setPurchaseError(res.message);
      return;
    }

    // Success state
    const totalAmount = buyingProduct.price * buyQuantity;
    setPurchaseSuccess({
      whatsappUrl: res.whatsappUrl,
      productName: buyingProduct.name,
      quantity: buyQuantity,
      totalAmount,
    });

    // Auto open WhatsApp in new window
    if (res.whatsappUrl) {
      window.open(res.whatsappUrl, '_blank');
    }
  };

  // Admin: Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('Vestuário');
    setFormDescription('');
    setFormPrice(49.9);
    setFormStock(20);
    setFormImageUrl('/images/products/bone.jpg');
    setFormBadge('Novo');
    setIsFormOpen(true);
  };

  // Admin: Open Edit Modal
  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormDescription(prod.description);
    setFormPrice(prod.price);
    setFormStock(prod.stock);
    setFormImageUrl(prod.imageUrl);
    setFormBadge(prod.badge || '');
    setIsFormOpen(true);
  };

  // Admin: Save product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formName.trim(),
        category: formCategory,
        description: formDescription.trim(),
        price: Number(formPrice) || 0,
        stock: Number(formStock) || 0,
        imageUrl: formImageUrl.trim(),
        badge: formBadge.trim() || undefined,
      });
    } else {
      createProduct({
        name: formName.trim(),
        category: formCategory,
        description: formDescription.trim(),
        price: Number(formPrice) || 0,
        stock: Number(formStock) || 0,
        imageUrl: formImageUrl.trim(),
        badge: formBadge.trim() || undefined,
        availableDuringTrip: true,
      });
    }

    setIsFormOpen(false);
  };

  // Admin: Delete product
  const handleDeleteProduct = (prod: Product) => {
    if (confirm(`Deseja realmente remover o produto "${prod.name}" da loja?`)) {
      deleteProduct(prod.id);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Overview */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-orange-600 via-amber-600 to-orange-500 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Loja Oficial da Agência — Raon System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Produtos & Acessórios de Viagem
            </h1>
            <p className="text-xs sm:text-sm text-orange-100 leading-relaxed">
              Itens disponíveis para venda antes e durante as viagens (Bonés, Camisas UV50+, Power Banks, Fones e Baterias).
              Ao clicar em comprar, o viajante informa o CPF e é direcionado diretamente ao WhatsApp da agência para efetuar o pagamento.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-orange-700 shadow-md transition-all hover:bg-orange-50 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Produto</span>
            </button>
            <button
              onClick={() => {
                if (confirm('Deseja recarregar o catálogo padrão da Raon System com os 6 produtos oficiais (Bonés, Camisas UV, Power Banks, Fones e Baterias)?')) {
                  resetProductsToInitial();
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-white/20 hover:bg-white/30 px-3.5 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition-colors"
              title="Restaurar os 6 produtos padrão da agência"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restaurar Catálogo</span>
            </button>
          </div>
        </div>

        {/* Decorative Circle Background */}
        <div className="absolute -right-12 -bottom-16 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Package className="h-4 w-4 text-orange-600" />
            <span>Total de Itens</span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {products.length}
          </div>
          <span className="text-[11px] text-slate-500">produtos cadastrados</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span>Estoque Disponível</span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            {totalItemsInStock}
          </div>
          <span className="text-[11px] text-slate-500">unidades em estoque</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Tag className="h-4 w-4 text-purple-600" />
            <span>Valor em Estoque</span>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-slate-900">
            {formatBRL(totalInventoryValue)}
          </div>
          <span className="text-[11px] text-slate-500">avaliação total dos itens</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <MessageCircle className="h-4 w-4 text-emerald-600" />
            <span>WhatsApp da Loja</span>
          </div>
          <div className="mt-2 text-sm sm:text-base font-black text-slate-800 truncate">
            {settings.whatsapp || '(82) 99824-1020'}
          </div>
          <span className="text-[11px] text-slate-500">canal direto de pagamento</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, camisa, boné, fone, power bank..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:bg-white focus:outline-hidden"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Categories Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Nenhum produto encontrado
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Não encontramos produtos para os filtros aplicados. Você pode limpar a busca ou recarregar os itens padrão.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setStockFilter('all');
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Limpar Filtros
            </button>
            <button
              onClick={() => resetProductsToInitial()}
              className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 shadow-xs"
            >
              Restaurar Catálogo Oficial
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => {
            const isOutOfStock = product.stock <= 0;
            const isLowStock = product.stock > 0 && product.stock <= 10;

            return (
              <div
                key={product.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 hover:shadow-lg hover:border-orange-200"
              >
                {/* Image Section */}
                <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={e => {
                      (e.target as HTMLImageElement).src = '/images/products/bone.jpg';
                    }}
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />

                  {/* Top Badge */}
                  {product.badge && (
                    <span className="absolute top-3 left-3 rounded-full bg-orange-600/95 px-3 py-1 text-[11px] font-bold text-white shadow-md backdrop-blur-xs">
                      {product.badge}
                    </span>
                  )}

                  {/* Top-Right Category Badge */}
                  <span className="absolute top-3 right-3 rounded-full bg-slate-900/70 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-xs">
                    {product.category}
                  </span>

                  {/* Stock Pill on bottom of image */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white drop-shadow-md">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold backdrop-blur-md ${
                        isOutOfStock
                          ? 'bg-rose-600/90 text-white'
                          : isLowStock
                          ? 'bg-amber-500/90 text-white'
                          : 'bg-emerald-600/90 text-white'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      {isOutOfStock
                        ? 'Esgotado'
                        : `${product.stock} un. disponíveis`}
                    </span>

                    {/* Admin quick edit buttons */}
                    <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleOpenEditModal(product);
                        }}
                        className="rounded-lg bg-white/80 hover:bg-white p-1.5 text-slate-800 shadow-xs transition-colors"
                        title="Editar produto"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteProduct(product);
                        }}
                        className="rounded-lg bg-white/80 hover:bg-rose-50 p-1.5 text-rose-600 shadow-xs transition-colors"
                        title="Excluir produto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-1 group-hover:text-orange-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Pricing and Buy Button */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Valor Unitário
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-slate-900">
                        {formatBRL(product.price)}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleOpenBuyModal(product)}
                      className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-extrabold shadow-md transition-all ${
                        isOutOfStock
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-orange-600 text-white hover:bg-orange-700 active:scale-95 shadow-orange-500/20'
                      }`}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>{isOutOfStock ? 'Esgotado' : 'Comprar'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: COMPRAR PRODUTO (Pede CPF e Redireciona para o WhatsApp) */}
      {buyingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setBuyingProduct(null)}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 shrink-0">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Comprar {buyingProduct.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Informe seu CPF para confirmação e fale diretamente com o WhatsApp da agência.
                </p>
              </div>
            </div>

            {purchaseSuccess ? (
              /* Success Confirmation view */
              <div className="py-6 space-y-5 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-md">
                  <Check className="h-8 w-8 stroke-[3]" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xl font-black text-slate-900">
                    Pedido Iniciado com Sucesso!
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
                    Seu pedido de <strong>{purchaseSuccess.quantity}x {purchaseSuccess.productName}</strong> no total de <strong>{formatBRL(purchaseSuccess.totalAmount)}</strong> foi registrado.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-900 text-left space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-950">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Estoque reservado e canal de WhatsApp aberto</span>
                  </div>
                  <p>
                    Caso a janela do WhatsApp não tenha aberto automaticamente, clique no botão abaixo para conversar com a equipe Raon System e efetuar o pagamento via PIX.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <a
                    href={purchaseSuccess.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3.5 px-4 font-bold text-white text-sm shadow-md transition-all"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Abrir Conversa no WhatsApp</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button
                    onClick={() => setBuyingProduct(null)}
                    className="rounded-2xl border border-slate-200 px-5 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              /* Purchase Form */
              <form onSubmit={handleConfirmPurchase} className="mt-5 space-y-5">
                {/* Product Summary Card */}
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5">
                  <img
                    src={buyingProduct.imageUrl}
                    alt={buyingProduct.name}
                    className="h-16 w-16 rounded-xl object-cover shrink-0"
                    onError={e => {
                      (e.target as HTMLImageElement).src = '/images/products/bone.jpg';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase text-orange-600">
                      {buyingProduct.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {buyingProduct.name}
                    </h4>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="font-bold text-slate-900">
                        {formatBRL(buyingProduct.price)} / un
                      </span>
                      <span className="font-semibold text-emerald-600 text-[11px]">
                        {buyingProduct.stock} disponíveis
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quantity Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Quantidade desejada
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setBuyQuantity(q => Math.max(1, q - 1))}
                      disabled={buyQuantity <= 1}
                      className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="font-mono text-lg font-black text-slate-900 w-10 text-center">
                      {buyQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setBuyQuantity(q => Math.min(buyingProduct.stock, q + 1))
                      }
                      disabled={buyQuantity >= buyingProduct.stock}
                      className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                    >
                      +
                    </button>
                    <div className="ml-auto text-right">
                      <span className="text-[11px] text-slate-400 block">Total a pagar:</span>
                      <span className="text-lg font-black text-orange-600">
                        {formatBRL(buyingProduct.price * buyQuantity)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CPF Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Seu CPF <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={buyerCpf}
                    onChange={e => setBuyerCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Digite apenas números. Utilizado para localizar seu cadastro ou vincular à sua viagem.
                  </p>

                  {/* Registered Traveler Recognition Box */}
                  {detectedTraveler && (
                    <div className="mt-2 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-medium">
                      <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>
                        Viajante identificado: <strong>{detectedTraveler.fullName}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Delivery Option */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Como prefere receber seu item?
                  </label>
                  <select
                    value={deliveryOption}
                    onChange={e => setDeliveryOption(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs sm:text-sm text-slate-800 font-medium focus:border-orange-500 focus:outline-hidden"
                  >
                    <option value="Entregar no dia do embarque no ônibus/transporte">
                      Entregar no dia do embarque (no ônibus ou ponto de encontro)
                    </option>
                    <option value="Receber com antecedência na sede da Raon System">
                      Retirar com antecedência na sede da agência
                    </option>
                    <option value="Receber durante a viagem no destino">
                      Receber durante a viagem diretamente com o guia
                    </option>
                  </select>
                </div>

                {/* Error Banner */}
                {purchaseError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{purchaseError}</span>
                  </div>
                )}

                {/* Info Note */}
                <div className="rounded-xl bg-orange-50/70 border border-orange-200/80 p-3 text-[11px] text-orange-950 flex items-start gap-2">
                  <MessageCircle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                  <span>
                    Ao confirmar, você será redirecionado para conversar diretamente com a equipe da <strong>Raon System</strong> no WhatsApp para envio da chave PIX e confirmação da reserva do item.
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setBuyingProduct(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all active:scale-95"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Finalizar Compra via WhatsApp</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADMIN NOVO / EDITAR PRODUTO */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 shrink-0">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
                </h3>
                <p className="text-xs text-slate-500">
                  Defina nome, valor, estoque e foto do item vendido pela agência.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nome do Produto <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ex: Boné Oficial Raon System, Camisa UV..."
                  className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-slate-800 font-medium focus:border-orange-500 focus:outline-hidden text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as ProductCategory)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-slate-800 font-medium focus:border-orange-500 focus:outline-hidden"
                  >
                    <option value="Vestuário">Vestuário</option>
                    <option value="Eletrônicos">Eletrônicos</option>
                    <option value="Utilidades">Utilidades</option>
                    <option value="Acessórios">Acessórios</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Selo / Destaque (Badge)
                  </label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={e => setFormBadge(e.target.value)}
                    placeholder="Ex: Mais Vendido, Novidade..."
                    className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-slate-800 font-medium focus:border-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Valor (R$) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPrice}
                    onChange={e => setFormPrice(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-slate-800 font-bold focus:border-orange-500 focus:outline-hidden text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Estoque Disponível <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formStock}
                    onChange={e => setFormStock(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-slate-800 font-bold focus:border-orange-500 focus:outline-hidden text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Foto do Produto
                </label>
                
                {/* Presets of Official Illustrations */}
                <div className="mb-2">
                  <span className="text-[11px] font-semibold text-slate-500 mb-1.5 block">
                    Escolher ilustração oficial embutida no sistema:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { label: 'Boné', url: '/images/products/bone.jpg' },
                      { label: 'Camisa UV', url: '/images/products/camisa-uv.jpg' },
                      { label: 'Power Bank', url: '/images/products/power-bank.jpg' },
                      { label: 'Fone TWS', url: '/images/products/fones-bluetooth.jpg' },
                      { label: 'Fone P2', url: '/images/products/fones-p2.jpg' },
                      { label: 'Pilhas AA', url: '/images/products/pilhas-aa.jpg' },
                    ].map(preset => (
                      <button
                        type="button"
                        key={preset.url}
                        onClick={() => setFormImageUrl(preset.url)}
                        className={`group flex flex-col items-center gap-1 p-1 rounded-xl border text-[10px] font-bold transition-all ${
                          formImageUrl === preset.url
                            ? 'border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-400/40'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-600'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="h-9 w-9 rounded-lg object-cover"
                        />
                        <span className="truncate w-full text-center">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* File Upload or Custom URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 hover:bg-slate-100 py-2.5 px-3 cursor-pointer text-slate-700 font-semibold text-xs transition-colors">
                    <Upload className="h-4 w-4 text-orange-600" />
                    <span>Upload do dispositivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setFormImageUrl(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={e => setFormImageUrl(e.target.value)}
                      placeholder="Ou cole a URL da imagem..."
                      className="w-full h-full rounded-xl border border-slate-200 py-2 px-3 text-slate-800 font-medium focus:border-orange-500 focus:outline-hidden text-xs"
                    />
                  </div>
                </div>

                {/* Preview */}
                {formImageUrl && (
                  <div className="mt-2.5 flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <img
                      src={formImageUrl}
                      alt="Preview"
                      className="h-12 w-12 rounded-lg object-cover border border-slate-200 shadow-2xs"
                      onError={e => {
                        (e.target as HTMLImageElement).src = '/images/products/bone.jpg';
                      }}
                    />
                    <div className="text-[11px] text-slate-500 truncate flex-1">
                      <span className="font-bold text-slate-700 block">Prévia da imagem</span>
                      <span className="truncate block font-mono text-[10px] text-slate-400">
                        {formImageUrl.startsWith('data:') ? 'Imagem carregada localmente (Base64)' : formImageUrl}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Descrição do Produto
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Detalhes sobre tecido, especificações técnicas, compatibilidade ou uso durante os passeios..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-slate-800 font-medium focus:border-orange-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-orange-600 hover:bg-orange-700 px-6 py-2 font-bold text-white shadow-md transition-all active:scale-95"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
