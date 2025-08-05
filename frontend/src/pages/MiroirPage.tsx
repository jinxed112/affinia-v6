import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Brain, Zap, Shield, Sparkles, ArrowLeft, Share2,
  Eye, Target, Flame, CloudRain, Star, User, TrendingUp, Lock, 
  AlertCircle, Calendar, Clock, Scroll, BookOpen, Feather, ChevronDown, ChevronUp,
  Quote, Compass, Diamond, Gem, Circle
} from 'lucide-react';

const MiroirPage = ({ isDarkMode = true }) => {
  // Simulation des fonctions de navigation
  const navigate = (path) => console.log(`Navigation vers: ${path}`);
  
  const [profileData, setProfileData] = useState({
    generated_profile: `Michele, tu as une manière de communiquer qui ne laisse pas place au superflu : directe, efficace, parfois tranchante. Ce n'est pas un hasard. Tu détestes la confusion et les jeux psychologiques, parce qu'au fond, tu as une peur viscérale de perdre du temps ou de te perdre toi-même dans des zones floues.

Tu as une énergie paradoxale : tu affirmes aimer la croissance mutuelle, mais tu la veux dans un cadre où tu te sens respecté et jamais enfermé. L'idée d'être absorbé par l'autre ou de devoir "te justifier" t'angoisse.

Dans tes relations, tu cherches quelqu'un qui comprend ta complexité sans te demander de l'expliquer constamment. Tu veux de la profondeur, mais pas du drame. De l'intimité, mais pas de l'invasion.`,
    profile_json: {
      strength_signals: ["Communication directe", "Autonomie émotionnelle", "Clarté des limites"],
      reliability_score: 0.87
    },
    profile_info: { name: "Michele", city: "Mons" }
  });
  
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [currentSectionColor, setCurrentSectionColor] = useState('purple');

  // Couleurs élégantes pour les sections
  const sectionColors = [
    { bg: 'from-purple-900/10 to-indigo-900/10', accent: 'purple-400', glow: 'purple-500/20' },
    { bg: 'from-indigo-900/10 to-violet-900/10', accent: 'indigo-400', glow: 'indigo-500/20' },
    { bg: 'from-violet-900/10 to-purple-900/10', accent: 'violet-400', glow: 'violet-500/20' },
    { bg: 'from-rose-900/10 to-pink-900/10', accent: 'rose-400', glow: 'rose-500/20' },
  ];

  // Intersection Observer pour animations et couleurs
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-section') || '0');
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, index]));
            setCurrentSectionColor(sectionColors[index % sectionColors.length].accent);
          }
        });
      },
      { threshold: 0.3, rootMargin: '-10% 0px' }
    );

    const sections = document.querySelectorAll('[data-section]');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  // Progress bar
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min((scrolled / maxScroll) * 100, 100);
      setReadingProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cleanText = profileData.generated_profile || '';
  const paragraphs = cleanText.split('\n\n').filter(p => p.trim().length > 20);

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* CSS raffiné */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Crimson+Text:ital@0;1&display=swap');
        
        .fade-in {
          opacity: 0;
          transform: translateY(30px);
          transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        .text-refined {
          font-family: 'Inter', system-ui, sans-serif;
          font-feature-settings: 'kern' 1, 'liga' 1;
          text-rendering: optimizeLegibility;
        }
        
        .text-serif {
          font-family: 'Crimson Text', Georgia, serif;
        }
        
        .floating-particles {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
        }
        
        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: rgba(168, 85, 247, 0.3);
          border-radius: 50%;
          animation: float 20s infinite linear;
        }
        
        @keyframes float {
          0% { transform: translateY(100vh) translateX(-10px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-10vh) translateX(10px); opacity: 0; }
        }
        
        .breathing {
          animation: breathe 4s ease-in-out infinite;
        }
        
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        
        .initial-letter {
          float: left;
          font-size: 4rem;
          line-height: 3rem;
          padding-right: 8px;
          padding-top: 4px;
          font-family: 'Crimson Text', serif;
          font-weight: 600;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .quote-mark {
          font-size: 2rem;
          color: rgba(168, 85, 247, 0.4);
          font-family: serif;
          line-height: 1;
        }
      `}</style>

      {/* Particules flottantes subtiles */}
      <div className="floating-particles">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div 
          className={`h-px bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700`}
          style={{ width: `${readingProgress}%` }} 
        />
      </div>

      {/* Boutons flottants discrets */}
      <div className="fixed top-6 left-6 z-40">
        <button 
          className="p-3 rounded-full bg-slate-900/80 backdrop-blur-xl border border-white/10 transition-all duration-200 hover:bg-slate-800/80 hover:border-purple-400/30"
          onClick={() => navigate('/profil')}
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
      </div>
      
      <div className="fixed top-6 right-6 z-40">
        <button 
          className="p-3 rounded-full bg-slate-900/80 backdrop-blur-xl border border-white/10 transition-all duration-200 hover:bg-slate-800/80 hover:border-purple-400/30"
          onClick={() => console.log('Partage du miroir')}
        >
          <Share2 className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Contenu principal - DIRECTEMENT en haut */}
      <main className="relative z-10 px-4 pb-16 pt-6">
        <div className="max-w-3xl mx-auto">
          
          {/* Révélations avec lettres initiales et couleurs changeantes */}
          <div className="space-y-6">
            {paragraphs.map((paragraph, index) => {
              const colorScheme = sectionColors[index % sectionColors.length];
              const isVisible = visibleSections.has(index);
              
              return (
                <div 
                  key={index}
                  data-section={index}
                  className={`fade-in ${isVisible ? 'visible' : ''} breathing`}
                  style={{ transitionDelay: `${index * 0.2}s` }}
                >
                  <div className={`
                    relative rounded-2xl p-6 md:p-8 
                    bg-gradient-to-br ${colorScheme.bg}
                    border border-white/5
                    backdrop-blur-sm
                    transition-all duration-1000
                    hover:border-${colorScheme.accent}/30
                    group
                  `}>
                    
                    {/* Lueur subtile au hover */}
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-${colorScheme.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10 blur-xl`} />
                    
                    {/* Numéro et ornement */}
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-r from-${colorScheme.accent} to-pink-400 flex items-center justify-center`}>
                          <span className="text-xs font-mono text-white">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <div className={`h-px flex-1 bg-gradient-to-r from-${colorScheme.accent}/40 to-transparent max-w-16`} />
                      </div>
                      <Sparkles className={`w-4 h-4 text-${colorScheme.accent}/60`} />
                    </div>
                    
                    {/* Texte avec lettre initiale */}
                    <div className="relative">
                      {/* Guillemets décoratifs */}
                      <div className="quote-mark absolute -left-4 -top-2">"</div>
                      
                      <div className="text-base md:text-lg leading-relaxed text-slate-100 text-refined">
                        <span className="initial-letter">
                          {paragraph.charAt(0)}
                        </span>
                        <span style={{ 
                          lineHeight: '1.75',
                          letterSpacing: '0.01em',
                          fontWeight: '400'
                        }}>
                          {paragraph.slice(1)}
                        </span>
                      </div>
                      
                      {/* Guillemet fermant */}
                      <div className="quote-mark absolute -right-4 -bottom-2 rotate-180">"</div>
                    </div>
                    
                    {/* Constellation décorative */}
                    <div className="mt-6 flex justify-center">
                      <div className="flex items-center gap-1">
                        {[...Array(3)].map((_, i) => (
                          <div 
                            key={i}
                            className={`w-1 h-1 rounded-full bg-${colorScheme.accent}/60`}
                            style={{ animationDelay: `${i * 0.5}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Analyse technique repensée */}
          {showAnalysis && (
            <div className="mt-8 space-y-4">
              <div className="border border-white/10 rounded-xl p-4 bg-gradient-to-br from-amber-900/10 to-orange-900/10">
                <div className="flex items-center gap-3 mb-4">
                  <Star className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-medium text-refined">Forces Dominantes</h3>
                </div>
                <div className="space-y-2">
                  {profileData.profile_json.strength_signals?.map((item, idx) => (
                    <div key={idx} className="px-3 py-2 rounded-lg bg-white/5">
                      <span className="text-sm text-slate-300 text-refined">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Toggle analyse */}
          <div className="text-center mt-8">
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 bg-white/5 border border-white/10 hover:border-purple-400/30 hover:bg-white/10"
            >
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-refined">
                {showAnalysis ? 'Masquer l\'analyse' : 'Révéler l\'analyse'}
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showAnalysis ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Citation finale */}
          <div className="text-center py-12 space-y-6">
            <div className="max-w-lg mx-auto">
              <p className="text-sm text-slate-400 leading-relaxed text-serif italic">
                "Cette révélation a été tissée par l'intelligence d'Affinia, 
                analysant les subtilités pour révéler l'essence."
              </p>
            </div>
            
            <div className="flex justify-center">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export { MiroirPage };