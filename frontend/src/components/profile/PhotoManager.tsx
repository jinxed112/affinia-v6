import React, { useState, useRef } from 'react';
import { Camera, X, Star, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ProfileExtendedService from '../../services/profileExtendedService';
import type { ProfilePhoto } from '../../types/profile';

interface PhotoManagerProps {
  isDarkMode: boolean;
  currentPhotos: ProfilePhoto[];
  onSave: (updates: any) => Promise<void>;
}

export const PhotoManager: React.FC<PhotoManagerProps> = ({ 
  isDarkMode, 
  currentPhotos = [], 
  onSave 
}) => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<ProfilePhoto[]>(currentPhotos);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setPhotos(currentPhotos);
  }, [currentPhotos]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleFileSelect = async (files: FileList) => {
    if (!files.length || !user) return;

    setUploading(true);
    try {
      const file = files[0];
      
      if (!file.type.startsWith('image/')) {
        throw new Error('Le fichier doit être une image');
      }
      
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('L\'image doit faire moins de 5MB');
      }

      if (photos.length >= 6) {
        throw new Error('Maximum 6 photos autorisées');
      }

      const photoUrl = await ProfileExtendedService.uploadPhoto(file, user.id);
      const newOrder = photos.length + 1;
      const isMain = photos.length === 0;

      const newPhoto = await ProfileExtendedService.savePhoto(user.id, photoUrl, newOrder, isMain);
      
      setPhotos(prev => [...prev, newPhoto]);
      showMessage('success', 'Photo ajoutée avec succès !');
      await onSave({});

    } catch (error: any) {
      console.error('Erreur upload:', error);
      showMessage('error', error.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const setMainPhoto = async (photoId: string) => {
    if (!user) return;
    
    try {
      await ProfileExtendedService.setMainPhoto(user.id, photoId);
      
      setPhotos(prev => prev.map(photo => ({
        ...photo,
        is_main: photo.id === photoId
      })));

      showMessage('success', 'Photo principale mise à jour !');
      await onSave({});
    } catch (error) {
      showMessage('error', 'Erreur lors de la mise à jour');
    }
  };

  const deletePhoto = async (photoId: string) => {
    try {
      await ProfileExtendedService.deletePhoto(photoId);
      
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
      showMessage('success', 'Photo supprimée !');
      await onSave({});
    } catch (error) {
      showMessage('error', 'Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Mes Photos
          </h3>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Ajoutez jusqu'à 6 photos. La première sera votre photo principale.
          </p>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          photos.length >= 6
            ? isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
            : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
        }`}>
          {photos.length}/6 photos
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          message.type === 'success'
            ? isDarkMode ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-green-100 text-green-700 border border-green-200'
            : isDarkMode ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div 
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
          uploading 
            ? isDarkMode ? 'border-purple-500 bg-purple-500/10' : 'border-purple-500 bg-purple-50'
            : isDarkMode ? 'border-gray-600 hover:border-purple-500 hover:bg-purple-500/5' : 'border-gray-300 hover:border-purple-500 hover:bg-purple-50'
        } ${photos.length >= 6 ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
        onClick={() => !uploading && photos.length < 6 && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          disabled={uploading || photos.length >= 6}
        />

        {uploading ? (
          <div className="space-y-4">
            <Loader className="w-8 h-8 animate-spin mx-auto text-purple-600" />
            <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Upload en cours...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <Camera className={`w-8 h-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <div>
              <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Ajouter une photo
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Cliquez pour sélectionner
              </p>
            </div>
          </div>
        )}
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div key={photo.id} className="relative group rounded-2xl overflow-hidden aspect-square transition-all duration-300 hover:scale-105">
              <img src={photo.photo_url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {photo.is_main && (
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                    Principale
                  </div>
                )}

                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMainPhoto(photo.id);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      photo.is_main ? 'bg-yellow-500 text-white' : 'bg-white/80 text-gray-700 hover:bg-white'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${photo.is_main ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePhoto(photo.id);
                    }}
                    className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};