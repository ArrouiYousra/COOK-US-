/**
 * Utilitaires de chiffrement pour les données sensibles
 * Utilise pgcrypto côté base de données
 */

/**
 * Chiffre une valeur sensible avant insertion en base
 * Note: Le chiffrement réel se fait côté PostgreSQL avec pgcrypto
 * Cette fonction prépare les données pour l'insertion
 */
export function prepareEncryptedValue(value: string): string {
  if (!value || value.trim() === '') {
    return '';
  }
  // Le chiffrement se fait côté PostgreSQL via la fonction encrypt_sensitive_data()
  // On retourne la valeur telle quelle, PostgreSQL s'occupera du chiffrement
  return value.trim();
}

/**
 * Valide le format d'un numéro de sécurité sociale français
 * Format: 15 chiffres (1 sexe + 2 année + 2 mois + 2 département + 3 commune + 3 ordre + 2 clé)
 */
export function validateSocialSecurityNumber(ssn: string): boolean {
  if (!ssn) return false;
  // Format: 15 chiffres
  const ssnRegex = /^[12][0-9]{2}(0[1-9]|1[0-2])([0-9]{2}|2[AB])[0-9]{3}[0-9]{3}[0-9]{2}$/;
  return ssnRegex.test(ssn.replace(/\s/g, ''));
}

/**
 * Valide le format d'un IBAN français
 * Format: FR + 2 chiffres de contrôle + 23 caractères alphanumériques
 */
export function validateIBAN(iban: string): boolean {
  if (!iban) return false;
  // Format IBAN français: FR + 2 chiffres + 23 caractères alphanumériques
  const ibanRegex = /^FR[0-9]{2}[A-Z0-9]{23}$/;
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  return ibanRegex.test(cleaned);
}

/**
 * Valide le format d'un code BIC
 * Format: 8 ou 11 caractères alphanumériques
 */
export function validateBIC(bic: string): boolean {
  if (!bic) return false;
  // Format BIC: 8 ou 11 caractères alphanumériques
  const bicRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  return bicRegex.test(bic.replace(/\s/g, '').toUpperCase());
}

/**
 * Nettoie et formate un IBAN (supprime les espaces, met en majuscules)
 */
export function formatIBAN(iban: string): string {
  return iban.replace(/\s/g, '').toUpperCase();
}

/**
 * Nettoie et formate un code BIC (supprime les espaces, met en majuscules)
 */
export function formatBIC(bic: string): string {
  return bic.replace(/\s/g, '').toUpperCase();
}

/**
 * Nettoie un numéro de sécurité sociale (supprime les espaces)
 */
export function formatSocialSecurityNumber(ssn: string): string {
  return ssn.replace(/\s/g, '');
}

