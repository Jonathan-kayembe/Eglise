import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center space-x-2">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => changeLanguage('fr')}
        className={`px-3 py-1 rounded ${
          i18n.language === 'fr'
            ? 'bg-gold text-black-deep font-semibold'
            : 'text-black-deep hover:text-gold'
        } transition-colors`}
      >
        FR
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 rounded ${
          i18n.language === 'en'
            ? 'bg-gold text-black-deep font-semibold'
            : 'text-black-deep hover:text-gold'
        } transition-colors`}
      >
        EN
      </motion.button>
    </div>
  );
};

