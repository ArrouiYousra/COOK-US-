/**
 * Script de test pour vérifier la configuration de l'API INSEE
 * 
 * Usage: npx tsx scripts/test-insee-api.ts [SIRET]
 * 
 * Exemple: npx tsx scripts/test-insee-api.ts 55203253400608
 */

import { InseeService, InseeApiError } from '../src/domain/insee/insee.service';

async function testInseeApi(siret?: string) {
  const testSiret = siret || '55203253400608'; // Google France par défaut
  
  console.log('🔍 Test de l\'API INSEE');
  console.log('='.repeat(50));
  console.log(`SIRET à tester: ${testSiret}`);
  console.log('');
  
  // Vérifier les variables d'environnement
  console.log('📋 Configuration:');
  const hasApiKey = !!process.env.INSEE_API_KEY;
  const hasApiSecret = !!process.env.INSEE_API_SECRET;
  const hasScope = !!process.env.INSEE_API_SCOPE;
  const tokenUrl = process.env.INSEE_API_TOKEN_URL || 'https://api.insee.fr/token';
  const baseUrl = process.env.INSEE_API_BASE_URL || 'https://api.insee.fr/entreprises/sirene/V3';
  
  console.log(`  INSEE_API_KEY: ${hasApiKey ? '✅ Défini' : '❌ Manquant'} ${hasApiKey ? `(${process.env.INSEE_API_KEY?.substring(0, 10)}...)` : ''}`);
  console.log(`  INSEE_API_SECRET: ${hasApiSecret ? '✅ Défini' : '⚠️  Non défini (mode API Key)'}`);
  console.log(`  INSEE_API_SCOPE: ${hasScope ? `✅ ${process.env.INSEE_API_SCOPE}` : '⚠️  Non défini (utilisera la valeur par défaut)'}`);
  console.log(`  INSEE_API_TOKEN_URL: ${tokenUrl}`);
  console.log(`  INSEE_API_BASE_URL: ${baseUrl}`);
  console.log('');
  
  if (!hasApiKey) {
    console.error('❌ ERREUR: INSEE_API_KEY n\'est pas défini dans les variables d\'environnement');
    console.error('   Ajoutez INSEE_API_KEY dans votre fichier .env');
    process.exit(1);
  }
  
  // Tester la validation
  console.log('🧪 Test de validation SIRET...');
  console.log('');
  
  try {
    const result = await InseeService.validateSiret(testSiret);
    
    console.log('✅ Validation réussie!');
    console.log('');
    console.log('📊 Résultats:');
    console.log(`  SIRET validé: ${result.siret}`);
    console.log(`  Nom de l'entreprise: ${result.companyName || 'Non disponible'}`);
    console.log(`  Code activité: ${result.activityCode || 'Non disponible'}`);
    console.log(`  Adresse: ${result.address || 'Non disponible'}`);
    if (result.metadata) {
      console.log(`  Date de création: ${result.metadata.creationDate || 'Non disponible'}`);
      console.log(`  Catégorie: ${result.metadata.companyCategory || 'Non disponible'}`);
    }
    console.log('');
    console.log('🎉 L\'API INSEE est correctement configurée et fonctionnelle!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la validation:');
    console.error('');
    
    if (error instanceof InseeApiError) {
      console.error(`  Message: ${error.message}`);
      console.error(`  Code HTTP: ${error.statusCode}`);
      
      if (error.details) {
        console.error('  Détails:', JSON.stringify(error.details, null, 2));
      }
      
      console.error('');
      
      // Suggestions selon le code d'erreur
      if (error.statusCode === 401) {
        console.error('💡 Suggestions pour résoudre l\'erreur 401 (Non autorisé):');
        console.error('   1. Vérifiez que INSEE_API_KEY est correct');
        console.error('   2. Si vous utilisez OAuth, vérifiez INSEE_API_SECRET');
        console.error('   3. Vérifiez que les clés ne sont pas expirées sur https://api.insee.fr/catalogue/');
        console.error('   4. Vérifiez que votre application est activée');
      } else if (error.statusCode === 403) {
        console.error('💡 Suggestions pour résoudre l\'erreur 403 (Accès refusé):');
        console.error('   1. Vérifiez les permissions de votre application');
        console.error('   2. Vérifiez que le scope "api_sirene" est activé');
        console.error('   3. Vérifiez votre plan sur https://api.insee.fr/catalogue/');
      } else if (error.statusCode === 404) {
        console.error('💡 Suggestions pour résoudre l\'erreur 404 (SIRET introuvable):');
        console.error('   1. Vérifiez que le SIRET est correct (14 chiffres)');
        console.error('   2. Vérifiez le SIRET sur https://www.sirene.fr/');
        console.error('   3. Le SIRET peut être récent (délai de 24-48h)');
        console.error('   4. L\'établissement peut être fermé');
        console.error('   5. Vérifiez que ce n\'est pas un problème d\'authentification (voir logs ci-dessus)');
      } else if (error.statusCode === 429) {
        console.error('💡 Suggestions pour résoudre l\'erreur 429 (Limite atteinte):');
        console.error('   1. Attendez quelques minutes avant de réessayer');
        console.error('   2. Vérifiez les limites de votre plan sur https://api.insee.fr/catalogue/');
      }
    } else {
      console.error('  Erreur inattendue:', error);
    }
    
    process.exit(1);
  }
}

// Récupérer le SIRET depuis les arguments de ligne de commande
const siretArg = process.argv[2];

// Charger les variables d'environnement
import dotenv from 'dotenv';
dotenv.config();

// Exécuter le test
testInseeApi(siretArg).catch((error) => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});

