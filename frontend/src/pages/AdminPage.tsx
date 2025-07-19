import React, { useState, useEffect } from 'react';
import { 
  Plus, Settings, Users, BarChart3, Trophy, Eye, 
  Edit, Trash2, RefreshCw, Check, X, Save, AlertTriangle, // ← CHANGÉ: Sync → RefreshCw
  Zap, Gem, Target, User, Camera, Brain, Heart
} from 'lucide-react';
import { BaseComponents } from '../components/ui/BaseComponents';
import { useDesignSystem } from '../styles/designSystem';
import { adminService, QuestData, QuestCreateData, AdminStats } from '../services/adminService';

interface AdminPageProps {
  isDarkMode?: boolean;
}

export const AdminPage: React.FC<AdminPageProps> = ({ isDarkMode = true }) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [quests, setQuests] = useState<QuestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuest, setEditingQuest] = useState<QuestData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const designSystem = useDesignSystem(isDarkMode);

  // État du formulaire
  const [formData, setFormData] = useState<QuestCreateData>({
    type: 'custom',
    title: '',
    description: '',
    xp_reward: 100,
    credits_reward: 0,
    icon: '🎯',
    required_level: 1,
    is_active: true
  });

  // Icônes pour les types de quêtes
  const typeIcons = {
    profile: User,
    photo: Camera,
    questionnaire: Brain,
    social: Heart,
    custom: Target
  };

  // Émojis populaires pour les quêtes
  const emojiOptions = ['🎯', '👤', '📸', '🧠', '💕', '🏆', '⭐', '🔥', '💎', '🚀', '🎉', '💫'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [dashboard, allQuests] = await Promise.all([
        adminService.getDashboard(),
        adminService.getAllQuests()
      ]);
      
      setDashboardData(dashboard);
      setQuests(allQuests);
    } catch (error) {
      console.error('Load admin data error:', error);
      setError('Impossible de charger les données admin');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuest = async () => {
    try {
      setError(null);
      await adminService.createQuest(formData);
      setSuccessMessage('Quête créée avec succès !');
      setIsCreating(false);
      resetForm();
      loadData();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la création de la quête');
    }
  };

  const handleUpdateQuest = async () => {
    if (!editingQuest) return;
    
    try {
      setError(null);
      await adminService.updateQuest(editingQuest.id, formData);
      setSuccessMessage('Quête mise à jour avec succès !');
      setEditingQuest(null);
      resetForm();
      loadData();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la mise à jour de la quête');
    }
  };

  const handleDeleteQuest = async (questId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver cette quête ?')) return;
    
    try {
      setError(null);
      await adminService.deleteQuest(questId);
      setSuccessMessage('Quête désactivée avec succès !');
      loadData();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la suppression de la quête');
    }
  };

  const handleSyncQuest = async (questId: string) => {
    try {
      setError(null);
      await adminService.syncQuestWithUsers(questId);
      setSuccessMessage('Quête synchronisée avec tous les utilisateurs !');
      loadData();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la synchronisation');
    }
  };

  const startEdit = (quest: QuestData) => {
    setEditingQuest(quest);
    setFormData({
      type: quest.type,
      title: quest.title,
      description: quest.description,
      xp_reward: quest.xp_reward,
      credits_reward: quest.credits_reward,
      icon: quest.icon,
      required_level: quest.required_level,
      is_active: quest.is_active
    });
    setIsCreating(false);
  };

  const resetForm = () => {
    setFormData({
      type: 'custom',
      title: '',
      description: '',
      xp_reward: 100,
      credits_reward: 0,
      icon: '🎯',
      required_level: 1,
      is_active: true
    });
    setEditingQuest(null);
    setIsCreating(false);
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <BaseComponents.Card isDarkMode={isDarkMode} variant="default" className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${designSystem.getTextClasses('muted')}`}>{label}</p>
          <p className={`text-2xl font-bold ${designSystem.getTextClasses('primary')}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 bg-${color}-500 rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </BaseComponents.Card>
  );

  const QuestForm = () => (
    <BaseComponents.Card isDarkMode={isDarkMode} variant="highlighted" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-bold ${designSystem.getTextClasses('primary')}`}>
          {editingQuest ? 'Modifier la quête' : 'Créer une nouvelle quête'}
        </h3>
        <BaseComponents.Button
          variant="secondary"
          size="small"
          onClick={resetForm}
        >
          <X className="w-4 h-4" />
        </BaseComponents.Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Type */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${designSystem.getTextClasses('secondary')}`}>
            Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className={`w-full p-3 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="profile">Profil</option>
            <option value="photo">Photo</option>
            <option value="questionnaire">Questionnaire</option>
            <option value="social">Social</option>
            <option value="custom">Personnalisé</option>
          </select>
        </div>

        {/* Titre */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${designSystem.getTextClasses('secondary')}`}>
            Titre
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={`w-full p-3 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="Titre de la quête"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className={`block text-sm font-medium mb-2 ${designSystem.getTextClasses('secondary')}`}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className={`w-full p-3 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="Description de la quête"
          />
        </div>

        {/* XP et Crédits */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${designSystem.getTextClasses('secondary')}`}>
            Récompense XP
          </label>
          <input
            type="number"
            value={formData.xp_reward}
            onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) })}
            className={`w-full p-3 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            min="0"
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${designSystem.getTextClasses('secondary')}`}>
            Récompense Crédits
          </label>
          <input
            type="number"
            value={formData.credits_reward}
            onChange={(e) => setFormData({ ...formData, credits_reward: parseInt(e.target.value) })}
            className={`w-full p-3 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            min="0"
          />
        </div>

        {/* Icône */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${designSystem.getTextClasses('secondary')}`}>
            Icône
          </label>
          <div className="flex flex-wrap gap-2">
            {emojiOptions.map(emoji => (
              <button
                key={emoji}
                onClick={() => setFormData({ ...formData, icon: emoji })}
                className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg ${
                  formData.icon === emoji 
                    ? 'border-purple-500 bg-purple-500/20' 
                    : 'border-gray-300 hover:border-purple-300'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Niveau requis */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${designSystem.getTextClasses('secondary')}`}>
            Niveau requis
          </label>
          <input
            type="number"
            value={formData.required_level}
            onChange={(e) => setFormData({ ...formData, required_level: parseInt(e.target.value) })}
            className={`w-full p-3 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            min="1"
          />
        </div>

        {/* Active */}
        <div className="md:col-span-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <span className={designSystem.getTextClasses('secondary')}>Quête active</span>
          </label>
        </div>
      </div>

      <div className="flex space-x-3 mt-6">
        <BaseComponents.Button
          variant="primary"
          onClick={editingQuest ? handleUpdateQuest : handleCreateQuest}
          className="flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{editingQuest ? 'Mettre à jour' : 'Créer'}</span>
        </BaseComponents.Button>
        
        <BaseComponents.Button
          variant="secondary"
          onClick={resetForm}
        >
          Annuler
        </BaseComponents.Button>
      </div>
    </BaseComponents.Card>
  );

  if (loading) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${designSystem.getBgClasses('primary')}`}>
        <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />
        <div className="relative z-10 pt-20">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 animate-spin text-purple-400" />
              <span className={`text-lg ${designSystem.getTextClasses('secondary')}`}>
                Chargement du panel admin...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${designSystem.getBgClasses('primary')}`}>
      <BaseComponents.MysticalBackground isDarkMode={isDarkMode} intensity="low" />
      
      <div className="relative z-10 pt-20">
        <div className="max-w-7xl mx-auto px-4">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-3xl font-bold mb-2 ${designSystem.getTextClasses('primary')}`}>
              🛡️ Panel Admin
            </h1>
            <p className={designSystem.getTextClasses('muted')}>
              Gestion des quêtes et statistiques de gamification
            </p>
          </div>

          {/* Messages */}
          {error && (
            <BaseComponents.Card isDarkMode={isDarkMode} variant="default" className="mb-6 p-4 border-red-500">
              <div className="flex items-center space-x-2 text-red-500">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </BaseComponents.Card>
          )}

          {successMessage && (
            <BaseComponents.Card isDarkMode={isDarkMode} variant="default" className="mb-6 p-4 border-green-500">
              <div className="flex items-center space-x-2 text-green-500">
                <Check className="w-5 h-5" />
                <span>{successMessage}</span>
              </div>
            </BaseComponents.Card>
          )}

          {/* Stats Dashboard */}
          {dashboardData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={Trophy}
                label="Total Quêtes"
                value={dashboardData.stats.total_quests}
                color="yellow"
              />
              <StatCard
                icon={BarChart3}
                label="Quêtes Actives"
                value={dashboardData.stats.active_quests}
                color="green"
              />
              <StatCard
                icon={Users}
                label="Completions"
                value={dashboardData.stats.total_completions}
                color="blue"
              />
              <StatCard
                icon={Target}
                label="Taux Réussite"
                value={`${dashboardData.stats.completion_rate}%`}
                color="purple"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4 mb-8">
            <BaseComponents.Button
              variant="primary"
              onClick={() => setIsCreating(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Quête</span>
            </BaseComponents.Button>
            
            <BaseComponents.Button
              variant="secondary"
              onClick={loadData}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualiser</span>
            </BaseComponents.Button>
          </div>

          {/* Formulaire de création/édition */}
          {(isCreating || editingQuest) && <QuestForm />}

          {/* Liste des quêtes */}
          <BaseComponents.Card isDarkMode={isDarkMode} variant="default" className="p-6">
            <h3 className={`text-xl font-bold mb-6 ${designSystem.getTextClasses('primary')}`}>
              📋 Gestion des Quêtes
            </h3>
            
            <div className="space-y-4">
              {quests.map(quest => {
                const TypeIcon = typeIcons[quest.type];
                
                return (
                  <div
                    key={quest.id}
                    className={`p-4 rounded-lg border ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    } ${quest.is_active ? '' : 'opacity-50'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{quest.icon}</span>
                          <TypeIcon className="w-5 h-5 text-gray-500" />
                        </div>
                        
                        <div className="flex-1">
                          <h4 className={`font-bold ${designSystem.getTextClasses('primary')}`}>
                            {quest.title}
                          </h4>
                          <p className={`text-sm mt-1 ${designSystem.getTextClasses('muted')}`}>
                            {quest.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 mt-3">
                            <div className="flex items-center space-x-1">
                              <Zap className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm">{quest.xp_reward} XP</span>
                            </div>
                            {quest.credits_reward > 0 && (
                              <div className="flex items-center space-x-1">
                                <Gem className="w-4 h-4 text-purple-500" />
                                <span className="text-sm">{quest.credits_reward} crédits</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4 text-blue-500" />
                              <span className="text-sm">
                                {quest.stats.total_completed}/{quest.stats.total_assigned} 
                                ({quest.stats.completion_rate}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <BaseComponents.Button
                          variant="secondary"
                          size="small"
                          onClick={() => startEdit(quest)}
                          className="p-2"
                        >
                          <Edit className="w-4 h-4" />
                        </BaseComponents.Button>
                        
                        <BaseComponents.Button
                          variant="secondary"
                          size="small"
                          onClick={() => handleSyncQuest(quest.id)}
                          className="p-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </BaseComponents.Button>
                        
                        <BaseComponents.Button
                          variant="error"
                          size="small"
                          onClick={() => handleDeleteQuest(quest.id)}
                          className="p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </BaseComponents.Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {quests.length === 0 && (
                <div className="text-center py-12">
                  <Trophy className={`w-16 h-16 mx-auto mb-4 ${designSystem.getTextClasses('muted')}`} />
                  <p className={designSystem.getTextClasses('muted')}>
                    Aucune quête créée pour le moment
                  </p>
                </div>
              )}
            </div>
          </BaseComponents.Card>
        </div>
      </div>
    </div>
  );
};