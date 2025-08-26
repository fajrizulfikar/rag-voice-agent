"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { QueryLog } from "@/types"
import { Search } from "lucide-react"

interface DataTableProps {
  logs: QueryLog[]
}

export function DataTable({ logs }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredLogs = logs.filter(
    (log) =>
      log.userQuestion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.aiAnswer.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Query Logs</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions or answers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchTerm ? "No matching logs found" : "No query logs yet"}
            </p>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 space-y-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Question</p>
                  <p className="text-sm">{log.userQuestion}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Answer Preview</p>
                  <p className="text-sm text-muted-foreground">
                    {log.aiAnswer.length > 100 ? `${log.aiAnswer.substring(0, 100)}...` : log.aiAnswer}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{log.timestamp.toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
