import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';
import '../YouTube/styles/navigation.css';
import '../YouTube/styles/effects.css';

export const Header = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'header-glass-scroll' : 'bg-white shadow-md'
      }`}
      role="banner"
      aria-label="En-tête principal"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center"
            >
              <img 
                src="/logo.png" 
                alt="Ottawa Christian Tabernacle" 
                className="h-12 w-auto object-contain"
              />
            </motion.div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 relative" role="navigation" aria-label="Navigation principale">
            <Link
              to="/"
              className="nav-link-ink"
              aria-current={location.pathname === '/' ? 'page' : undefined}
            >
              {t('nav.home') || 'Accueil'}
            </Link>
            <Link
              to="/videos"
              className="nav-link-ink"
              aria-current={location.pathname === '/videos' ? 'page' : undefined}
            >
              {t('nav.videos') || 'Vidéos'}
            </Link>
          </nav>

          <LanguageSwitcher />
        </div>
      </div>
    </motion.header>
  );
};

