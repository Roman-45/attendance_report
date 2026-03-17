import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'
import type { Module } from '@/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { FileSpreadsheet, FileText, Download } from 'lucide-react'

export default function Reports() {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('')
  const [downloading, setDownloading] = useState<string | null>(null)
  const { toast } = useToast()

  const { data: modules = [] } = useQuery({
    queryKey: ['modules'],
    queryFn: () => client.get('/modules').then(r => r.data.data),
  })

  const downloadReport = async (type: 'attendance' | 'marks', format: 'excel' | 'pdf') => {
    if (!selectedModuleId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a module' })
      return
    }
    const key = `${type}-${format}`
    setDownloading(key)
    try {
      const response = await client.get(`/reports/module/${selectedModuleId}/${type}/${format}`, {
        responseType: 'blob',
      })
      const ext = format === 'excel' ? 'xlsx' : 'pdf'
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${type}_report.${ext}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast({ title: 'Report downloaded' })
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate report' })
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Reports</h1>

      <div className="max-w-sm">
        <Label>Select Module</Label>
        <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
          <SelectTrigger><SelectValue placeholder="Choose a module" /></SelectTrigger>
          <SelectContent>
            {modules.map((m: Module) => (
              <SelectItem key={m.id} value={String(m.id)}>{m.code} - {m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" /> Attendance Report
            </CardTitle>
            <CardDescription>Download attendance records for the selected module</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button variant="outline" onClick={() => downloadReport('attendance', 'excel')} disabled={!!downloading || !selectedModuleId}>
              <Download className="h-4 w-4 mr-2" /> {downloading === 'attendance-excel' ? 'Downloading...' : 'Excel'}
            </Button>
            <Button variant="outline" onClick={() => downloadReport('attendance', 'pdf')} disabled={!!downloading || !selectedModuleId}>
              <Download className="h-4 w-4 mr-2" /> {downloading === 'attendance-pdf' ? 'Downloading...' : 'PDF'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Marks Report
            </CardTitle>
            <CardDescription>Download marks and grades for the selected module</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button variant="outline" onClick={() => downloadReport('marks', 'excel')} disabled={!!downloading || !selectedModuleId}>
              <Download className="h-4 w-4 mr-2" /> {downloading === 'marks-excel' ? 'Downloading...' : 'Excel'}
            </Button>
            <Button variant="outline" onClick={() => downloadReport('marks', 'pdf')} disabled={!!downloading || !selectedModuleId}>
              <Download className="h-4 w-4 mr-2" /> {downloading === 'marks-pdf' ? 'Downloading...' : 'PDF'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
