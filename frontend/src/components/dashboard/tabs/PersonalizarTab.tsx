import { Camera, Store, Instagram, Copy, Calendar, ShoppingBag, Layers, CheckCircle2, Loader2, Save, Check } from 'lucide-react'

interface PersonalizarTabProps {
  handleBrandingSubmit: (e: any) => void
  brandingForm: any
  setBrandingForm: (form: any) => void
  brandingAvatarInputRef: any
  handleBrandingAvatarChange: (e: any) => void
  brandingBannerInputRef: any
  handleBrandingBannerChange: (e: any) => void
  adminInfo: any
  subscription: any
  showToast: (msg: string, type?: 'success' | 'error') => void
  savingBranding?: boolean
  brandingSuccess?: boolean
}

export function PersonalizarTab({
  handleBrandingSubmit,
  brandingForm,
  setBrandingForm,
  brandingAvatarInputRef,
  handleBrandingAvatarChange,
  brandingBannerInputRef,
  handleBrandingBannerChange,
  adminInfo,
  subscription,
  showToast,
  savingBranding = false,
  brandingSuccess = false,
}: PersonalizarTabProps) {
  return (
    <div className="animate-slide-up space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Personalizar Página & Perfil</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configure o modelo de atuação, identidade visual e banner do seu negócio</p>
        </div>
        {brandingSuccess && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider animate-slide-up">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Alterações Salvas!
          </div>
        )}
      </div>

      {/* Grid layout: Left = Form, Right = Mobile Simulator Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* CONFIGURATIONS COLUMN (left 7 cols) */}
        <form onSubmit={handleBrandingSubmit} className="lg:col-span-7 card-simple p-4 sm:p-8 space-y-6 border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-[#131826]">
          
          {/* Business Type & Profile */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-800">Modelo de Atuação</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setBrandingForm({ ...brandingForm, businessType: 'SERVICES' })}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all ${
                  (brandingForm.businessType || 'SERVICES') === 'SERVICES'
                    ? 'bg-pink-500/10 border-pink-500 text-white shadow-md'
                    : 'bg-slate-50 dark:bg-[#1A2235] border-slate-200 dark:border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <Calendar className="w-5 h-5 text-pink-400" />
                  {(brandingForm.businessType || 'SERVICES') === 'SERVICES' && (
                    <CheckCircle2 className="w-4 h-4 text-pink-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Serviços Autônomos</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Agendamentos por horário</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBrandingForm({ ...brandingForm, businessType: 'PRODUCTS' })}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all ${
                  brandingForm.businessType === 'PRODUCTS'
                    ? 'bg-pink-500/10 border-pink-500 text-white shadow-md'
                    : 'bg-slate-50 dark:bg-[#1A2235] border-slate-200 dark:border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <ShoppingBag className="w-5 h-5 text-pink-400" />
                  {brandingForm.businessType === 'PRODUCTS' && (
                    <CheckCircle2 className="w-4 h-4 text-pink-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Venda sob Encomenda</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Cardápio & Produção</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBrandingForm({ ...brandingForm, businessType: 'HYBRID' })}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all ${
                  brandingForm.businessType === 'HYBRID'
                    ? 'bg-pink-500/10 border-pink-500 text-white shadow-md'
                    : 'bg-slate-50 dark:bg-[#1A2235] border-slate-200 dark:border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  {brandingForm.businessType === 'HYBRID' && (
                    <CheckCircle2 className="w-4 h-4 text-pink-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Ambos / Híbrido</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Serviços e Encomendas</p>
                </div>
              </button>
            </div>
          </div>

          {/* Business Name and Description */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-800">Informações do Perfil</h3>
            
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Nome do Negócio</label>
              <input
                type="text"
                value={brandingForm.businessName}
                onChange={e => setBrandingForm({ ...brandingForm, businessName: e.target.value })}
                placeholder="Ex: Barber Shop Elite ou Doceria Gourmet"
                className="w-full input-simple font-bold text-sm bg-slate-50 dark:bg-[#1A2235]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Descrição / Bio</label>
              <textarea
                value={brandingForm.description}
                onChange={e => setBrandingForm({ ...brandingForm, description: e.target.value })}
                placeholder="Descreva seu negócio, sua equipe ou seus diferenciais..."
                className="w-full input-simple font-bold text-sm resize-none h-24 bg-slate-50 dark:bg-[#1A2235]"
              ></textarea>
            </div>
          </div>

          {/* Profile Photo and Cover Banner Images */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-800">Imagens de Identidade</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Logo / Avatar upload */}
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Foto / Logotipo</label>
                <div className="flex items-center gap-4">
                  <div 
                    onClick={() => brandingAvatarInputRef.current?.click()}
                    className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#1A2235] hover:border-pink-500 transition-all cursor-pointer overflow-hidden flex items-center justify-center flex-shrink-0"
                  >
                    {brandingForm.photoUrl ? (
                      <img src={brandingForm.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={brandingAvatarInputRef}
                      onChange={handleBrandingAvatarChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => brandingAvatarInputRef.current?.click()}
                      className="text-xs font-bold text-pink-500 hover:underline uppercase tracking-wider block"
                    >
                      Carregar Foto
                    </button>
                    {brandingForm.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setBrandingForm({ ...brandingForm, photoUrl: '' })}
                        className="text-xs font-bold text-red-500 hover:underline uppercase tracking-wider block mt-1"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Banner upload */}
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Imagem de Capa (Banner)</label>
                <div className="flex items-center gap-4">
                  <div 
                    onClick={() => brandingBannerInputRef.current?.click()}
                    className="w-24 h-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#1A2235] hover:border-pink-500 transition-all cursor-pointer overflow-hidden flex items-center justify-center flex-shrink-0"
                  >
                    {brandingForm.bannerUrl ? (
                      <img src={brandingForm.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={brandingBannerInputRef}
                      onChange={handleBrandingBannerChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => brandingBannerInputRef.current?.click()}
                      className="text-xs font-bold text-pink-500 hover:underline uppercase tracking-wider block"
                    >
                      Carregar Banner
                    </button>
                    {brandingForm.bannerUrl ? (
                      <button
                        type="button"
                        onClick={() => setBrandingForm({ ...brandingForm, bannerUrl: '' })}
                        className="text-xs font-bold text-red-500 hover:underline uppercase tracking-wider block mt-1"
                      >
                        Usar Gradiente
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block mt-1">Usando gradiente de cores</span>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Colors, Presets and Theme styling */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-800">Estilo e Cores</h3>
            
            {/* Theme selector */}
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Tema da Página</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBrandingForm({ ...brandingForm, publicTheme: 'light' })}
                  className={`py-3 px-4 rounded-xl border text-xs font-black transition-all uppercase tracking-wider ${
                    brandingForm.publicTheme === 'light'
                      ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-500/10 text-orange-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Modo Claro
                </button>
                <button
                  type="button"
                  onClick={() => setBrandingForm({ ...brandingForm, publicTheme: 'dark' })}
                  className={`py-3 px-4 rounded-xl border text-xs font-black transition-all uppercase tracking-wider ${
                    brandingForm.publicTheme === 'dark'
                      ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-500/10 text-orange-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Modo Escuro
                </button>
              </div>
            </div>

            {/* Accent / Secondary Color inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Cor Principal (Destaque)</label>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#1A2235] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <input
                    type="color"
                    value={brandingForm.accentColor}
                    onChange={e => setBrandingForm({ ...brandingForm, accentColor: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent p-0 overflow-hidden"
                  />
                  <span className="text-xs font-mono font-black uppercase text-slate-600 dark:text-slate-300">
                    {brandingForm.accentColor}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Cor Secundária</label>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#1A2235] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <input
                    type="color"
                    value={brandingForm.secondaryColor}
                    onChange={e => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent p-0 overflow-hidden"
                  />
                  <span className="text-xs font-mono font-black uppercase text-slate-600 dark:text-slate-300">
                    {brandingForm.secondaryColor}
                  </span>
                </div>
              </div>
            </div>

            {/* Presets */}
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2">Presets de Cores</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Sunset', primary: '#f97316', secondary: '#ec4899' },
                  { name: 'Ocean', primary: '#0ea5e9', secondary: '#2563eb' },
                  { name: 'Forest', primary: '#10b981', secondary: '#059669' },
                  { name: 'Grape', primary: '#8b5cf6', secondary: '#d946ef' },
                  { name: 'Crimson', primary: '#ef4444', secondary: '#b91c1c' },
                ].map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setBrandingForm({ ...brandingForm, accentColor: preset.primary, secondaryColor: preset.secondary })}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-all bg-white dark:bg-[#131826]"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }}
                    />
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Domain and Subdomain Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-800">Endereço e Domínio</h3>
            
            {/* Wildcard Subdomain display */}
            <div className="bg-slate-50 dark:bg-[#1A2235] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase">Subdomínio Grátis</label>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {adminInfo ? `${adminInfo.username}.boramarka.com.br` : '...'}
              </p>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                Sua página pública resolve diretamente com este subdomínio de forma transparente!
              </span>
            </div>

            {/* Custom Domain Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase">Domínio Próprio</label>
                {subscription?.plan !== 'premium' && (
                  <span className="text-[9px] font-black uppercase tracking-wider text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded-full">
                    Recurso Premium
                  </span>
                )}
              </div>
              
              {subscription?.plan === 'premium' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={brandingForm.customDomain || ''}
                    onChange={e => setBrandingForm({ ...brandingForm, customDomain: e.target.value })}
                    placeholder="ex: agendar.meusalao.com.br"
                    className="w-full input-simple font-bold text-sm bg-slate-50 dark:bg-[#1A2235]"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Aponte o registro <strong>CNAME</strong> do seu domínio próprio para <strong>cname.boramarka.com.br</strong> e depois salve o domínio desejado acima.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-br from-pink-500/5 to-orange-500/5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl text-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  </div>
                  <div className="space-y-1 text-left">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Domínio Próprio Bloqueado</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Mapear seu domínio próprio (ex: <code>agendar.meusalao.com</code>) é uma funcionalidade exclusiva do <strong>Plano Premium</strong>. Faça o upgrade na aba "Assinatura" para habilitar!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Instagram Bio Link Helper */}
            <div className="bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-orange-500/10 p-4 rounded-2xl border border-pink-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
                  <Instagram className="w-4 h-4" /> Link Otimizado para Bio do Instagram
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const link = `https://boramarka.com.br/p/${adminInfo?.username}?utm_source=instagram`
                    navigator.clipboard.writeText(link)
                    showToast('Link do Instagram copiado para a área de transferência!', 'success')
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white font-extrabold text-[10px] rounded-xl transition-all shadow-md flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                >
                  <Copy className="w-3 h-3" /> Copiar Link Bio
                </button>
              </div>
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
                Copie este link com rastreamento UTM ativado para colocar na biografia do seu perfil do Instagram:
              </p>
              <code className="block text-[11px] font-mono font-bold text-pink-600 dark:text-pink-300 bg-white/60 dark:bg-black/30 p-2 rounded-xl border border-pink-500/20 truncate select-all">
                {`https://boramarka.com.br/p/${adminInfo?.username || 'empresa'}?utm_source=instagram`}
              </code>
            </div>
          </div>

          {/* Feedback banner right above the button when saved */}
          {brandingSuccess && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-sm font-semibold shadow-sm animate-slide-up">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <Check className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-sm text-slate-900 dark:text-white">Identidade visual salva com sucesso!</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">As configurações da sua loja foram atualizadas e já estão visíveis.</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={savingBranding}
            className={`w-full py-5 rounded-2xl text-white font-black text-lg transition-all shadow-xl flex items-center justify-center gap-3 mt-4 relative overflow-hidden ${
              savingBranding
                ? 'bg-gradient-to-r from-orange-400 to-pink-400 cursor-wait opacity-90'
                : brandingSuccess
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/25 hover:opacity-95'
                : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-pink-500/20 active:scale-[0.99] cursor-pointer'
            }`}
          >
            {savingBranding ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-white" />
                <span>Salvando alterações...</span>
              </>
            ) : brandingSuccess ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-white" />
                <span>Salvo com Sucesso!</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5 text-white/90" />
                <span>Salvar Identidade Visual</span>
              </>
            )}
          </button>
        </form>

        {/* SIMULATOR PREVIEW COLUMN (right 5 cols) */}
        <div className="lg:col-span-5 flex justify-center lg:sticky lg:top-6">
          <div className="w-[310px] max-w-full h-[620px] bg-slate-900 rounded-[40px] sm:rounded-[50px] border-[6px] sm:border-[8px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col">
            
            {/* Speaker notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full z-30 flex items-center justify-center">
              <div className="w-10 h-1 bg-slate-700 rounded-full mb-1" />
            </div>

            {/* Dynamic Simulated Page Content */}
            <div className={`flex-1 overflow-y-auto overflow-x-hidden ${
              brandingForm.publicTheme === 'dark' ? 'dark bg-[#0B0F19] text-white' : 'bg-slate-50 text-slate-900'
            } transition-all duration-200 text-left pt-0 pb-10`}>
              
              {/* Custom cover/banner preview */}
              <div 
                className="h-28 w-full relative bg-cover bg-center"
                style={brandingForm.bannerUrl ? { backgroundImage: `url(${brandingForm.bannerUrl})` } : { background: `linear-gradient(135deg, ${brandingForm.accentColor}, ${brandingForm.secondaryColor})` }}
              >
                <div className="absolute inset-0 bg-black/15"></div>
                {!brandingForm.bannerUrl && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>}
              </div>

              {/* Header Avatar and Business Name Card */}
              <div className="px-4 pb-4 -mt-8 relative z-10 text-center">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-2.5 shadow-lg flex items-center justify-center text-white text-2xl font-black overflow-hidden border-4 border-white dark:border-[#131826]"
                  style={{ 
                    background: `linear-gradient(to right, ${brandingForm.accentColor}, ${brandingForm.secondaryColor})`,
                    boxShadow: `0 8px 20px -3px ${brandingForm.accentColor}30`
                  }}
                >
                  {brandingForm.photoUrl ? (
                    <img src={brandingForm.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (brandingForm.businessName || 'B')[0].toUpperCase()
                  )}
                </div>
                
                <h4 className="text-sm font-black tracking-tight mb-1 text-slate-900 dark:text-white truncate">
                  {brandingForm.businessName || 'Nome do seu Negócio'}
                </h4>
                
                <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium px-2 leading-tight">
                  {brandingForm.description || 'Sua descrição ou biografia aparecerá aqui para seus clientes.'}
                </p>
                
                {/* Fake contact buttons */}
                <div className="flex justify-center gap-1.5 mt-3">
                  <span className="flex items-center gap-1 text-[8px] font-bold text-white uppercase tracking-widest bg-[#25D366] px-2.5 py-1 rounded-full shadow-md">
                    WhatsApp
                  </span>
                  <span className="flex items-center gap-1 text-[8px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                    Localização
                  </span>
                </div>
              </div>

              {/* Mock Catalog Items */}
              <div className="px-3 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-[9px] font-black uppercase tracking-wider text-slate-950 dark:text-white">
                    {brandingForm.businessType === 'PRODUCTS' ? 'Cardápio / Encomendas' : 'Nosso Catálogo'}
                  </h5>
                  <div className="h-[1.5px] flex-1 bg-slate-200 dark:bg-slate-800 ml-2 rounded-full"></div>
                </div>

                <div className="space-y-2">
                  {(
                    brandingForm.businessType === 'PRODUCTS'
                      ? [
                          { name: 'Bolo Vulcão Ninho & Nutella', price: 85.0, detail: 'Prazo: 2 dias • Encomenda', badge: 'Sob Encomenda' },
                          { name: 'Kit Doces Finos Gourmet (50 un)', price: 120.0, detail: 'Prazo: 3 dias • Encomenda', badge: 'Mais Pedido' },
                        ]
                      : brandingForm.businessType === 'HYBRID'
                      ? [
                          { name: 'Sessão / Atendimento Individual', price: 90.0, detail: '45 min • Horário Marcado', badge: 'Serviço' },
                          { name: 'Kit Artesanal Personalizado', price: 110.0, detail: 'Prazo: 2 dias • Produção', badge: 'Encomenda' },
                        ]
                      : [
                          { name: 'Corte Social Masculino', price: 45.0, detail: '30 min • Agendamento', badge: 'Serviço' },
                          { name: 'Barba Terapia Completa', price: 35.0, detail: '20 min • Agendamento', badge: 'Serviço' },
                        ]
                  ).map((item, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white dark:bg-[#131826] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-all flex flex-col justify-between shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-1 gap-1">
                        <span className="font-black text-[10px] text-slate-950 dark:text-white leading-tight">
                          {item.name}
                        </span>
                        <span 
                          className="font-black text-[10px] whitespace-nowrap shrink-0"
                          style={{ color: brandingForm.accentColor || '#f97316' }}
                        >
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[8px] text-slate-400 font-bold tracking-tight">
                          {item.detail}
                        </span>
                        <span 
                          className="text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                          style={{ 
                            backgroundColor: `${brandingForm.accentColor || '#f97316'}15`,
                            color: brandingForm.accentColor || '#f97316'
                          }}
                        >
                          {item.badge}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
