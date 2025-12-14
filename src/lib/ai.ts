// Use OpenRouter API key - supports multiple AI models
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

// Fallback to OpenAI key if OpenRouter not configured
const API_KEY = OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
const API_BASE_URL = OPENROUTER_API_KEY
  ? OPENROUTER_BASE_URL
  : 'https://api.openai.com/v1'

// Default model - can use OpenAI, Anthropic, or other models via OpenRouter
const DEFAULT_MODEL = process.env.AI_MODEL || 'openai/gpt-4-turbo'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface AIResponse {
  id: string
  choices: {
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function callAI(
  messages: Message[],
  options: {
    temperature?: number
    maxTokens?: number
    jsonMode?: boolean
    model?: string
  } = {}
): Promise<string> {
  if (!API_KEY) {
    throw new Error('OPENROUTER_API_KEY or OPENAI_API_KEY is not configured')
  }

  const { temperature = 0.7, maxTokens = 1000, jsonMode = false, model = DEFAULT_MODEL } = options

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  }

  // Add OpenRouter specific headers
  if (OPENROUTER_API_KEY) {
    headers['HTTP-Referer'] = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    headers['X-Title'] = 'Home Services AI'
  }

  try {
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: OPENROUTER_API_KEY ? model : 'gpt-4',
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(jsonMode && { response_format: { type: 'json_object' } }),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('AI API error:', response.status, error)
      throw new Error(`AI API error: ${response.status} - ${error}`)
    }

    const data: AIResponse = await response.json()
    return data.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('AI call failed:', error)
    throw error
  }
}

// Legacy alias for backward compatibility
export const callOpenAI = callAI

export async function generateDiagnostics(
  equipmentType: string,
  symptoms: string
): Promise<{
  possibleCauses: { cause: string; probability: number; explanation: string }[]
  recommendedActions: string[]
  partsNeeded: string[]
  estimatedTime: number
  urgencyLevel: string
}> {
  const systemPrompt = `You are an expert HVAC, plumbing, and electrical diagnostic assistant.
Analyze the symptoms and provide detailed diagnostic information.
Always respond with valid JSON in the exact format requested.`

  const userPrompt = `Equipment Type: ${equipmentType}
Symptoms: ${symptoms}

Provide diagnostic analysis in this exact JSON format:
{
  "possibleCauses": [
    {"cause": "string", "probability": 0.0-1.0, "explanation": "string"}
  ],
  "recommendedActions": ["string"],
  "partsNeeded": ["string"],
  "estimatedTime": number (in minutes),
  "urgencyLevel": "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY"
}`

  const response = await callAI(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    { temperature: 0.3, maxTokens: 1500 }
  )

  try {
    return JSON.parse(response)
  } catch {
    return {
      possibleCauses: [
        { cause: 'Unable to determine', probability: 0.5, explanation: 'Please provide more details' }
      ],
      recommendedActions: ['Schedule on-site inspection'],
      partsNeeded: [],
      estimatedTime: 60,
      urgencyLevel: 'MEDIUM'
    }
  }
}

export async function optimizeDispatch(
  job: {
    id: string
    priority: string
    address: string
    lat?: number
    lng?: number
    requiredSkills: string[]
    estimatedDuration: number
  },
  technicians: {
    id: string
    name: string
    skills: string[]
    status: string
    currentLat?: number
    currentLng?: number
    currentJobEndTime?: Date
  }[]
): Promise<{
  recommendedTechnicianId: string
  score: number
  reasoning: string
  estimatedArrivalTime: number
  alternativeTechnicians: { id: string; score: number; reason: string }[]
}> {
  const systemPrompt = `You are an intelligent dispatch optimizer for a home services company.
Analyze job requirements and technician availability to recommend the best assignment.
Consider: skills match, location proximity, current availability, and job priority.
Always respond with valid JSON.`

  const userPrompt = `Job Details:
- Priority: ${job.priority}
- Location: ${job.address}
- Required Skills: ${job.requiredSkills.join(', ')}
- Estimated Duration: ${job.estimatedDuration} minutes

Available Technicians:
${technicians.map(t => `- ${t.name} (ID: ${t.id}): Skills: ${t.skills.join(', ')}, Status: ${t.status}`).join('\n')}

Recommend the best technician assignment in this JSON format:
{
  "recommendedTechnicianId": "string",
  "score": 0.0-1.0,
  "reasoning": "string explaining why this technician",
  "estimatedArrivalTime": number (minutes),
  "alternativeTechnicians": [{"id": "string", "score": number, "reason": "string"}]
}`

  const response = await callAI(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    { temperature: 0.3, maxTokens: 1000 }
  )

  try {
    return JSON.parse(response)
  } catch {
    const available = technicians.find(t => t.status === 'AVAILABLE')
    return {
      recommendedTechnicianId: available?.id || technicians[0]?.id || '',
      score: 0.5,
      reasoning: 'Auto-assigned based on availability',
      estimatedArrivalTime: 30,
      alternativeTechnicians: []
    }
  }
}

export async function optimizeRoute(
  technicianId: string,
  jobs: {
    id: string
    address: string
    scheduledStart?: Date
    priority: string
    estimatedDuration: number
  }[]
): Promise<{
  optimizedOrder: string[]
  totalDistance: number
  totalTime: number
  savings: { distance: number; time: number }
  reasoning: string
}> {
  const systemPrompt = `You are a route optimization expert for a home services company.
Plan the most efficient route considering job priorities, time windows, and distance.
Always respond with valid JSON.`

  const userPrompt = `Technician: ${technicianId}
Jobs to complete today:
${jobs.map((j, i) => `${i + 1}. ${j.address} (Priority: ${j.priority}, Duration: ${j.estimatedDuration}min, ID: ${j.id})`).join('\n')}

Optimize the route in this JSON format:
{
  "optimizedOrder": ["job_id_1", "job_id_2"],
  "totalDistance": number (miles),
  "totalTime": number (minutes),
  "savings": {"distance": number, "time": number},
  "reasoning": "string explaining the optimization"
}`

  const response = await callAI(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    { temperature: 0.3, maxTokens: 1000 }
  )

  try {
    return JSON.parse(response)
  } catch {
    return {
      optimizedOrder: jobs.map(j => j.id),
      totalDistance: jobs.length * 5,
      totalTime: jobs.reduce((acc, j) => acc + j.estimatedDuration + 20, 0),
      savings: { distance: 0, time: 0 },
      reasoning: 'Route planned in order received'
    }
  }
}

export async function generateEstimate(
  jobType: string,
  equipmentType: string,
  propertyType: string,
  issueDescription: string
): Promise<{
  options: {
    name: string
    description: string
    laborHours: number
    laborRate: number
    parts: { name: string; cost: number; price: number }[]
    total: number
    warranty: string
  }[]
  recommendation: string
  notes: string
}> {
  const systemPrompt = `You are a home services quoting expert.
Generate Good-Better-Best pricing options for service requests.
Use realistic pricing for typical home services.
Labor rate: $75-125/hour depending on complexity.
Always respond with valid JSON.`

  const userPrompt = `Job Type: ${jobType}
Equipment: ${equipmentType}
Property Type: ${propertyType}
Issue: ${issueDescription}

Generate quote options in this JSON format:
{
  "options": [
    {
      "name": "Good" | "Better" | "Best",
      "description": "string",
      "laborHours": number,
      "laborRate": number,
      "parts": [{"name": "string", "cost": number, "price": number}],
      "total": number,
      "warranty": "string"
    }
  ],
  "recommendation": "string explaining which option is recommended",
  "notes": "string with any additional considerations"
}`

  const response = await callAI(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    { temperature: 0.4, maxTokens: 2000 }
  )

  try {
    return JSON.parse(response)
  } catch {
    return {
      options: [
        {
          name: 'Standard Service',
          description: 'Basic service call',
          laborHours: 1,
          laborRate: 95,
          parts: [],
          total: 95,
          warranty: '30 days labor'
        }
      ],
      recommendation: 'Standard service recommended',
      notes: 'Final pricing may vary based on on-site assessment'
    }
  }
}
