import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, PublicReviewItem } from '../services/api'
import { 
  Clock, MapPin, Phone, Instagram, Loader2, AlertCircle, 
  Star, MessageSquare, CheckCircle, Award
} from 'lucide-react'

interface ServiceData {
  id: number
  name: string
  price: number
  duration: number
  description: string | null
  token?: string | null
}

interface PublicProfileData {
  id?: number
  businessName: string
  description: string
  photoUrl: string
  phone: string
  address: string
  services: ServiceData[]
  isInactive?: boolean
  accentColor?: string
  secondaryColor?: string
  publicTheme?: string
  bannerUrl?: string
  averageRating?: number | null
  totalReviews?: number
}

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>()
  const [profile, setProfile] = useState<PublicProfileData | null>(null)
  const [reviews, setReviews] = useState<PublicReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let data: PublicProfileData;
        if (username) {
          data = await api.getPublicProfile(username)
        } else {
          const host = window.location.host
          data = await api.getPublicProfileByHost(host)
        }
        setProfile(data)

        // Se o admin tiver ID, busca as avaliações públicas
        if (data?.id) {
          const reviewsData = await api.getPublicReviews(data.id)
          setReviews(reviewsData.reviews || [])
        }
      } catch (err: any) {
        setError(err.message || 'Falha ao carregar perfil')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [username])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    } catch {
      return ''
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-slate-900 mb-2">Profissional não encontrado</h1>
          <p className="text-slate-500 mb-6">Verifique se o link está correto ou tente novamente mais tarde.</p>
          <Link to="/login" className="text-pink-500 font-bold hover:underline">Voltar ao início</Link>
        </div>
      </div>
    )
  }

  const accent = profile.accentColor || '#f97316'
  const secondary = profile.secondaryColor || '#ec4899'
  const theme = profile.publicTheme || 'light'

  const isFromInstagram = new URLSearchParams(window.location.search).get('utm_source') === 'instagram'

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-[#0B0F19]' : 'bg-slate-50'} text-slate-900 dark:text-slate-100 font-sans selection:bg-pink-500/30`}>
      <style>{`
        .custom-accent-color { color: ${accent} !important; }
        .custom-accent-hover-border:hover {
          border-color: ${accent}80 !important;
          box-shadow: 0 20px 25px -5px ${accent}15 !important;
        }
        .custom-accent-hover-text:hover {
          color: ${accent} !important;
        }
      `}</style>

      {/* Cover / Hero Background */}
      <div 
        className="h-48 sm:h-64 w-full relative overflow-hidden bg-cover bg-center"
        style={profile.bannerUrl ? { backgroundImage: `url(${profile.bannerUrl})` } : { background: `linear-gradient(135deg, ${accent}, ${secondary})` }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        {!profile.bannerUrl && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>}
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-20 -mt-20 relative z-10">
        
        {isFromInstagram && (
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white px-6 py-3 rounded-3xl mb-6 flex items-center justify-center gap-2.5 shadow-xl font-extrabold text-xs sm:text-sm animate-slide-up">
            <Instagram className="w-5 h-5 shrink-0" />
            <span>Você veio pelo Instagram! Escolha seu serviço abaixo e agende em segundos.</span>
          </div>
        )}

        {profile.isInactive && (
          <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-4 rounded-3xl mb-8 flex items-center justify-center gap-3 shadow-lg font-bold">
            <AlertCircle className="w-6 h-6 flex-shrink-0 animate-pulse" />
            <span>Agendamentos temporariamente suspensos neste estabelecimento.</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white dark:bg-[#131826] rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-100 dark:border-slate-800 text-center animate-slide-up">
          <div 
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full mx-auto mb-6 shadow-xl flex items-center justify-center text-white text-5xl font-black overflow-hidden border-4 border-white dark:border-[#131826]"
            style={{ 
              background: `linear-gradient(to right, ${accent}, ${secondary})`,
              boxShadow: `0 20px 25px -5px ${accent}40`
            }}
          >
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt={profile.businessName} className="w-full h-full object-cover" />
            ) : (
              profile.businessName[0].toUpperCase()
            )}
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">{profile.businessName}</h1>

          {/* Social Proof / Rating Badge */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {profile.averageRating ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 shadow-sm text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{profile.averageRating}</span>
                <span className="text-slate-400 font-normal">({profile.totalReviews || reviews.length} {profile.totalReviews === 1 ? 'avaliação' : 'avaliações'})</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <Award className="w-3.5 h-3.5 text-emerald-500" />
                <span>Espaço Verificado BoraMarka</span>
              </div>
            )}
          </div>

          <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto text-sm sm:text-base">
            {profile.description || 'Bem-vindo ao nosso espaço. Confira abaixo todos os nossos serviços e novidades.'}
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {profile.phone && (
              <a href={`https://wa.me/${profile.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white uppercase tracking-widest bg-[#25D366] hover:bg-[#20bd5a] px-5 py-2.5 rounded-full shadow-lg shadow-[#25D366]/20 transition-all">
                <Phone className="w-4 h-4" /> WhatsApp
              </a>
            )}
            {profile.address && (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(profile.address)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-5 py-2.5 rounded-full transition-all border border-slate-200 dark:border-slate-700">
                <MapPin className="w-4 h-4" /> Localização
              </a>
            )}
            {(!profile.phone && !profile.address) && (
              <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Entre em contato via direct</span>
            )}
          </div>
        </div>

        {/* Services / Catalog Section */}
        {profile.services.length > 0 && (
          <div className="mt-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Nosso Catálogo</h2>
              <div className="h-1 flex-1 bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent ml-6 rounded-full hidden sm:block"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.services.map(service => {
                const cardContent = (
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <h3 className="font-black text-xl text-slate-900 dark:text-white leading-tight custom-accent-hover-text transition-colors">
                        {service.name}
                      </h3>
                      <span className="font-black text-lg custom-accent-color whitespace-nowrap">
                        {formatCurrency(service.price)}
                      </span>
                    </div>
                    
                    {service.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                        {service.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      <Clock className="w-3.5 h-3.5" /> {service.duration} minutos
                    </div>
                  </div>
                );

                const cardClass = "bg-white dark:bg-[#131826] p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 hover:shadow-2xl custom-accent-hover-border transition-all flex flex-col justify-between group cursor-pointer text-left block w-full";

                if (service.token && !profile.isInactive) {
                  return (
                    <Link 
                      key={service.id} 
                      to={`/agendar/${service.token}`}
                      className={cardClass}
                    >
                      {cardContent}
                    </Link>
                  );
                }

                return (
                  <div 
                    key={service.id} 
                    className={cardClass + " cursor-default hover:shadow-none hover:border-slate-200 dark:hover:border-slate-800"}
                  >
                    {cardContent}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reviews / Social Proof Section */}
        {reviews.length > 0 && (
          <div className="mt-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                  <Star className="w-7 h-7 fill-amber-400 text-amber-500" /> Avaliações dos Clientes
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Opiniões verificadas de clientes que foram atendidos recentemente.
                </p>
              </div>
              <div className="h-1 flex-1 bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent ml-6 rounded-full hidden sm:block"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-white dark:bg-[#131826] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    {/* Stars */}
                    <div className="flex items-center gap-1 mb-2.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= r.rating
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-slate-200 dark:text-slate-700'
                          }`}
                        />
                      ))}
                      <span className="text-xs font-bold text-slate-400 ml-1.5">{formatDate(r.createdAt)}</span>
                    </div>

                    {/* Comment */}
                    {r.comment ? (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic mb-4 line-clamp-3">
                        "{r.comment}"
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic mb-4">Avaliação 5 estrelas sem comentário adicional.</p>
                    )}
                  </div>

                  {/* Reviewer Details */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate max-w-[120px]">
                      {r.clientName}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 truncate max-w-[120px]">
                      {r.serviceName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 pt-10 pb-6 border-t border-slate-200 dark:border-slate-800 text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <h4 
            className="text-lg font-black bg-clip-text text-transparent inline-block mb-3"
            style={{ backgroundImage: `linear-gradient(to right, ${accent}, ${secondary})` }}
          >
            BoraMarka
          </h4>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            BoraMarka S.A. &copy; 2026. Todos os direitos reservados. Sua agenda na velocidade do seu negócio.
          </p>
        </footer>
      </div>
    </div>
  )
}
