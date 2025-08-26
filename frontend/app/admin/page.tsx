"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUploadCard } from "@/components/file-upload-card"
import { DataTable } from "@/components/data-table"
import type { Document, QueryLog } from "@/types"
import { ArrowLeft, Upload, BarChart3 } from "lucide-react"

// Mock data
const mockQueryLogs: QueryLog[] = [
  {
    id: "1",
    userQuestion: "What are your business hours?",
    aiAnswer:
      "Our business hours are Monday through Friday, 9 AM to 6 PM EST. We are closed on weekends and major holidays.",
    timestamp: new Date("2024-01-15T10:30:00"),
  },
  {
    id: "2",
    userQuestion: "How do I reset my password?",
    aiAnswer:
      'To reset your password, click on the "Forgot Password" link on the login page, enter your email address, and follow the instructions sent to your email.',
    timestamp: new Date("2024-01-15T11:45:00"),
  },
  {
    id: "3",
    userQuestion: "What payment methods do you accept?",
    aiAnswer:
      "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for enterprise customers.",
    timestamp: new Date("2024-01-15T14:20:00"),
  },
]

export default function AdminPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [queryLogs] = useState<QueryLog[]>(mockQueryLogs)

  const handleFileUpload = (file: File) => {
    const newDocument: Document = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type.includes("pdf") ? "pdf" : file.name.endsWith(".md") ? "markdown" : "txt",
      uploadedAt: new Date(),
      size: file.size,
    }

    setDocuments((prev) => [...prev, newDocument])

    // Mock upload process
    console.log("Uploading file:", file.name)
  }

  const handleRemoveDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Chat
              </Link>
            </Button>
            <h1 className="text-xl font-semibold text-foreground">Admin Dashboard</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Query Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Document Management</CardTitle>
                <p className="text-sm text-muted-foreground">Upload and manage documents for your FAQ knowledge base</p>
              </CardHeader>
              <CardContent>
                <FileUploadCard
                  onFileUpload={handleFileUpload}
                  documents={documents}
                  onRemoveDocument={handleRemoveDocument}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <DataTable logs={queryLogs} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
