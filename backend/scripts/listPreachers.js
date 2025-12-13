import { createConnection, getConnection } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script pour lister tous les prédicateurs de la base de données
 */
const listPreachers = async () => {
  try {
    await createConnection();
    const db = getConnection();
    
    console.log('🔍 Recherche des prédicateurs dans la base de données...\n');
    
    const [preachers] = await db.execute(
      `SELECT 
        p.id,
        p.name,
        p.slug,
        p.bio,
        p.photo,
        COUNT(v.id) as video_count
      FROM preachers p
      LEFT JOIN videos v ON p.id = v.preacher_id
      GROUP BY p.id
      ORDER BY p.name ASC`
    );

    if (preachers.length > 0) {
      console.log(`✅ ${preachers.length} prédicateur(s) trouvé(s) dans la base de données :\n`);
      console.log('═'.repeat(80));
      
      preachers.forEach((preacher, index) => {
        console.log(`\n${index + 1}. ${preacher.name}`);
        console.log(`   ID: ${preacher.id}`);
        console.log(`   Slug: ${preacher.slug}`);
        if (preacher.bio) {
          const bioPreview = preacher.bio.length > 100 
            ? preacher.bio.substring(0, 100) + '...' 
            : preacher.bio;
          console.log(`   Bio: ${bioPreview}`);
        }
        if (preacher.photo) {
          console.log(`   Photo: ${preacher.photo}`);
        }
        console.log(`   Nombre de vidéos: ${preacher.video_count || 0}`);
      });
      
      console.log('\n' + '═'.repeat(80));
      console.log(`\n📊 Total: ${preachers.length} prédicateur(s) dans la base de données\n`);
    } else {
      console.log('❌ Aucun prédicateur trouvé dans la base de données.\n');
    }

    // Extraire les noms de prédicateurs depuis les titres de vidéos
    console.log('\n🔍 Extraction des noms de prédicateurs depuis les titres de vidéos...\n');
    
    let allVideos = [];
    try {
      [allVideos] = await db.execute(
        'SELECT DISTINCT title FROM videos WHERE title IS NOT NULL ORDER BY published_at DESC'
      );
    } catch (sqlError) {
      console.error('❌ Erreur SQL:', sqlError.message);
      console.log('💡 Vérifiez que la table videos existe et contient des données.\n');
      process.exit(1);
    }

    if (allVideos.length > 0) {
      console.log(`📹 Analyse de ${allVideos.length} vidéo(s)...\n`);
      
      // Patterns pour extraire les noms de prédicateurs
      const preacherPatterns = [
        /(?:Frère|Fr|Brother|Br)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,  // "Frère Nom Prénom"
        /-\s*(?:Frère|Fr|Brother|Br)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,  // " - Frère Nom Prénom"
        /(?:Frère|Fr|Brother|Br)\s+([^:,\-]+?)(?:\s*[,:\-]|$)/i,  // "Frère Nom :" ou "Frère Nom,"
      ];

      const foundPreachers = new Set();
      const preacherCounts = new Map();

      allVideos.forEach(video => {
        if (!video.title) return;
        
        // Extraire depuis le titre
        preacherPatterns.forEach(pattern => {
          const match = video.title.match(pattern);
          if (match && match[1]) {
            let name = match[1].trim();
            // Nettoyer le nom (enlever les caractères indésirables)
            name = name.replace(/[,:\-\[\]()]/g, '').trim();
            
            // Filtrer les noms valides
            if (name.length > 2 && name.length < 50 && /^[A-Za-zÀ-ÿ\s]+$/.test(name)) {
              // Normaliser le nom (première lettre en majuscule)
              const normalizedName = name.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
              
              foundPreachers.add(normalizedName);
              preacherCounts.set(normalizedName, (preacherCounts.get(normalizedName) || 0) + 1);
            }
          }
        });
      });

      if (foundPreachers.size > 0) {
        console.log('📝 Noms de prédicateurs extraits des titres de vidéos :');
        console.log('═'.repeat(80));
        const sortedPreachers = Array.from(foundPreachers).sort();
        sortedPreachers.forEach((name, index) => {
          const count = preacherCounts.get(name) || 0;
          console.log(`   ${index + 1}. ${name} (${count} vidéo${count > 1 ? 's' : ''})`);
        });
        console.log('═'.repeat(80));
        console.log(`\n📊 Total: ${foundPreachers.size} prédicateur(s) unique(s) trouvé(s)\n`);
      } else {
        console.log('❌ Aucun nom de prédicateur trouvé dans les titres de vidéos.\n');
        console.log('💡 Les titres ne suivent peut-être pas le format attendu (ex: "Date - Frère Nom : Titre").\n');
      }
    } else {
      console.log('❌ Aucune vidéo trouvée dans la base de données.\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des prédicateurs:', error);
    process.exit(1);
  }
};

listPreachers();
