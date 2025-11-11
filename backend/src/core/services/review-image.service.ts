import crypto from "node:crypto";
import { supabaseAdmin } from "@config/supabaseClient";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const REVIEW_IMAGES_BUCKET = process.env.SUPABASE_STORAGE_REVIEW_IMAGES_BUCKET ?? "review-images";

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
  if (!REVIEW_IMAGES_BUCKET) {
    throw new Error(
      "La variable SUPABASE_STORAGE_REVIEW_IMAGES_BUCKET doit être configurée pour l'upload d'images de reviews",
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

    const bucketExists = buckets?.some((b) => b.name === REVIEW_IMAGES_BUCKET);

    if (!bucketExists) {
      // Créer le bucket s'il n'existe pas
      const { error: createError } = await supabaseAdmin.storage.createBucket(
        REVIEW_IMAGES_BUCKET,
        {
          public: true,
          fileSizeLimit: MAX_FILE_SIZE_BYTES,
          allowedMimeTypes: Array.from(ALLOWED_CONTENT_TYPES),
        },
      );

      if (createError) {
        console.error("Erreur lors de la création du bucket:", createError);
        throw new Error(
          `Impossible de créer le bucket: ${createError.message}`,
        );
      }
    }
  } catch (error) {
    console.error("Erreur lors de la configuration du bucket:", error);
    throw error;
  }
};

/**
 * Construire le chemin de fichier
 */
const buildFilePath = (userId: string, contentType: string): string => {
  const extension = contentType.split("/")[1] || "jpg";
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(8).toString("hex");
  return `${userId}/${timestamp}-${randomId}.${extension}`;
};

/**
 * Obtenir l'URL publique de l'image
 */
const getPublicUrl = (storagePath: string): string => {
  const { data } = supabaseAdmin.storage
    .from(REVIEW_IMAGES_BUCKET)
    .getPublicUrl(storagePath);
  return data.publicUrl;
};

export class ReviewImageService {
  /**
   * Upload une image de review à partir d'une chaîne base64
   * @returns L'URL publique de l'image
   */
  static async uploadReviewImageFromBase64(
    userId: string,
    imageBase64: string,
  ): Promise<string> {
    await ensureBucketConfigured();

    const { buffer, contentType } = extractBase64Payload(imageBase64);
    const storagePath = buildFilePath(userId, contentType);

    const { error } = await supabaseAdmin.storage
      .from(REVIEW_IMAGES_BUCKET)
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
   * Supprimer une image de review
   * @param imageUrl URL publique de l'image
   */
  static async deleteReviewImage(imageUrl: string): Promise<void> {
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
      .from(REVIEW_IMAGES_BUCKET)
      .remove([relativePath]);

    if (error) {
      throw new Error(
        `Échec de la suppression de l'image: ${error.message}`,
      );
    }
  }
}

