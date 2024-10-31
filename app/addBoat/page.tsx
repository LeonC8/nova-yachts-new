'use client'
import AddBoatForm from '@/components/AddBoatForm'
import { useRouter } from 'next/navigation'

export default function AddBoatPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/dashboard') // or wherever you want to redirect after successful submission
  }

  return (
    <AddBoatForm onSuccess={handleSuccess} />
  )
}
