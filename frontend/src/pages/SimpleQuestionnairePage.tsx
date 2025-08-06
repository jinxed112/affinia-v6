import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SimpleQuestionnaire from '../components/SimpleQuestionnaire';

interface SimpleQuestionnairePageProps {
  isDarkMode: boolean;
}

const SimpleQuestionnairePage: React.FC<SimpleQuestionnairePageProps> = ({ isDarkMode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={`min-h-screen py-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 to-pink-50'}`}>
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 transform rotate-12 scale-150"></div>
      </div>
      <div className="relative z-10">
        <SimpleQuestionnaire isDarkMode={isDarkMode} />
      </div>
      <footer className="text-center py-8">
        <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Affinia • Questionnaire Psychologique IA</p>
      </footer>
    </div>
  );
};

export default SimpleQuestionnairePage;
