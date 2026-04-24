interface CsvColumn {
  key: string
  label: string
  format?: (value: unknown) => string
}

export function exportToCSV<T extends object>(
  data: T[],
  filename: string,
  columns: CsvColumn[]
) {
  const header = columns.map(col => `"${col.label}"`).join(',')
  const rows = data.map(row =>
    columns.map(col => {
      const value = (row as Record<string, unknown>)[col.key]
      const formatted = col.format ? col.format(value) : String(value ?? '')
      return `"${formatted.replace(/"/g, '""')}"`
    }).join(',')
  )

  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
