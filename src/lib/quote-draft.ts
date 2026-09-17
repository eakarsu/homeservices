export type QuoteDraft = {
  jobDescription:string;
  options:{tier:'good'|'better'|'best';name:string;description:string;laborCost:number;partsCost:number;totalCost:number;warranty:string;estimatedDuration:string;features:string[];recommended?:boolean}[];
  notes:string[];
}

// Normalize harmless provider formatting, without correcting invented amounts,
// assigning missing tiers, or concealing duplicate options.
export function parseQuoteDraft(value:unknown):QuoteDraft|null {
  if (!value || typeof value!=='object' || Array.isArray(value)) return null
  const row=value as Record<string,unknown>
  const strings=(v:unknown):v is string[]=>Array.isArray(v)&&v.every(s=>typeof s==='string')
  if (typeof row.jobDescription!=='string' || !row.jobDescription.trim() || !Array.isArray(row.options) || !strings(row.notes)) return null
  const options:QuoteDraft['options']=[]
  for (const value of row.options) {
    if (!value || typeof value!=='object') return null
    const option=value as Record<string,unknown>
    const tier=typeof option.tier==='string'?option.tier.trim().toLowerCase():''
    if (!['good','better','best'].includes(tier) || !['name','description','warranty','estimatedDuration'].every(key=>typeof option[key]==='string') || !strings(option.features)) return null
    const amount=(value:unknown)=> (typeof value==='number'||typeof value==='string') && /^\d+(?:\.\d{1,2})?$/.test(String(value)) ? Number(value) : NaN
    options.push({tier:tier as 'good'|'better'|'best',name:option.name as string,description:option.description as string,warranty:option.warranty as string,estimatedDuration:option.estimatedDuration as string,features:option.features,laborCost:amount(option.laborCost),partsCost:amount(option.partsCost),totalCost:amount(option.totalCost),recommended:option.recommended===true})
  }
  return {jobDescription:row.jobDescription,options,notes:row.notes}
}
