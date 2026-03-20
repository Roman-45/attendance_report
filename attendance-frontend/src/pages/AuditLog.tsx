import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import client from '@/api/client'
import type { AuditLogEntry } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'
import { SkeletonRow } from '@/components/ui/skeleton'
import { format } from 'date-fns'

export default function AuditLog() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['audit-log', page, search],
    queryFn: () => client.get('/audit-logs', { params: { page, size: 20, search: search || undefined } }).then(r => r.data.data),
  })

  const logs: AuditLogEntry[] = data?.content ?? data ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search audit log..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} />
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="hidden md:table-cell">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              ) : logs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No audit entries</TableCell></TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                    <TableCell>{log.entityType} #{log.entityId}</TableCell>
                    <TableCell>{log.performedBy}</TableCell>
                    <TableCell>{format(new Date(log.performedAt), 'MMM d, yyyy HH:mm')}</TableCell>
                    <TableCell className="max-w-xs truncate hidden md:table-cell">{log.details}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>Next</Button>
        </div>
      )}
    </div>
  )
}
