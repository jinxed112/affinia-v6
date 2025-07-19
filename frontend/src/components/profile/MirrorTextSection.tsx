import React, { useState, useEffect } from 'react';
import { Copy, Download, CheckCircle, Sparkles, Eye } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface MirrorTextSectionProps {
  text?: string;
  metadata?: string;
  isDarkMode?: boolean;
}

export const MirrorTextSection: React.FC<MirrorTextSectionProps> = ({ 
  text, 
  metadata,
  isDarkMode = true 
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Fonction pour parser et styliser le texte
  const parseText = (rawText: string) => {
    if (!rawText) return '';
    
    // Remplacer les mots entre **...** par du gras
    let parsed = rawText.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
    
    // Ajouter des highlights sur certains mots-clés psychologiques
    const keywords = [
      'authenticité', 'vulnérabilité', 'défense', 'mécanisme', 'pattern',
      'inconscient', 'émotionnel', 'relationnel', 'attachement', 'protection'
    ];
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      parsed = parsed.replace(regex, '<span class="text-purple-300 font-medium">$1</span>');
    });
    
    return parsed;
  };

  // Copier le texte
  const handleCopyText = async () => {
    if (!text) return;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  if (!text) {
    return (
      <Card className={`transition-all duration-500 ${
        isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${isDarkMode ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200'}`}>
        <CardContent className="p-6 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
          }`}>
            <Eye className={`w-8 h-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Profil miroir non généré
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Votre analyse personnelle apparaîtra ici après avoir complété le questionnaire.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`transition-all duration-500 ${
      isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      {/* Header avec effet holographique */}
      <div className="relative mb-4 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
        
        <Card className={`relative ${
          isDarkMode 
            ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30' 
            : 'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isDarkMode ? 'bg-purple-500/20' : 'bg-purple-500/10'
                }`}>
                  <span className="text-2xl">🪞</span>
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Profil miroir psychologique
                  </h2>
                  <p className={`text-xs ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                    Analyse générée par IA
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyText}
                  className={`transition-all duration-200 ${
                    copiedText 
                      ? 'bg-green-500/20 border-green-500/30 text-green-400' 
                      : isDarkMode 
                        ? 'hover:bg-white/10' 
                        : 'hover:bg-gray-100'
                  }`}
                >
                  {copiedText ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copier
                    </>
                  )}
                </Button>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {/* TODO: Download PDF */}}
                  className={isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu du texte miroir */}
      <Card className={`group hover:shadow-lg transition-all duration-300 ${
        isDarkMode 
          ? 'bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20' 
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}>
        <CardContent className="p-0">
          {/* Zone de lecture */}
          <div className={`max-h-96 overflow-y-auto scrollbar-thin p-6 ${
            isDarkMode 
              ? 'scrollbar-track-gray-800 scrollbar-thumb-gray-600' 
              : 'scrollbar-track-gray-100 scrollbar-thumb-gray-400'
          }`}>
            <div 
              className={`prose prose-sm max-w-none leading-relaxed ${
                isDarkMode ? 'prose-invert' : ''
              }`}
              dangerouslySetInnerHTML={{ 
                __html: parseText(text).replace(/\n/g, '<br>') 
              }}
            />
          </div>
          
          {/* Footer avec metadata */}
          {metadata && (
            <div className={`border-t px-6 py-3 ${
              isDarkMode 
                ? 'border-white/10 bg-black/20' 
                : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs">
                  <Sparkles className={`w-3 h-3 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Profil généré par IA • prompt V8
                  </span>
                </div>
                <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Mis à jour le {new Date(metadata).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note d'information */}
      <div className={`mt-3 p-3 rounded-lg border ${
        isDarkMode 
          ? 'bg-blue-500/10 border-blue-500/20' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <p className={`text-xs flex items-start ${
          isDarkMode ? 'text-blue-300' : 'text-blue-800'
        }`}>
          <span className="mr-1">💡</span>
          <span>
            <strong className="font-semibold">Conseil :</strong> Ce profil révèle des aspects inconscients 
            de votre personnalité relationnelle. Il est basé sur l'analyse de vos réponses au questionnaire.
          </span>
        </p>
      </div>
    </div>
  );
};