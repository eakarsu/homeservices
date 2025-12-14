import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { callAI } from '@/lib/ai'

interface JobSummaryRequest {
  job: {
    id: string
    jobNumber: string
    title: string
    customerName: string
    address: string
    tradeType: string
  }
  technicianNotes: string
  workDescription: string
  timeSpent: number
  partsUsedText: string
  useSampleData?: boolean
}

interface JobSummaryResult {
  summary: string
  workPerformed: string[]
  partsUsed: {
    part: string
    quantity: number
    cost: number
  }[]
  findings: {
    finding: string
    severity: 'info' | 'warning' | 'critical'
    recommendation: string
  }[]
  recommendations: string[]
  followUpNeeded: boolean
  followUpReason?: string
  customerCommunication: {
    summary: string
    technicalDetails: string
    plainEnglish: string
  }
  qualityScore: number
  estimatedNextService: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: JobSummaryRequest = await request.json()
    const { job, technicianNotes, workDescription, timeSpent, partsUsedText } = body

    if (!job || !technicianNotes) {
      return NextResponse.json({ error: 'Job and technician notes are required' }, { status: 400 })
    }

    const systemPrompt = `You are an expert technical writer for a home services company.
Transform raw technician notes into professional, well-structured job reports.
Identify key findings, safety concerns, and future recommendations.
Create customer-friendly summaries while preserving technical accuracy.
Always respond with valid JSON.`

    const userPrompt = `Generate a professional job summary report for:

Job Details:
- Job Number: ${job.jobNumber}
- Service Type: ${job.tradeType}
- Title: ${job.title}
- Customer: ${job.customerName}
- Address: ${job.address}

Technician Notes:
${technicianNotes}

Work Description:
${workDescription}

Time Spent: ${timeSpent} hours

Parts Used:
${partsUsedText}

Generate a comprehensive job report in this exact JSON format:
{
  "summary": "A 2-3 sentence executive summary of the job",
  "workPerformed": ["array of work items completed, professional language"],
  "partsUsed": [
    {
      "part": "part name",
      "quantity": number,
      "cost": number
    }
  ],
  "findings": [
    {
      "finding": "what was found",
      "severity": "info" | "warning" | "critical",
      "recommendation": "what to do about it"
    }
  ],
  "recommendations": ["array of recommendations for future"],
  "followUpNeeded": boolean,
  "followUpReason": "reason if follow-up needed",
  "customerCommunication": {
    "summary": "Brief customer-friendly summary",
    "technicalDetails": "Technical explanation for customers who want details",
    "plainEnglish": "Simple explanation a non-technical person would understand"
  },
  "qualityScore": number (0-100, based on thoroughness of work),
  "estimatedNextService": "when next service is recommended"
}`

    let summaryResult: JobSummaryResult

    try {
      const response = await callAI(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        { temperature: 0.3, maxTokens: 3000 }
      )

      summaryResult = JSON.parse(response)

      // Ensure required fields
      summaryResult.summary = summaryResult.summary || 'Job completed successfully.'
      summaryResult.workPerformed = summaryResult.workPerformed || []
      summaryResult.partsUsed = summaryResult.partsUsed || []
      summaryResult.findings = summaryResult.findings || []
      summaryResult.recommendations = summaryResult.recommendations || []
      summaryResult.followUpNeeded = summaryResult.followUpNeeded || false
      summaryResult.qualityScore = summaryResult.qualityScore || 75
      summaryResult.estimatedNextService = summaryResult.estimatedNextService || 'Annual maintenance recommended'
      summaryResult.customerCommunication = summaryResult.customerCommunication || {
        summary: 'Service completed successfully.',
        technicalDetails: technicianNotes,
        plainEnglish: 'Your equipment has been serviced and is working properly.'
      }

    } catch {
      // Fallback summary generation
      const workItems = workDescription.split('\n').filter(line => line.trim())
      const noteLines = technicianNotes.split('\n').filter(line => line.trim())

      // Parse parts from text
      const partsUsed: { part: string; quantity: number; cost: number }[] = []
      const partsLines = partsUsedText.split('\n').filter(line => line.trim())
      for (const line of partsLines) {
        const match = line.match(/(.+?)\s*[-–]\s*\$?(\d+)/)
        if (match) {
          partsUsed.push({
            part: match[1].trim(),
            quantity: 1,
            cost: parseInt(match[2])
          })
        }
      }

      summaryResult = {
        summary: `${job.tradeType} service completed for ${job.customerName}. Work performed: ${job.title}. Total time: ${timeSpent} hours.`,
        workPerformed: workItems.length > 0 ? workItems : ['Service completed as requested'],
        partsUsed,
        findings: noteLines.slice(0, 3).map(note => ({
          finding: note,
          severity: 'info' as const,
          recommendation: 'Continue monitoring'
        })),
        recommendations: [
          'Schedule regular maintenance',
          'Replace air filters as recommended',
          'Monitor system performance'
        ],
        followUpNeeded: technicianNotes.toLowerCase().includes('leak') ||
          technicianNotes.toLowerCase().includes('corrosion') ||
          technicianNotes.toLowerCase().includes('worn'),
        followUpReason: 'Potential issues identified that should be monitored',
        customerCommunication: {
          summary: `Your ${job.tradeType.toLowerCase()} service has been completed. The technician spent ${timeSpent} hours addressing the issue.`,
          technicalDetails: technicianNotes,
          plainEnglish: `We fixed the problem with your ${job.title.toLowerCase()}. Everything is working properly now.`
        },
        qualityScore: 75,
        estimatedNextService: 'In 6-12 months for routine maintenance'
      }
    }

    return NextResponse.json(summaryResult)
  } catch (error) {
    console.error('Job summary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
