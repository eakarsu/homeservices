'use client'
import {useCallback,useRef} from 'react'
export function useWorkflowFetch(){const keys=useRef(new Map<string,string>());return useCallback(async(url:string,body:unknown,method='POST')=>{const raw=JSON.stringify(body),signature=[url,method,raw].join('|');let key=keys.current.get(signature);if(!key){key=crypto.randomUUID();keys.current.set(signature,key)}const response=await fetch(url,{method,headers:{'Content-Type':'application/json','Idempotency-Key':key},body:raw});if(response.ok)keys.current.delete(signature);return response},[])}
