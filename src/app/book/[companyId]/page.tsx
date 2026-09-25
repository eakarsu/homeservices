import BookingForm from '@/components/BookingForm'
export default async function Page({params}:{params:Promise<{companyId:string}>}) { return <BookingForm companyId={(await params).companyId}/> }
