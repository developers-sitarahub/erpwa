"use client";

import React from "react";

interface ImagePickerProps {
    imageMode: "single" | "bulk";
    setImageMode: (v: "single" | "bulk") => void;

    imageInputRef: React.RefObject<HTMLInputElement | null>;
    handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;

    setSelectedGalleryImages: React.Dispatch<React.SetStateAction<any[]>>;
    setMediaModal: (v: { type: "gallery" }) => void;
}

export default function ImagePicker({
    imageMode,
    setImageMode,
    imageInputRef,
    handleImageSelect,
    setSelectedGalleryImages,
    setMediaModal,
}: ImagePickerProps) {
    return (
        <div className="mt-2 flex flex-col h-[340px] mb-2">
            {/* Header */}
            <div className="flex-shrink-0 space-y-3 mb-3">
                <div>
                    <h3 className="text-base font-semibold">Send Photos</h3>
                    <p className="text-sm text-muted-foreground">
                        Select mode and source
                    </p>
                </div>

                {/* SEND MODE */}
                <div>
                    <p className="text-[10px] text-muted-foreground mb-1.5">
                        Send mode
                    </p>

                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setImageMode("single");
                                setSelectedGalleryImages([]); // reset DB gallery selection
                            }}
                            className={`flex-1 py-2 rounded-lg text-sm ${imageMode === "single"
                                ? "bg-primary text-white"
                                : "bg-muted"
                                }`}
                        >
                            Single
                        </button>

                        <button
                            onClick={() => {
                                setImageMode("bulk");
                                setSelectedGalleryImages([]); // reset DB gallery selection
                            }}
                            className={`flex-1 py-2 rounded-lg text-sm ${imageMode === "bulk"
                                ? "bg-primary text-white"
                                : "bg-muted"
                                }`}
                        >
                            Bulk
                        </button>
                    </div>
                </div>
            </div>

            {/* SOURCE SELECTION */}
            <div className="grid grid-cols-2 gap-3">
                {/* DEVICE IMAGES */}
                <button
                    onClick={() => imageInputRef.current?.click()}
                    className="rounded-xl border p-4 hover:bg-muted text-left flex flex-col items-center justify-center gap-1.5 aspect-square"
                >
                    <div className="text-3xl">📁</div>
                    <p className="font-medium text-xs">Device</p>
                </button>

                {/* DATABASE GALLERY */}
                <button
                    onClick={() => setMediaModal({ type: "gallery" })}
                    className="rounded-xl border p-4 hover:bg-muted text-left flex flex-col items-center justify-center gap-1.5 aspect-square"
                >
                    <div className="text-3xl">🖼️</div>
                    <p className="font-medium text-xs">Gallery</p>
                </button>
            </div>

            {/* DEVICE FILE INPUT */}
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple={imageMode === "bulk"}
                className="hidden"
                onChange={handleImageSelect}
            />
        </div>
    );
}
