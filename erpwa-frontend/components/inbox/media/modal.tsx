"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import FilePicker from "./filePicker";
import ImagePicker from "./imagePicker";
import GalleryPicker from "./galleryPicker";
import TemplatePicker from "./templatePicker";

import type { Category, GalleryImage, Template } from "@/lib/types";

interface MediaModalType {
    type: "image" | "video" | "audio" | "document" | "template" | "gallery";
}

interface MediaModalProps {
    mediaModal: MediaModalType | null;
    onClose: () => void;
    setMediaModal: (v: MediaModalType | null) => void;

    /* IMAGE */
    imageMode: "single" | "bulk";
    setImageMode: (v: "single" | "bulk") => void;
    imageInputRef: React.RefObject<HTMLInputElement | null>;
    handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;

    /* FILE */
    genericInputRef: React.RefObject<HTMLInputElement | null>;
    handleGenericFiles: (files: FileList) => Promise<void>;

    /* GALLERY */
    galleryCategories: Category[];
    gallerySubcategories: Category[];
    galleryImages: GalleryImage[];
    selectedGalleryImages: GalleryImage[];
    galleryLoading: boolean;
    includeCaption: boolean;
    isPreparingMedia: boolean;

    setSelectedGalleryImages: React.Dispatch<
        React.SetStateAction<GalleryImage[]>
    >;
    setIncludeCaption: (v: boolean) => void;
    handleGalleryCategoryClick: (id: number | null) => void;
    loadGalleryImages: (cat?: number, sub?: number) => void;
    toggleSelectAll: () => void;
    handleSendGalleryImages: () => Promise<void>;
    selectedGalleryCategory: number | null;
    selectedGallerySubcategory: number | null;
    setSelectedGallerySubcategory: (v: number | null) => void;

    /* TEMPLATE */
    templates: Template[];
    selectedTemplate: Template | null;
    setSelectedTemplate: (t: Template | null) => void;
    templateVariables: string[];
    setTemplateVariables: (v: string[]) => void;
    templateSearch: string;
    setTemplateSearch: (v: string) => void;
    isSendingTemplate: boolean;
    handleSendTemplate: () => Promise<void>;
}

export default function MediaModal(props: MediaModalProps) {
    const {
        mediaModal,
        onClose,
        imageMode,
        setImageMode,
        imageInputRef,
        handleImageSelect,
        setSelectedGalleryImages,
        setMediaModal,
    } = props;

    const title =
        mediaModal?.type === "template"
            ? "Select Template"
            : mediaModal?.type === "gallery"
                ? "Browse Gallery"
                : "Send Media";

    const subtitle =
        mediaModal?.type === "gallery"
            ? "Select images from your collection to send"
            : "Choose what you want to send";

    return (
        <AnimatePresence>
            {mediaModal && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        className="fixed inset-0 z-50 bg-black/60"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        key="modal"
                        initial={{ scale: 0.92, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.92, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[95%] ${mediaModal.type === "gallery" ? "max-w-6xl" : "max-w-md"
                            }
          bg-card rounded-2xl shadow-2xl overflow-hidden border`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b p-4">
                            <div>
                                <h2 className="text-xl font-bold">{title}</h2>
                                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg hover:bg-muted"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className={mediaModal.type === "gallery" ? "" : "p-4"}>
                            {mediaModal.type === "image" && (
                                <ImagePicker
                                    imageMode={imageMode}
                                    setImageMode={setImageMode}
                                    imageInputRef={imageInputRef}
                                    handleImageSelect={handleImageSelect}
                                    setSelectedGalleryImages={setSelectedGalleryImages}
                                    setMediaModal={setMediaModal}
                                />
                            )}

                            {mediaModal.type === "gallery" && <GalleryPicker {...props} />}

                            {(mediaModal.type === "video" ||
                                mediaModal.type === "audio" ||
                                mediaModal.type === "document") && (
                                    <FilePicker
                                        label="Device"
                                        description={`Select a ${mediaModal.type} from your device`}
                                        accept={
                                            mediaModal.type === "video"
                                                ? "video/*"
                                                : mediaModal.type === "audio"
                                                    ? "audio/*"
                                                    : "*"
                                        }
                                        inputRef={props.genericInputRef}
                                        onSelect={props.handleGenericFiles}
                                    />
                                )}

                            {mediaModal.type === "template" && <TemplatePicker {...props} />}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
