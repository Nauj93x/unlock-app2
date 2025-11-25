"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileSpreadsheet, Download, AlertCircle } from "lucide-react"

export function ExcelUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    success: number
    errors: string[]
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setUploadResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    try {
      // Here you would process the Excel file
      // For now, we'll simulate the upload process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate processing results
      setUploadResult({
        success: 45,
        errors: ["Fila 12: Email inválido", "Fila 23: Nombre requerido"],
      })

      setFile(null)
    } catch (error) {
      console.error("Error uploading file:", error)
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    // Create a simple CSV template
    const csvContent =
      "nombre,email,rol\nJuan Pérez,juan@example.com,cliente\nMaría García,maria@example.com,administrador"
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "plantilla_usuarios.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileSpreadsheet className="w-5 h-5" />
          <span>Carga Masiva de Usuarios</span>
        </CardTitle>
        <CardDescription>Sube un archivo Excel o CSV para crear múltiples usuarios</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="file">Archivo Excel/CSV</Label>
            <Input id="file" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
            <p className="text-sm text-gray-600 mt-1">Formatos soportados: .xlsx, .xls, .csv</p>
          </div>

          {file && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium">Archivo seleccionado:</p>
              <p className="text-sm text-gray-600">{file.name}</p>
              <p className="text-sm text-gray-600">Tamaño: {(file.size / 1024).toFixed(2)} KB</p>
            </div>
          )}

          <div className="flex space-x-4">
            <Button onClick={downloadTemplate} variant="outline" className="flex-1 bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Descargar Plantilla
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Archivo
                </>
              )}
            </Button>
          </div>

          {uploadResult && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">✓ {uploadResult.success} usuarios creados exitosamente</p>
              </div>

              {uploadResult.errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-red-800 font-medium">Errores encontrados:</p>
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {uploadResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
