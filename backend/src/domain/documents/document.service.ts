import crypto from 'node:crypto';
import { supabaseAdmin } from '@config/supabaseClient';

const ALLOWED_CONTENT_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const MAX_FILE_SIZE_BYTES = (Number(process.env.RIB_MAX_FILE_SIZE_MB ?? '10') || 10) * 1024 * 1024;
const RIB_BUCKET = process.env.SUPABASE_STORAGE_RIB_BUCKET ?? 'cook-documents';

const extractBase64Payload = (base64: string): { buffer: Buffer; contentType: string } => {
  const matches = base64.match(/^data:(.*?);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Format de fichier RIB invalide (base64 attendu)');
  }

  const contentType = matches[1];
  const base64Data = matches[2];

  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new Error('Format de fichier RIB non supporté. Formats acceptés: PDF, JPEG, PNG.');
  }

  const buffer = Buffer.from(base64Data, 'base64');
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Le document RIB dépasse la taille maximale autorisée (${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB)`);
  }

  return { buffer, contentType };
};

const ensureBucketConfigured = (): void => {
  if (!RIB_BUCKET) {
    throw new Error('La variable SUPABASE_STORAGE_RIB_BUCKET doit être configurée pour l’upload RIB');
  }
};

const buildFilePath = (userId: string, originalName?: string, contentType?: string): string => {
  const extFromName = originalName?.split('.').pop()?.toLowerCase();
  let extension = extFromName;

  if (!extension && contentType) {
    if (contentType === 'application/pdf') {
      extension = 'pdf';
    } else if (contentType === 'image/jpeg') {
      extension = 'jpg';
    } else if (contentType === 'image/png') {
      extension = 'png';
    }
  }

  extension = extension ?? 'bin';

  const uniqueId = crypto.randomUUID();
  return `rib/${userId}/${uniqueId}.${extension}`;
};

export class DocumentService {
  /**
   * Upload un document RIB à partir d'une chaîne base64
   * @returns Le chemin du fichier dans le bucket Supabase
   */
  static async uploadRibDocumentFromBase64(
    userId: string,
    ribDocumentBase64: string,
    originalFileName?: string
  ): Promise<string> {
    ensureBucketConfigured();

    const { buffer, contentType } = extractBase64Payload(ribDocumentBase64);
    const storagePath = buildFilePath(userId, originalFileName, contentType);

    const { error } = await supabaseAdmin.storage
      .from(RIB_BUCKET)
      .upload(storagePath, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Échec de l'upload du document RIB: ${error.message}`);
    }

    // On stocke le chemin interne (private). Pour générer une URL signée, utiliser getSignedUrl côté backend.
    return `${RIB_BUCKET}/${storagePath}`;
  }

  /**
   * Supprimer un document RIB
   * @param filePath Chemin complet du fichier (format: bucket/path/to/file)
   */
  static async deleteRibDocument(filePath: string): Promise<void> {
    ensureBucketConfigured();

    // Extraire le chemin relatif depuis le format "bucket/path"
    const pathParts = filePath.split('/');
    if (pathParts[0] !== RIB_BUCKET) {
      throw new Error(`Le chemin du fichier ne correspond pas au bucket ${RIB_BUCKET}`);
    }

    const relativePath = pathParts.slice(1).join('/');

    const { error } = await supabaseAdmin.storage
      .from(RIB_BUCKET)
      .remove([relativePath]);

    if (error) {
      throw new Error(`Échec de la suppression du document RIB: ${error.message}`);
    }
  }
}


