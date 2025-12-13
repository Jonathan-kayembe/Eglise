import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-b from-[#5A4632] to-[#121212] text-white py-12 md:py-16 mt-20 w-full"
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* À propos */}
          <div>
            <h3 className="text-xl md:text-2xl font-display font-bold mb-4 md:mb-6 text-[#D9C5A3] tracking-tight">
              Ottawa Christian Tabernacle
            </h3>
            <p className="text-white/90 mb-4 text-base md:text-lg leading-relaxed">
              {t('footer.description') || 'Partageons la Parole de Dieu à travers nos prédications et enseignements.'}
            </p>
            <a 
              href="https://ottawachristiantabernacle.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#D9C5A3] hover:text-[#E8DCC3] transition-colors text-base md:text-lg font-medium"
            >
              ottawachristiantabernacle.com
            </a>
          </div>

          {/* Programme */}
          <div>
            <h4 className="font-semibold md:font-bold mb-4 md:mb-6 text-[#D9C5A3] text-lg md:text-xl">{t('footer.program') || 'Programme'}</h4>
            <ul className="space-y-2 md:space-y-3 text-white/90 text-base md:text-lg">
              <li className="hover:text-[#D9C5A3] transition-colors">
                <span className="font-medium">Mardi :</span> 19H (en ligne)
              </li>
              <li className="hover:text-[#D9C5A3] transition-colors">
                <span className="font-medium">Jeudi :</span> 19H (en ligne)
              </li>
              <li className="hover:text-[#D9C5A3] transition-colors">
                <span className="font-medium">Vendredi :</span> 19H - 21H
              </li>
              <li className="hover:text-[#D9C5A3] transition-colors">
                <span className="font-medium">Dimanche :</span> 10H - 13H
              </li>
              <li className="hover:text-[#D9C5A3] transition-colors pt-2 border-t border-white/10">
                <span className="font-medium">École du dimanche :</span> 9:30H - 10H
              </li>
            </ul>
          </div>

          {/* Adresse */}
          <div>
            <h4 className="font-semibold md:font-bold mb-4 md:mb-6 text-[#D9C5A3] text-lg md:text-xl">{t('footer.address') || 'Adresse'}</h4>
            <p className="text-white/90 mb-2 text-base md:text-lg leading-relaxed">
              323 Montreal Rd, Vanier, ON K1L 7C4
            </p>
            <p className="text-white/70 text-sm md:text-base">
              {t('footer.basement') || 'Sous-sol'}
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold md:font-bold mb-4 md:mb-6 text-[#D9C5A3] text-lg md:text-xl">{t('footer.contact') || 'Contact'}</h4>
            <ul className="space-y-2 md:space-y-3 text-white/90 text-base md:text-lg">
              <li>
                <a href="tel:+18193295145" className="hover:text-[#D9C5A3] transition-colors">
                  +1 819 329-5145
                </a>
              </li>
              <li>
                <a href="tel:+16137122184" className="hover:text-[#D9C5A3] transition-colors">
                  +1 613 712-2184
                </a>
              </li>
              <li>
                <a href="mailto:studios.oct@gmail.com" className="hover:text-[#D9C5A3] transition-colors break-all">
                  studios.oct@gmail.com
                </a>
              </li>
              <li className="pt-3 md:pt-4 border-t border-white/20">
                <span className="text-sm md:text-base text-white/70">{t('footer.emailPrayer') || 'Prière:'}</span>
                <br />
                <a href="mailto:ottawachristiantabernacle@gmail.com" className="hover:text-[#D9C5A3] transition-colors break-all text-sm md:text-base">
                  ottawachristiantabernacle@gmail.com
                </a>
              </li>
              <li className="pt-3 md:pt-4 border-t border-white/20">
                <span className="text-sm md:text-base text-white/70">{t('footer.emailDonations') || 'Dons:'}</span>
                <br />
                <a href="mailto:ottawachristiantabernacle@gmail.com" className="hover:text-[#D9C5A3] transition-colors break-all text-sm md:text-base">
                  ottawachristiantabernacle@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/20 mt-8 md:mt-12 pt-8 md:pt-10 text-center text-white/70">
          <p className="text-sm md:text-base">
            © {new Date().getFullYear()} Ottawa Christian Tabernacle. {t('footer.rights') || 'Tous droits réservés.'}
          </p>
        </div>
      </div>
    </motion.footer>
  );
};
