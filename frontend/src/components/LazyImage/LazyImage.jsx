import { useState, useRef, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

/**
 * Composant d'image avec lazy loading
 * @param {Object} props
 * @param {string} props.src - URL de l'image
 * @param {string} props.alt - Texte alternatif
 * @param {string} props.className - Classes CSS
 * @param {Function} props.onError - Callback en cas d'erreur
 * @param {string} props.placeholder - Image de placeholder (optionnel)
 */
export const LazyImage = ({
  src,
  alt,
  className = '',
  onError,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"%3E%3Crect fill="%23ddd" width="640" height="360"/%3E%3C/svg%3E',
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView && src) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.onerror = () => {
        if (onError) {
          onError();
        } else {
          setImageSrc('https://via.placeholder.com/640x360?text=Image');
        }
      };
    }
  }, [inView, src, onError]);

  return (
    <img
      ref={ref}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-50'} transition-opacity duration-300`}
      loading="lazy"
      {...props}
    />
  );
};

export default LazyImage;

