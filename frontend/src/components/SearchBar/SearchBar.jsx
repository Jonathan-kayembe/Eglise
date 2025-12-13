import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const { t } = useTranslation();

  // Recherche en temps réel avec debounce (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Rechercher des sermons, prédicateur, thème, date..."
          className="w-full px-6 py-4 rounded-xl border-2 border-[#D9C5A3] bg-white text-[#5A4632] placeholder-[#7a6a5b] focus:outline-none focus:ring-2 focus:ring-[#D9C5A3] focus:border-[#D9C5A3] transition-all duration-300 shadow-md hover:shadow-lg"
        />
      </div>
    </motion.form>
  );
};

