import type {AIField} from './form-ai'
const prose=(key:string,label:string):AIField=>({key,label,prose:true,optional:true})
const fact=(key:string,label:string,type?:AIField['type']):AIField=>({key,label,type,optional:true})
const choices=(key:string,label:string,options:string[]):AIField=>({...fact(key,label),options})
const trade=choices('tradeType','Service type',['HVAC','PLUMBING','ELECTRICAL','GENERAL'])
export const aiPageFields:Record<string,AIField[]>={
  diagnostics:[trade,prose('symptoms','Symptoms'),fact('equipmentType','Equipment type'),fact('equipmentAge','Equipment age (years)','integer'),prose('additionalInfo','Additional information')],
  'job-summary':[prose('technicianNotes','Technician notes'),prose('workDescription','Work description'),fact('timeSpent','Time spent (hours)','decimal'),prose('partsUsedText','Parts used')],
  'smart-scheduling':[fact('serviceName','Service'),fact('preferredDate','Preferred date','date'),choices('preferredTime','Preferred time',['morning','afternoon','evening','any']),choices('urgency','Urgency',['low','normal','high','emergency'])],
  'dispatch-optimizer':[fact('selectedDate','Dispatch date','date'),prose('dispatchRequirements','Dispatch requirements')],
  'route-optimizer':[fact('technicianName','Technician'),fact('routeDate','Route date','date'),prose('routeRequirements','Route requirements')],
  'predictive-maintenance':[fact('equipmentType','Equipment type'),prose('maintenanceConcerns','Maintenance concerns')],
  'customer-insights':[prose('analysisFocus','Analysis focus')],
  'inventory-forecast':[choices('forecastPeriod','Forecast period (days)',['30','60','90']),fact('selectedCategory','Category'),prose('stockRequirements','Stock requirements')],
  'photo-intake':[trade,prose('photoInstructions','Photo analysis instructions')],
  'subscription-health':[prose('reviewFocus','Agreement review focus')],
}
export const aiWorkflowPages=Object.keys(aiPageFields)
export function workflowDetailsText(mode:string, values:Record<string,unknown>):string {
  return (aiPageFields[mode] || []).flatMap(f=>typeof values[f.key]==='string' && String(values[f.key]).trim() && String(values[f.key]).length <= 4000 ? [`${f.label}: ${values[f.key]}`] : []).join('\n\n')
}
