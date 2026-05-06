import React, { useState, useEffect } from 'react';
import { getTemplates, getTemplatePreviewUrl } from '../services/apiClient';
import { useTranslation } from '../i18n/context';

interface Template {
  id: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  emoji: string;
  order: number;
  click_count: number;
  is_featured: boolean;
  max_images: number;
  is_custom: boolean;
  tags: string[];
  preview_url: string;
}

interface TransformationSelectorProps {
  onSelect: (template: Template) => void;
  hasPreviousResult: boolean;
}

const TransformationSelector: React.FC<TransformationSelectorProps> = ({ 
  onSelect, 
  hasPreviousResult 
}) => {
  const { t, language } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTemplates({ sort: 'order', active_only: true });
      if (response.success) {
        setTemplates(response.templates);
      } else {
        setError('Failed to load templates');
      }
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const getTemplateName = (template: Template) => {
    return language === 'en' ? template.name_en : template.name;
  };

  const getTemplateDescription = (template: Template) => {
    return language === 'en' ? template.description_en : template.description;
  };

  const handleTemplateClick = (template: Template) => {
    onSelect(template);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8 animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-[var(--accent-primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-[var(--text-secondary)]">Loading templates...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-8 animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={loadTemplates}
              className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary-hover)]"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 animate-fade-in">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 text-[var(--accent-primary)]">
        {t('transformationSelector.title')}
      </h2>
      <p className="text-base sm:text-lg text-center text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
        {hasPreviousResult 
          ? t('transformationSelector.descriptionWithResult')
          : t('transformationSelector.description')
        }
      </p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => handleTemplateClick(template)}
            className="group flex flex-col items-center justify-center text-center p-4 aspect-square bg-[var(--bg-card)] rounded-xl border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-all duration-200 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] focus:ring-[var(--accent-primary)] cursor-pointer overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            
            <img 
              src={getTemplatePreviewUrl(template.id)} 
              alt={getTemplateName(template)}
              className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-200"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            
            <span className="text-4xl mb-2 transition-transform duration-200 group-hover:scale-110 relative z-10">
              {template.emoji}
            </span>
            <span className="font-semibold text-sm text-[var(--text-primary)] relative z-10">
              {getTemplateName(template)}
            </span>
            
            {template.is_featured && (
              <span className="absolute top-2 right-2 text-xs bg-[var(--accent-primary)] text-white px-2 py-1 rounded-full">
                ★
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TransformationSelector;
