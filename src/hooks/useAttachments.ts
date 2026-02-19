"use client";

import { useState, useRef, useCallback } from "react";

export interface Attachment {
  name: string;
  url: string;
  mimeType?: string;
  base64?: string;
  isImage: boolean;
}

const FILE_UPLOAD_LIMIT_MB = 10;

export function useAttachments() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setShowAttachMenu(false);
    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith("image/");
      if (isImage && file.size > FILE_UPLOAD_LIMIT_MB * 1024 * 1024) {
        setAttachments((prev) => [...prev, {
          name: `[超过${FILE_UPLOAD_LIMIT_MB}MB] ${file.name}`, url: "", isImage: false,
        }]);
        continue;
      }
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error || "Upload failed");
        }
        const data = await res.json();
        setAttachments((prev) => [...prev, {
          name: file.name,
          url: data.url,
          mimeType: data.mimeType,
          base64: data.base64,
          isImage: !!data.base64,
        }]);
      } catch {
        setAttachments((prev) => [...prev, {
          name: file.name, url: `[上传失败] ${file.name}`, isImage: false,
        }]);
      }
    }
  }, []);

  const removeAttachment = useCallback((idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  const toggleAttachMenu = useCallback(() => {
    setShowAttachMenu((v) => !v);
  }, []);

  return {
    attachments,
    showAttachMenu,
    fileInputRef,
    cameraInputRef,
    galleryInputRef,
    handleFiles,
    removeAttachment,
    clearAttachments,
    toggleAttachMenu,
  };
}
