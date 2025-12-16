import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

/**
 * Composant SEO pour gérer les meta tags dynamiques
 * @param {Object} props
 * @param {string} props.title - Titre de la page
 * @param {string} props.description - Description de la page
 * @param {string} props.image - URL de l'image pour les réseaux sociaux
 * @param {string} props.url - URL canonique de la page
 * @param {string} props.type - Type de contenu (website, article, video, etc.)
 * @param {string} props.videoId - ID YouTube pour les vidéos
 */
export const SEO = ({
  title,
  description,
  image = '/logo.png',
  url,
  type = 'website',
  videoId
}) => {
  const { i18n } = useTranslation();
  const siteName = 'Ottawa Christian Tabernacle';
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const fullUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;
  
  // Titre par défaut
  const defaultTitle = `${siteName} - Prédications et Services`;
  const pageTitle = title ? `${title} | ${siteName}` : defaultTitle;
  
  // Description par défaut
  const defaultDescription = 'Site officiel du Tabernacle Chrétien d\'Ottawa. Regardez nos prédications, découvrez nos services et rejoignez notre communauté.';
  const pageDescription = description || defaultDescription;

  return (
    <Helmet>
      {/* Meta tags de base */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="canonical" href={fullUrl} />
      <html lang={i18n.language} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={i18n.language === 'fr' ? 'fr_CA' : 'en_CA'} />

      {/* Twitter Card */}
      <meta name="twitter:card" content={videoId ? "player" : "summary_large_image"} />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={fullImage} />
      {videoId && (
        <meta name="twitter:player" content={`https://www.youtube.com/embed/${videoId}`} />
      )}

      {/* Vidéo YouTube spécifique */}
      {videoId && type === 'video' && (
        <>
          <meta property="og:video" content={`https://www.youtube.com/v/${videoId}`} />
          <meta property="og:video:secure_url" content={`https://www.youtube.com/v/${videoId}`} />
          <meta property="og:video:type" content="video/mp4" />
          <meta property="og:video:width" content="1280" />
          <meta property="og:video:height" content="720" />
        </>
      )}

      {/* Données structurées JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': type === 'video' ? 'VideoObject' : 'WebSite',
          name: siteName,
          url: siteUrl,
          ...(type === 'video' && videoId ? {
            '@type': 'VideoObject',
            name: pageTitle,
            description: pageDescription,
            thumbnailUrl: fullImage,
            uploadDate: new Date().toISOString(),
            contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
            embedUrl: `https://www.youtube.com/embed/${videoId}`
          } : {
            '@type': 'WebSite',
            description: pageDescription,
            publisher: {
              '@type': 'Organization',
              name: siteName,
              logo: {
                '@type': 'ImageObject',
                url: `${siteUrl}/logo.png`
              }
            }
          })
        })}
      </script>
    </Helmet>
  );
};

export default SEO;

