"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  Image as ImageIcon,
  Search,
  Check,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import ReactDOM from "react-dom";
import { galleryAPI } from "@/lib/galleryApi";
import api from "@/lib/api";

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string | string[]) => void;
  multiSelect?: boolean;
}

export default function GalleryModal({
  isOpen,
  onClose,
  onSelect,
  multiSelect = false,
}: GalleryModalProps) {
  const [images, setImages] = useState<any[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      fetchImages();
      setSelectedUrls([]);
    }
  }, [isOpen]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await galleryAPI.list();
      setImages(res.data?.images || []);
    } catch (error) {
      console.error("Failed to fetch images", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      // Assuming generic upload endpoint
      // Adjust if you have a specific gallery upload endpoint
      await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Refresh list
      await fetchImages();
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  const toggleSelection = (url: string) => {
    if (multiSelect) {
      setSelectedUrls((prev) =>
        prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url],
      );
    } else {
      onSelect(url);
    }
  };

  const handleConfirm = () => {
    onSelect(multiSelect ? selectedUrls : selectedUrls[0]);
  };

  if (!isOpen || !mounted) return null;

  const filteredImages = images.filter((img) =>
    img.url?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ImageIcon className="text-primary" />
            Media Gallery
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2 hover:bg-primary/90 transition disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Upload size={18} />
            )}
            Upload
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleUpload}
          />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-primary" size={40} />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredImages.map((img, idx) => {
                const isSelected = selectedUrls.includes(img.url);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleSelection(img.url)}
                    className={`group relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <Image
                      src={img.url}
                      className="object-cover"
                      alt="Gallery Image"
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 shadow-sm">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {multiSelect && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
            <span className="text-sm text-gray-500 font-medium">
              {selectedUrls.length} selected
            </span>
            <button
              onClick={handleConfirm}
              disabled={selectedUrls.length === 0}
              className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Insert Selected
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
