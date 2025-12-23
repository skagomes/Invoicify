
import React from 'react';
import { Settings } from '../../types';
import { Building, Mail, MapPin, Palette, UploadCloud, BadgeDollarSign, Percent, Globe, Hash } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';

interface SettingsPageProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ settings, setSettings }) => {
  const { t, language, setLanguage } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: name === 'defaultTaxRate' ? parseFloat(value) : value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const InputField: React.FC<{ name: keyof Settings; label: string; icon: React.ReactNode; type?: string; isTextarea?: boolean }> = ({ name, label, icon, type = 'text', isTextarea = false }) => (
    <div>
        <label htmlFor={name} className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {icon}
            <span className="ml-2">{label}</span>
        </label>
        {isTextarea ? (
            <textarea
                id={name}
                name={name}
                value={settings[name] as string || ''}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm text-gray-900 dark:text-gray-200"
            />
        ) : (
            <input
                type={type}
                id={name}
                name={name}
                value={settings[name] as string || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm text-gray-900 dark:text-gray-200"
            />
        )}
    </div>
);


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{t('settings')}</h1>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">{t('companyInfo')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <InputField name="companyName" label={t('companyName')} icon={<Building size={16}/>} />
          </div>
          <InputField name="companyEmail" label={t('companyEmail')} icon={<Mail size={16}/>} type="email" />
          <InputField name="companyVat" label={t('vatNumber')} icon={<Hash size={16}/>} />
          <div className="md:col-span-2">
            <InputField name="companyAddress" label={t('companyAddress')} icon={<MapPin size={16}/>} isTextarea />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">{t('branding')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <Palette size={16}/> <span className="ml-2">{t('primaryColor')}</span>
            </label>
            <input type="color" name="primaryColor" value={settings.primaryColor} onChange={handleChange} className="w-20 h-10 p-1 border rounded-md" />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <Palette size={16}/> <span className="ml-2">{t('secondaryColor')}</span>
            </label>
            <input type="color" name="secondaryColor" value={settings.secondaryColor} onChange={handleChange} className="w-20 h-10 p-1 border rounded-md" />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <UploadCloud size={16}/> <span className="ml-2">{t('companyLogo')}</span>
            </label>
            <div className="mt-1 flex items-center space-x-4">
              {settings.logo && <img src={settings.logo} alt="logo" className="h-16 w-16 object-contain rounded-md bg-gray-100 dark:bg-gray-700" />}
              <label className="cursor-pointer flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                <UploadCloud size={16} className="mr-2" />
                <span>{t('uploadLogo')}</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">{t('financials')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField name="currencySymbol" label={t('currencySymbol')} icon={<BadgeDollarSign size={16}/>} />
            <InputField name="defaultTaxRate" label={t('defaultTaxRate')} icon={<Percent size={16}/>} type="number" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">{t('language')}</h2>
        <div>
            <label htmlFor="language" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Globe size={16}/>
                <span className="ml-2">{t('language')}</span>
            </label>
            <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'fr')}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm text-gray-900 dark:text-gray-200"
            >
                <option value="en">English</option>
                <option value="fr">Français</option>
            </select>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;