"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Upload, X, FileText, Image, Loader2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Anexo {
  id: number
  nome: string
  tipo: string
  tamanho: number
  url: string
  criadoEm: string
}

interface FileUploadProps {
  chamadoId: number
  anexos: Anexo[]
  onUploadComplete?: () => void
  disabled?: boolean
}

export function FileUpload({ chamadoId, anexos, onUploadComplete, disabled }: FileUploadProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const getFileIcon = (tipo: string) => {
    if (tipo.startsWith("image/")) return <Image className="h-5 w-5" />
    return <FileText className="h-5 w-5" />
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)

        const res = await fetch(`/api/chamados/${chamadoId}/anexos`, {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Erro ao enviar arquivo")
        }
      }

      toast({ title: "Arquivo(s) enviado(s) com sucesso!" })
      onUploadComplete?.()
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  const handleDelete = async (anexoId: number) => {
    setDeleting(anexoId)

    try {
      const res = await fetch(`/api/chamados/${chamadoId}/anexos/${anexoId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Erro ao excluir")

      toast({ title: "Anexo removido!" })
      onUploadComplete?.()
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível excluir o anexo", variant: "destructive" })
    } finally {
      setDeleting(null)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files)
    }
  }

  return (
    <div className="space-y-4">
      {/* Área de Drop */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => handleUpload(e.target.files)}
          disabled={disabled || uploading}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
        />
        <div className="flex flex-col items-center justify-center text-center">
          {uploading ? (
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
          ) : (
            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          )}
          <p className="text-sm font-medium">
            {uploading ? "Enviando..." : "Arraste arquivos ou clique para selecionar"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Imagens, PDFs, documentos Word/Excel (máx. 10MB)
          </p>
        </div>
      </div>

      {/* Lista de Anexos */}
      {anexos.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Anexos ({anexos.length})</p>
          <div className="space-y-2">
            {anexos.map((anexo) => (
              <div
                key={anexo.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <a
                  href={anexo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 flex-1 hover:text-primary transition-colors"
                >
                  <div className="p-2 bg-muted rounded">
                    {getFileIcon(anexo.tipo)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{anexo.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(anexo.tamanho)} • {new Date(anexo.criadoEm).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(anexo.id)}
                  disabled={deleting === anexo.id}
                >
                  {deleting === anexo.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


