"use client";

import { useEffect, useState } from "react";

const maxFileSize = 5 * 1024 * 1024;
const supportedTypes = ["image/jpeg", "image/png"];

export function ProofUpload({ challengeTitle }: { challengeTitle: string }) {
  const [activeTab, setActiveTab] = useState<"details" | "photos">("details");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const previewUrls = photos.map((photo) => URL.createObjectURL(photo));
    setPhotoPreviews(previewUrls);

    return () => previewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
  }, [photos]);

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedPhotos = Array.from(event.target.files ?? []);
    const validPhotos = selectedPhotos.filter(
      (photo) => supportedTypes.includes(photo.type) && photo.size <= maxFileSize,
    );

    if (validPhotos.length !== selectedPhotos.length) {
      setError("Only JPG or PNG photos up to 5 MB can be added.");
    } else {
      setError(null);
    }

    setPhotos((currentPhotos) => [...currentPhotos, ...validPhotos].slice(0, 5));
    event.target.value = "";
  }

  function removePhoto(indexToRemove: number) {
    setPhotos((currentPhotos) => currentPhotos.filter((_, index) => index !== indexToRemove));
  }

  return (
    <section className="mt-5 rounded-xl border border-dashed border-orange-300 bg-orange-50/50 p-4">
      <p className="text-sm font-semibold text-slate-950">Submit proof for {challengeTitle}</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">
        Explain your completed action and attach photos for the reviewer.
      </p>

      <div className="mt-4 flex gap-4 border-b border-orange-200">
        <button
          className={`border-b-2 px-1 pb-2 text-xs font-semibold transition ${
            activeTab === "details"
              ? "border-orange-500 text-orange-800"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setActiveTab("details")}
          type="button"
        >
          Proof details
        </button>
        <button
          className={`border-b-2 px-1 pb-2 text-xs font-semibold transition ${
            activeTab === "photos"
              ? "border-orange-500 text-orange-800"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setActiveTab("photos")}
          type="button"
        >
          Photos & proof {photos.length ? `(${photos.length})` : ""}
        </button>
      </div>

      {activeTab === "details" ? (
        <div>
          <label className="mt-4 block text-xs font-semibold text-slate-700" htmlFor={`proof-description-${challengeTitle}`}>
            What did you complete?
          </label>
          <textarea
            className="mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            id={`proof-description-${challengeTitle}`}
            maxLength={500}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="For example: I cycled to the office on Monday, Wednesday, and Friday."
            value={description}
          />
          <p className="mt-1 text-right text-xs text-slate-400">{description.length}/500</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-xs leading-5 text-slate-600">
            Add up to five JPG or PNG photos. Each photo can be up to 5 MB.
          </p>
          <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-orange-300 bg-white px-4 py-4 text-sm font-semibold text-orange-800 transition hover:bg-orange-100">
            <input
              accept="image/jpeg,image/png"
              className="sr-only"
              multiple
              onChange={handlePhotoChange}
              type="file"
            />
            Choose photos
          </label>

          {photos.length ? (
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div className="relative" key={`${photo.name}-${photo.lastModified}-${index}`}>
                  <img
                    alt={`Proof photo ${index + 1}`}
                    className="h-24 w-full rounded-lg border border-slate-200 object-cover"
                    src={photoPreviews[index]}
                  />
                  <button
                    aria-label={`Remove ${photo.name}`}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white hover:bg-slate-700"
                    onClick={() => removePhoto(index)}
                    type="button"
                  >
                    x
                  </button>
                  <p className="mt-1 truncate text-xs text-slate-500">{photo.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-white px-3 py-2 text-xs text-slate-500">No photos selected yet.</p>
          )}
        </div>
      )}

      {error ? <p className="mt-3 text-xs font-medium text-rose-700">{error}</p> : null}

      <p className="mt-4 text-xs text-emerald-700">
        {description.trim() && photos.length
          ? "Proof details and photos are ready for submission."
          : "Add a description and photos before submitting for review."}
      </p>
    </section>
  );
}
