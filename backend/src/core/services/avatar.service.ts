import crypto from 'node:crypto';
import { supabaseAdmin } from '@config/supabaseClient';

const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const AVATAR_BUCKET = process.env.SUPABASE_STORAGE_AVATAR_BUCKET ?? 'avatars';

const extractBase64Payload = (base64: string): { buffer: Buffer; contentType: string } => {
  const matches = base64.match(/^data:(.*?);base64,(.+)$/);
  if (!matches || matches.length !== 3 || !matches[1] || !matches[2]) {
    throw new Error('Format de fichier invalide (base64 attendu)');
  }

  const contentType = matches[1];
  const base64Data = matches[2];

  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new Error('Format de fichier non supporté. Formats acceptés: JPEG, PNG, WebP, GIF.');
  }

  const buffer = Buffer.from(base64Data, 'base64');
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(`L'image dépasse la taille maximale autorisée (5 MB)`);
  }

  return { buffer, contentType };
};

/**
 * Vérifier et créer le bucket s'il n'existe pas
 */
const ensureBucketConfigured = async (): Promise<void> => {
  if (!AVATAR_BUCKET) {
    throw new Error('La variable SUPABASE_STORAGE_AVATAR_BUCKET doit être configurée pour l\'upload d\'avatar');
  }

  try {
    // Vérifier si le bucket existe
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error('Erreur lors de la vérification des buckets:', listError);
      throw new Error(`Impossible de vérifier les buckets: ${listError.message}`);
    }

    const bucketExists = buckets?.some(bucket => bucket.name === AVATAR_BUCKET);
    
    if (!bucketExists) {
      console.log(`Le bucket "${AVATAR_BUCKET}" n'existe pas, tentative de création...`);
      
      // Créer le bucket
      const { error: createError } = await supabaseAdmin.storage.createBucket(AVATAR_BUCKET, {
        public: true, // Rendre le bucket public pour que les avatars soient accessibles
        fileSizeLimit: 5242880, // 5 MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      });

      if (createError) {
        console.error('Erreur lors de la création du bucket:', createError);
        throw new Error(`Impossible de créer le bucket "${AVATAR_BUCKET}": ${createError.message}. Veuillez créer le bucket manuellement dans Supabase Dashboard.`);
      }

      console.log(`Bucket "${AVATAR_BUCKET}" créé avec succès`);
    } else {
      console.log(`Bucket "${AVATAR_BUCKET}" existe déjà`);
    }
  } catch (error) {
    // Si c'est une erreur que nous avons déjà formatée, la relancer
    if (error instanceof Error && error.message.includes('Impossible')) {
      throw error;
    }
    // Sinon, formater l'erreur
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Erreur lors de la configuration du bucket "${AVATAR_BUCKET}": ${errorMessage}`);
  }
};

const buildFilePath = (userId: string, contentType: string): string => {
  const extension = contentType.split('/')[1] || 'jpg';
  const uniqueId = crypto.randomBytes(16).toString('hex');
  return `avatars/${userId}/${uniqueId}.${extension}`;
};

const getPublicUrl = (storagePath: string): string => {
  const supabaseUrl = process.env.SUPABASE_URL ?? '';
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL n\'est pas configuré');
  }
  return `${supabaseUrl}/storage/v1/object/public/${AVATAR_BUCKET}/${storagePath}`;
};

export class AvatarService {
  /**
   * Upload un avatar à partir d'une chaîne base64
   * @returns L'URL publique de l'avatar
   */
  static async uploadAvatarFromBase64(
    userId: string,
    avatarBase64: string
  ): Promise<string> {
    await ensureBucketConfigured();

    const { buffer, contentType } = extractBase64Payload(avatarBase64);
    const storagePath = buildFilePath(userId, contentType);

    // Supprimer l'ancien avatar si il existe
    try {
      const { data: existingFiles } = await supabaseAdmin.storage
        .from(AVATAR_BUCKET)
        .list(`avatars/${userId}`);
      
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(file => `avatars/${userId}/${file.name}`);
        await supabaseAdmin.storage
          .from(AVATAR_BUCKET)
          .remove(filesToDelete);
      }
    } catch (error) {
      // Ignorer les erreurs de suppression (fichier peut ne pas exister)
      console.warn('Impossible de supprimer l\'ancien avatar:', error);
    }

    const { error } = await supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .upload(storagePath, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Échec de l'upload de l'avatar: ${error.message}`);
    }

    return getPublicUrl(storagePath);
  }

  /**
   * Supprimer un avatar
   * @param avatarUrl URL publique de l'avatar
   */
  static async deleteAvatar(avatarUrl: string): Promise<void> {
    await ensureBucketConfigured();

    // Extraire le chemin depuis l'URL
    const urlParts = avatarUrl.split('/storage/v1/object/public/');
    if (urlParts.length !== 2 || !urlParts[1]) {
      throw new Error('URL d\'avatar invalide');
    }

    const pathParts = urlParts[1].split('/');
    if (!pathParts[0] || pathParts[0] !== AVATAR_BUCKET) {
      throw new Error(`L'URL ne correspond pas au bucket ${AVATAR_BUCKET}`);
    }

    const relativePath = pathParts.slice(1).join('/');

    const { error } = await supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .remove([relativePath]);

    if (error) {
      throw new Error(`Échec de la suppression de l'avatar: ${error.message}`);
    }
  }
}

