"use client"

import { useState, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  className?: string
}

export function ImageUpload({ value, onChange, className = "" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 简单验证
    if (!file.type.startsWith("image/")) {
      alert("请上传图片文件")
      return
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert("图片大小不能超过 5MB")
      return
    }

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('recipe-covers')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // 获取 Public URL
      const { data } = supabase.storage
        .from('recipe-covers')
        .getPublicUrl(filePath)

      onChange(data.publicUrl)
    } catch (error: any) {
      console.error("Upload error:", error)
      alert("上传失败: " + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    onChange("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={className}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*"
        className="hidden"
      />

      {value ? (
        <div className="relative aspect-video w-full rounded-[var(--radius-theme)] overflow-hidden border border-[var(--color-border-theme)] group">
          <img 
            src={value} 
            alt="Cover Preview" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-white/90 rounded-full text-red-500 hover:bg-white shadow-lg transition-transform hover:scale-110"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full aspect-video rounded-[var(--radius-theme)] border-2 border-dashed border-[var(--color-border-theme)] bg-[var(--color-page)] hover:bg-[var(--color-card)] hover:border-[var(--color-accent)] transition-all flex flex-col items-center justify-center gap-2 text-[var(--color-muted)] hover:text-[var(--color-accent)] group"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm font-medium">上传中...</span>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-[var(--color-card)] border border-[var(--color-border-theme)] group-hover:border-[var(--color-accent)] group-hover:bg-[var(--color-accent-light)] transition-colors">
                <Upload className="h-6 w-6" />
              </div>
              <div className="text-center">
                <span className="text-sm font-bold block">点击上传封面图</span>
                <span className="text-xs opacity-60">支持 JPG, PNG (Max 5MB)</span>
              </div>
            </>
          )}
        </button>
      )}
    </div>
  )
}

