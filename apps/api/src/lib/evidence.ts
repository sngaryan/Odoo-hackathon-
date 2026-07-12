import type { ProofEvidence } from "@prisma/client";
import { prisma } from "../prisma.js";
import { deleteStoredFile, getEvidencePublicUrl, toStoragePath } from "./storage.js";

type UploadedFile = Express.Multer.File;

export function formatEvidence(evidence: ProofEvidence) {
  return {
    id: evidence.id,
    originalName: evidence.originalName,
    mimeType: evidence.mimeType,
    sizeBytes: evidence.sizeBytes,
    url: getEvidencePublicUrl(evidence.storagePath),
    createdAt: evidence.createdAt,
  };
}

export async function deleteParticipationEvidence(participationId: string) {
  const existing = await prisma.proofEvidence.findMany({
    where: { participationId },
  });

  for (const item of existing) {
    deleteStoredFile(item.storagePath);
  }

  if (existing.length > 0) {
    await prisma.proofEvidence.deleteMany({
      where: { participationId },
    });
  }
}

export async function deleteSubmissionEvidence(submissionId: string) {
  const existing = await prisma.proofEvidence.findMany({
    where: { submissionId },
  });

  for (const item of existing) {
    deleteStoredFile(item.storagePath);
  }

  if (existing.length > 0) {
    await prisma.proofEvidence.deleteMany({
      where: { submissionId },
    });
  }
}

export async function createParticipationEvidence(
  participationId: string,
  uploadedById: string,
  files: UploadedFile[],
) {
  if (files.length === 0) {
    return [];
  }

  const records = await prisma.$transaction(
    files.map((file) =>
      prisma.proofEvidence.create({
        data: {
          storagePath: toStoragePath(file.filename),
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          participationId,
          uploadedById,
        },
      }),
    ),
  );

  return records.map(formatEvidence);
}

export async function createSubmissionEvidence(
  submissionId: string,
  uploadedById: string,
  files: UploadedFile[],
) {
  if (files.length === 0) {
    return [];
  }

  const records = await prisma.$transaction(
    files.map((file) =>
      prisma.proofEvidence.create({
        data: {
          storagePath: toStoragePath(file.filename),
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          submissionId,
          uploadedById,
        },
      }),
    ),
  );

  return records.map(formatEvidence);
}
