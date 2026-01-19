"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
    Filter,
    Image as ImageIcon,
    Check,
    Zap,
    Loader2,
} from "lucide-react";

import type { Category, GalleryImage } from "@/lib/types";

interface GalleryPickerProps {
    imageMode: "single" | "bulk";
    setImageMode: (v: "single" | "bulk") => void;

    galleryCategories: Category[];
    gallerySubcategories: Category[];
    galleryImages: GalleryImage[];
    selectedGalleryImages: GalleryImage[];
    galleryLoading: boolean;

    selectedGalleryCategory: number | null;
    selectedGallerySubcategory: number | null;

    setSelectedGalleryImages: React.Dispatch<
        React.SetStateAction<GalleryImage[]>
    >;
    setSelectedGallerySubcategory: (v: number | null) => void;
    setIncludeCaption: (v: boolean) => void;

    includeCaption: boolean;
    isPreparingMedia: boolean;

    handleGalleryCategoryClick: (id: number | null) => void;
    loadGalleryImages: (cat?: number, sub?: number) => void;
    toggleSelectAll: () => void;
    handleSendGalleryImages: () => Promise<void>;
}

export default function GalleryPicker({
    imageMode,
    setImageMode,

    galleryCategories,
    gallerySubcategories,
    galleryImages,
    selectedGalleryImages,
    galleryLoading,

    selectedGalleryCategory,
    selectedGallerySubcategory,

    setSelectedGalleryImages,
    setSelectedGallerySubcategory,
    setIncludeCaption,

    includeCaption,
    isPreparingMedia,

    handleGalleryCategoryClick,
    loadGalleryImages,
    toggleSelectAll,
    handleSendGalleryImages,
}: GalleryPickerProps) {
    return (
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row h-[70vh]">
            {/* LEFT PANEL */}
            <div className="flex-1 overflow-auto flex flex-col border-b lg:border-b-0 lg:border-r border-border p-6 bg-background">
                <div className="space-y-4 flex flex-col h-full">
                    {/* Filters */}
                    <div className="space-y-3 flex-shrink-0">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="w-4 h-4 text-primary" />
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Filters
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Category */}
                            <div>
                                <label className="text-xs font-semibold uppercase block mb-2">
                                    Category
                                </label>
                                <select
                                    value={selectedGalleryCategory ?? ""}
                                    onChange={(e) =>
                                        handleGalleryCategoryClick(
                                            e.target.value ? Number(e.target.value) : null
                                        )
                                    }
                                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm"
                                >
                                    <option value="">All Categories</option>
                                    {galleryCategories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subcategory */}
                            <div>
                                <label className="text-xs font-semibold uppercase block mb-2">
                                    Subcategory
                                </label>
                                <select
                                    disabled={!selectedGalleryCategory}
                                    value={selectedGallerySubcategory ?? ""}
                                    onChange={(e) => {
                                        const val = e.target.value
                                            ? Number(e.target.value)
                                            : null;
                                        setSelectedGallerySubcategory(val);
                                        loadGalleryImages(selectedGalleryCategory!, val ?? undefined);
                                    }}
                                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm disabled:opacity-50"
                                >
                                    <option value="">All subcategories</option>
                                    {gallerySubcategories.map((sub) => (
                                        <option key={sub.id} value={sub.id}>
                                            {sub.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide">
                                Images
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {selectedGalleryImages.length} selected
                            </p>
                        </div>

                        {galleryImages.length > 0 && imageMode === "bulk" && (
                            <button
                                onClick={toggleSelectAll}
                                className="text-xs px-3 py-1.5 rounded-md border"
                            >
                                {galleryImages.every((img) =>
                                    selectedGalleryImages.some((s) => s.id === img.id)
                                )
                                    ? "Deselect All"
                                    : "Select All"}
                            </button>
                        )}
                    </div>

                    {/* Image Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 auto-rows-[120px] overflow-y-auto pr-2 flex-1">
                        {galleryLoading ? (
                            <div className="col-span-full flex justify-center h-40">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : galleryImages.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center h-40 opacity-50">
                                <ImageIcon className="w-12 h-12 mb-2" />
                                <p className="text-sm">No images found</p>
                            </div>
                        ) : (
                            galleryImages.map((img) => {
                                const isSelected = selectedGalleryImages.some(
                                    (i) => i.id === img.id
                                );

                                return (
                                    <motion.div
                                        key={img.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`relative rounded-lg cursor-pointer border-2 overflow-hidden ${isSelected
                                            ? "border-primary"
                                            : "border-border hover:border-primary/50"
                                            }`}
                                        onClick={() => {
                                            if (imageMode === "single") {
                                                setSelectedGalleryImages([img]);
                                            } else {
                                                setSelectedGalleryImages((prev) =>
                                                    isSelected
                                                        ? prev.filter((i) => i.id !== img.id)
                                                        : [...prev, img]
                                                );
                                            }
                                        }}
                                    >
                                        <Image
                                            src={img.s3_url || img.url || img.image_url || ""}
                                            alt="Gallery"
                                            fill
                                            className="object-cover"
                                        />

                                        <AnimatePresence>
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute inset-0 bg-primary/20 flex items-center justify-center"
                                                >
                                                    <div className="bg-primary rounded-full p-1.5">
                                                        <Check className="w-4 h-4 text-white" />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="w-full lg:w-80 p-6 bg-card flex flex-col space-y-6">
                {/* Send Mode */}
                <div>
                    <label className="text-xs font-semibold uppercase block mb-3">
                        Send Mode
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setImageMode("single");
                                setSelectedGalleryImages([]);
                            }}
                            className={`flex-1 py-2 text-xs rounded-lg ${imageMode === "single"
                                ? "bg-primary text-white"
                                : "bg-muted"
                                }`}
                        >
                            Single
                        </button>

                        <button
                            onClick={() => {
                                setImageMode("bulk");
                                setSelectedGalleryImages([]);
                            }}
                            className={`flex-1 py-2 text-xs rounded-lg ${imageMode === "bulk"
                                ? "bg-primary text-white"
                                : "bg-muted"
                                }`}
                        >
                            Bulk
                        </button>
                    </div>
                </div>

                {/* Options */}
                <button
                    onClick={() => setIncludeCaption(!includeCaption)}
                    className="flex items-center gap-3 p-3 rounded-xl border"
                >
                    <div
                        className={`w-5 h-5 rounded border flex items-center justify-center ${includeCaption ? "bg-primary border-primary" : ""
                            }`}
                    >
                        {includeCaption && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="text-sm font-medium">Include Caption</span>
                </button>

                <div className="flex-1" />

                {/* Summary */}
                <div className="p-5 border rounded-2xl space-y-4">
                    <p className="text-xs uppercase">Selected</p>
                    <p className="text-3xl font-bold text-primary">
                        {selectedGalleryImages.length}
                    </p>
                </div>

                {/* Send */}
                <button
                    onClick={handleSendGalleryImages}
                    disabled={selectedGalleryImages.length === 0 || isPreparingMedia}
                    className={`py-4 rounded-xl font-bold flex items-center justify-center gap-2 ${selectedGalleryImages.length > 0 && !isPreparingMedia
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground"
                        }`}
                >
                    {isPreparingMedia ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Preparing...
                        </>
                    ) : (
                        <>
                            <Zap className="w-4 h-4" />
                            Send Images
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
