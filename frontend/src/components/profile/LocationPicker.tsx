import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Search, Loader, Check, AlertCircle } from 'lucide-react';

interface LocationPickerProps {
  isDarkMode: boolean;
  currentCity: string;
  currentLat?: number;
  currentLng?: number;
  currentMaxDistance?: number;
  onSave: (data: { 
    city: string; 
    latitude: number; 
    longitude: number; 
    max_distance: number;
  }) => void;
}

interface CityResult {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  display_name: string;
  importance?: number;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  isDarkMode,
  currentCity,
  currentLat,
  currentLng,
  currentMaxDistance = 50,
  onSave,
}) => {
  const [city, setCity] = useState(currentCity);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxDistance, setMaxDistance] = useState(currentMaxDistance);
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<CityResult | null>(null);
  const [isValid, setIsValid] = useState(!!currentCity);
  const [inputFocused, setInputFocused] = useState(false); // 🆕 État pour gérer le focus

  // État initial - si une ville est déjà définie, la configurer
  useEffect(() => {
    if (currentCity && currentLat && currentLng) {
      const existingLocation: CityResult = {
        name: currentCity,
        country: '',
        latitude: currentLat,
        longitude: currentLng,
        display_name: currentCity
      };
      setSelectedLocation(existingLocation);
      setSearchQuery(currentCity);
      setIsValid(true);
      console.log('🏠 Ville existante configurée:', existingLocation);
    }
  }, [currentCity, currentLat, currentLng]);

  // 🔧 Recherche de villes européennes via Nominatim API (useCallback pour éviter re-renders)
  const searchCities = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Première recherche avec paramètres stricts
      let response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=15&` +
        `countrycodes=ad,al,at,ba,be,bg,by,ch,cy,cz,de,dk,ee,es,fi,fr,gb,ge,gr,hr,hu,ie,is,it,lv,li,lt,lu,mc,md,me,mk,mt,nl,no,pl,pt,ro,rs,ru,se,si,sk,sm,ua,va&` +
        `class=place&` +
        `type=city,town,village,municipality,borough,suburb`
      );

      let data = [];
      if (response.ok) {
        data = await response.json();
      }

      // Si pas de résultats, essayer une recherche plus large
      if (data.length === 0) {
        response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query)}&` +
          `format=json&` +
          `addressdetails=1&` +
          `limit=15&` +
          `countrycodes=ad,al,at,ba,be,bg,by,ch,cy,cz,de,dk,ee,es,fi,fr,gb,ge,gr,hr,hu,ie,is,it,lv,li,lt,lu,mc,md,me,mk,mt,nl,no,pl,pt,ro,rs,ru,se,si,sk,sm,ua,va`
        );
        
        if (response.ok) {
          data = await response.json();
        }
      }
        
      // Filtrage et mapping plus flexible
      const cities: CityResult[] = data
        .filter((item: any) => {
          // Accepter plus de types de lieux
          const validTypes = ['city', 'town', 'village', 'municipality', 'borough', 'suburb', 'hamlet', 'administrative'];
          const validClasses = ['place', 'boundary'];
          
          return (
            (validClasses.includes(item.class) && validTypes.includes(item.type)) ||
            (item.place_rank && item.place_rank <= 20) || // Places importantes
            (item.importance && item.importance > 0.2) || // Lieux d'importance significative
            (item.class === 'boundary' && item.type === 'administrative') // Divisions administratives
          );
        })
        .map((item: any) => {
          // Meilleure extraction du nom du pays
          const countryName = item.address?.country || 
                             item.address?.state ||
                             item.display_name.split(', ').slice(-1)[0];
          
          return {
            name: item.name || item.display_name.split(',')[0],
            country: countryName,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            display_name: `${item.name || item.display_name.split(',')[0]}, ${countryName}`,
            importance: item.importance || 0
          };
        })
        // Trier par importance décroissante
        .sort((a, b) => (b.importance || 0) - (a.importance || 0))
        // Dédoublonner par nom et pays
        .filter((city, index, array) => 
          index === array.findIndex(c => 
            c.name.toLowerCase() === city.name.toLowerCase() && 
            c.country.toLowerCase() === city.country.toLowerCase()
          )
        )
        .slice(0, 8);

      setSearchResults(cities);
    } catch (error) {
      console.error('Erreur lors de la recherche de villes:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []); // 🔧 Dépendances vides pour éviter les re-renders

  // 🔧 Debounce pour la recherche (amélioré)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery && inputFocused) { // 🆕 Rechercher seulement si l'input est focusé
        searchCities(searchQuery);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, inputFocused, searchCities]);

  const handleCitySelect = (cityResult: CityResult) => {
    setSelectedLocation(cityResult);
    setCity(cityResult.name);
    setSearchQuery(cityResult.display_name);
    setShowResults(false);
    setInputFocused(false); // 🆕 Retirer le focus après sélection
    setIsValid(true);
  };

  // 🆕 Gérer le focus de l'input
  const handleInputFocus = () => {
    setInputFocused(true);
    if (searchQuery && searchResults.length > 0) {
      setShowResults(true);
    }
  };

  // 🆕 Gérer la perte de focus de l'input
  const handleInputBlur = () => {
    // Délai pour permettre le clic sur les résultats
    setTimeout(() => {
      setInputFocused(false);
      setShowResults(false);
    }, 200);
  };

  const handleSave = () => {
    if (selectedLocation && isValid) {
      console.log('💾 LocationPicker - Tentative de sauvegarde:', {
        city: selectedLocation.name,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        max_distance: maxDistance,
      });
      
      // Appeler la fonction onSave passée par le parent
      onSave({
        city: selectedLocation.name,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        max_distance: maxDistance,
      });
      
      console.log('✅ LocationPicker - Données envoyées au parent');
    } else {
      console.log('❌ LocationPicker - Sauvegarde impossible:', {
        selectedLocation,
        isValid,
        hasSelectedLocation: !!selectedLocation,
        isValidFlag: isValid
      });
    }
  };

  const hasChanges = () => {
    return (
      selectedLocation?.name !== currentCity ||
      selectedLocation?.latitude !== currentLat ||
      selectedLocation?.longitude !== currentLng ||
      maxDistance !== currentMaxDistance
    );
  };

  return (
    <div className="space-y-6">
      {/* Recherche de ville */}
      <div className="space-y-2">
        <label className={`block text-sm font-medium ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Ville
        </label>
        <div className="relative">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleInputFocus} // 🆕 Gérer le focus
              onBlur={handleInputBlur}   // 🆕 Gérer la perte de focus
              placeholder="Rechercher une ville en Europe..."
              className={`w-full pl-10 pr-10 py-3 rounded-lg border transition-all duration-200 ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500/20'
              } focus:ring-4`}
            />
            {isSearching && (
              <Loader className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
            )}
            {selectedLocation && !isSearching && (
              <Check className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500`} />
            )}
          </div>

          {/* 🔧 Résultats de recherche - Affichage conditionnel amélioré */}
          {showResults && inputFocused && searchResults.length > 0 && (
            <div className={`absolute z-50 w-full mt-1 rounded-lg border shadow-lg max-h-60 overflow-y-auto ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600'
                : 'bg-white border-gray-200'
            }`}>
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleCitySelect(result)}
                  className={`w-full px-4 py-3 text-left hover:bg-opacity-50 transition-colors border-b last:border-b-0 ${
                    isDarkMode
                      ? 'hover:bg-gray-700 border-gray-600 text-white'
                      : 'hover:bg-gray-50 border-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className={`w-4 h-4 flex-shrink-0 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <div className="flex-grow">
                      <div className="font-medium">{result.name}</div>
                      <div className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {result.country}
                      </div>
                    </div>
                    {result.importance && result.importance > 0.5 && (
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isDarkMode ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                      }`}>
                        Ville importante
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Message si aucun résultat */}
          {showResults && inputFocused && searchResults.length === 0 && searchQuery.length > 2 && !isSearching && (
            <div className={`absolute z-50 w-full mt-1 p-4 rounded-lg border ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600'
                : 'bg-white border-gray-200'
            }`}>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-orange-500">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Aucune ville trouvée</span>
                </div>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Essayez avec un autre nom ou vérifiez l'orthographe.
                  <br />
                  Exemple : Paris, Berlin, Madrid, Rome...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Ville sélectionnée */}
        {selectedLocation && (
          <div className={`p-3 rounded-lg border ${
            isDarkMode
              ? 'bg-gray-700/50 border-gray-600 text-gray-300'
              : 'bg-gray-50 border-gray-200 text-gray-700'
          }`}>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-500" />
              <span className="font-medium">{selectedLocation.display_name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Sélecteur de distance */}
      <div className="space-y-3">
        <label className={`block text-sm font-medium ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Distance maximale de recherche
        </label>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              5 km
            </span>
            <span className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {maxDistance} km
            </span>
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              400 km
            </span>
          </div>
          
          <div className="relative">
            <input
              type="range"
              min="5"
              max="400"
              step="5"
              value={maxDistance}
              onChange={(e) => setMaxDistance(parseInt(e.target.value))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                isDarkMode
                  ? 'bg-gray-700 slider-thumb-dark'
                  : 'bg-gray-200 slider-thumb-light'
              }`}
              style={{
                background: `linear-gradient(to right, ${isDarkMode ? '#8b5cf6' : '#8b5cf6'} 0%, ${isDarkMode ? '#8b5cf6' : '#8b5cf6'} ${((maxDistance - 5) / 395) * 100}%, ${isDarkMode ? '#374151' : '#e5e7eb'} ${((maxDistance - 5) / 395) * 100}%, ${isDarkMode ? '#374151' : '#e5e7eb'} 100%)`
              }}
            />
          </div>
          
          <div className="grid grid-cols-4 gap-2 text-xs">
            {[25, 50, 100, 200].map((distance) => (
              <button
                key={distance}
                onClick={() => setMaxDistance(distance)}
                className={`px-2 py-1 rounded text-center transition-colors ${
                  maxDistance === distance
                    ? isDarkMode
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-600 text-white'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {distance}km
              </button>
            ))}
          </div>
        </div>

        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Les profils dans un rayon de {maxDistance} km autour de votre ville seront affichés
        </p>
      </div>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={!isValid || !hasChanges()}
          className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
            isValid && hasChanges()
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              : isDarkMode
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {hasChanges() ? 'Sauvegarder' : 'Aucun changement'}
        </button>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        input[type="range"]::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        input[type="range"]:focus {
          outline: none;
        }

        input[type="range"]:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);
        }
      `}</style>
    </div>
  );
};