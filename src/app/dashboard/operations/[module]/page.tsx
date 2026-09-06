import OperationsPage from '@/components/OperationsPage'
export default async function Page({params}:{params:Promise<{module:string}>}){return <OperationsPage module={(await params).module}/>}
