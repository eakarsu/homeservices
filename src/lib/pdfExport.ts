import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface PdfColumn {
  header: string
  dataKey: string
}

export function exportTableToPDF(
  title: string,
  columns: PdfColumn[],
  rows: Record<string, string | number>[],
  filename: string
) {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text(title, 14, 22)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30)

  autoTable(doc, {
    startY: 36,
    head: [columns.map(c => c.header)],
    body: rows.map(row => columns.map(c => String(row[c.dataKey] ?? ''))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [249, 115, 22] },
  })

  doc.save(`${filename}.pdf`)
}
