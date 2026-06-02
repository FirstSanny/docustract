import { Client, Storage, ID } from 'appwrite';
import { env } from '../config/index.js';

let client: Client | null = null;
let storage: Storage | null = null;

export function getClient(): Client {
  if (!client) {
    client = new Client()
      .setEndpoint(env.APPWRITE_ENDPOINT)
      .setProject(env.APPWRITE_PROJECT_ID)
      .setDevKey(env.APPWRITE_SECRET);
  }
  return client;
}

export function getStorage(): Storage {
  if (!storage) {
    storage = new Storage(getClient());
  }
  return storage;
}

export interface UploadResult {
  id: string;
  name: string;
  mimeType: string;
  sizeOriginal: number;
  previewUrl: string;
  downloadUrl: string;
}

export interface UploadOptions {
  fileData: Buffer;
  fileName: string;
  mimeType: string;
}

// Node.js-compatible File object for the Appwrite SDK
function toAppwriteFile(
  buffer: Buffer,
  name: string,
  mimeType: string,
): File {
  return new File([new Uint8Array(buffer)], name, { type: mimeType });
}

export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const appwriteFile = toAppwriteFile(options.fileData, options.fileName, options.mimeType);

  const result = await getStorage().createFile({
    bucketId: env.APPWRITE_BUCKET_ID,
    fileId: ID.unique(),
    file: appwriteFile,
  });

  const previewUrl = getStorage().getFilePreview(env.APPWRITE_BUCKET_ID, result.$id);
  const downloadUrl = getStorage().getFileDownload(env.APPWRITE_BUCKET_ID, result.$id);

  return {
    id: result.$id,
    name: result.name,
    mimeType: result.mimeType,
    sizeOriginal: result.sizeOriginal,
    previewUrl: String(previewUrl),
    downloadUrl: String(downloadUrl),
  };
}

export async function deleteFile(fileId: string): Promise<void> {
  try {
    await getStorage().deleteFile({ bucketId: env.APPWRITE_BUCKET_ID, fileId });
  } catch (err) {
    throw Object.assign(new Error('Failed to delete file from Appwrite storage'), { cause: err });
  }
}

export function getFileDownloadUrl(fileId: string): string {
  return getStorage().getFileDownload(env.APPWRITE_BUCKET_ID, fileId);
}

export function getFilePreviewUrl(fileId: string): string {
  return getStorage().getFilePreview(env.APPWRITE_BUCKET_ID, fileId);
}