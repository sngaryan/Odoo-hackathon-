import crypto from "crypto";
import fs from "fs";
import path from "path";
import multer from "multer";

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
const EVIDENCE_SUBDIR = "evidence";

export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_PHOTOS_PER_SUBMIT = 5;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png"]);

export function ensureUploadDir() {
  const evidenceDir = path.join(UPLOAD_DIR, EVIDENCE_SUBDIR);
  fs.mkdirSync(evidenceDir, { recursive: true });
}

export function getEvidenceAbsolutePath(storagePath: string) {
  return path.join(UPLOAD_DIR, storagePath);
}

export function getEvidencePublicUrl(storagePath: string) {
  return `/uploads/${storagePath}`;
}

export function deleteStoredFile(storagePath: string) {
  const absolutePath = getEvidenceAbsolutePath(storagePath);
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
}

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const evidenceDir = path.join(UPLOAD_DIR, EVIDENCE_SUBDIR);
    fs.mkdirSync(evidenceDir, { recursive: true });
    cb(null, evidenceDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${crypto.randomUUID()}${extension}`);
  },
});

function photoFileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(new Error("Only JPG and PNG photos are allowed."));
    return;
  }
  cb(null, true);
}

export const uploadPhotos = multer({
  storage: diskStorage,
  limits: {
    fileSize: MAX_PHOTO_SIZE_BYTES,
    files: MAX_PHOTOS_PER_SUBMIT,
  },
  fileFilter: photoFileFilter,
}).array("photos", MAX_PHOTOS_PER_SUBMIT);

export function toStoragePath(filename: string) {
  return `${EVIDENCE_SUBDIR}/${filename}`;
}
