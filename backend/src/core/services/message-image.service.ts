import crypto from "node:crypto";
import { supabaseAdmin } from "@config/supabaseClient";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MESSAGE_IMAGES_BUCKET = process.env.SUPABASE_STORAGE_MESSAGE_IMAGES_BUCKET ?? "message-images";

const extractBase64Payload = (
  base64: string,
): { buffer: Buffer; contentType: string } => {
  const matches = base64.match(/^data:(.*?);base64,(.+)$/);
  if (!matches || matches.length !== 3 || !matches[1] || !matches[2]) {
    throw new Error("Format de fichier invalide (base64 attendu)");
  }

  const contentType = matches[1];
  const base64Data = matches[2];

  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new Error(
      "Format de fichier non supporté. Formats acceptés: JPEG, PNG, WebP, GIF.",
    );
  }

  const buffer = Buffer.from(base64Data, "base64");
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `L'image dépasse la taille maximale autorisée (${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB)`,
    );
  }

  return { buffer, contentType };
};

/**
 * Vérifier et créer le bucket s'il n'existe pas
 */
const ensureBucketConfigured = async (): Promise<void> => {
  if (!MESSAGE_IMAGES_BUCKET) {
    throw new Error(
      "La variable SUPABASE_STORAGE_MESSAGE_IMAGES_BUCKET doit être configurée pour l'upload d'images de messages",
    );
  }

  try {
    // Vérifier si le bucket existe
    const { data: buckets, error: listError } =
      await supabaseAdmin.storage.listBuckets();

    if (listError) {
      console.error("Erreur lors de la vérification des buckets:", listError);
      throw new Error(
        `Impossible de vérifier les buckets: ${listError.message}`,
      );
    }

    const bucketExists = buckets?.some(
      (bucket) => bucket.name === MESSAGE_IMAGES_BUCKET,
    );

    if (!bucketExists) {
      console.log(
        `Le bucket "${MESSAGE_IMAGES_BUCKET}" n'existe pas, tentative de création...`,
      );

      // Créer le bucket
      const { error: createError } = await supabaseAdmin.storage.createBucket(
        MESSAGE_IMAGES_BUCKET,
        {
          public: true, // Rendre le bucket public pour que les images soient accessibles
          fileSizeLimit: 5242880, // 5 MB
          allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
          ],
        },
      );

      if (createError) {
        console.error("Erreur lors de la création du bucket:", createError);
        throw new Error(
          `Impossible de créer le bucket "${MESSAGE_IMAGES_BUCKET}": ${createError.message}. Veuillez créer le bucket manuellement dans Supabase Dashboard.`,
        );
      }

      console.log(`Bucket "${MESSAGE_IMAGES_BUCKET}" créé avec succès`);
    } else {
      console.log(`Bucket "${MESSAGE_IMAGES_BUCKET}" existe déjà`);
    }
  } catch (error) {
    // Si c'est une erreur que nous avons déjà formatée, la relancer
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      `Erreur inattendue lors de la configuration du bucket: ${String(error)}`,
    );
  }
};

const buildFilePath = (
  userId: string,
  contentType: string,
): string => {
  const uniqueId = crypto.randomUUID();
  const extension = contentType.split("/")[1] || "jpg";
  return `messages/${userId}/${uniqueId}.${extension}`;
};

const getPublicUrl = (storagePath: string): string => {
  const { data } = supabaseAdmin.storage
    .from(MESSAGE_IMAGES_BUCKET)
    .getPublicUrl(storagePath);
  return data.publicUrl;
};

export class MessageImageService {
  /**
   * Upload une image de message à partir d'une chaîne base64
   * @returns L'URL publique de l'image
   */
  static async uploadMessageImageFromBase64(
    userId: string,
    imageBase64: string,
  ): Promise<string> {
    await ensureBucketConfigured();

    const { buffer, contentType } = extractBase64Payload(imageBase64);
    const storagePath = buildFilePath(userId, contentType);

    const { error } = await supabaseAdmin.storage
      .from(MESSAGE_IMAGES_BUCKET)
      .upload(storagePath, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Échec de l'upload de l'image: ${error.message}`);
    }

    return getPublicUrl(storagePath);
  }

  /**
   * Supprimer une image de message
   * @param imageUrl URL publique de l'image
   */
  static async deleteMessageImage(imageUrl: string): Promise<void> {
    await ensureBucketConfigured();

    // Extraire le chemin depuis l'URL publique
    // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const urlParts = imageUrl.split("/");
    const bucketIndex = urlParts.findIndex((part) => part === "public");
    if (bucketIndex === -1 || bucketIndex >= urlParts.length - 1) {
      throw new Error("Format d'URL d'image invalide");
    }

    const relativePath = urlParts.slice(bucketIndex + 1).join("/");

    const { error } = await supabaseAdmin.storage
      .from(MESSAGE_IMAGES_BUCKET)
      .remove([relativePath]);

    if (error) {
      throw new Error(
        `Échec de la suppression de l'image: ${error.message}`,
      );
    }
  }
}

