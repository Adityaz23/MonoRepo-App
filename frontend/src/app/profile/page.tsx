'use client'
import { useAuth } from '@clerk/nextjs'
import { useState } from 'react'
import { z } from 'zod'
// method =>
const optionalText = z
  .string()
  .transform(value => value.trim())
  .transform(value => (value === '' ? undefined : value))
  .optional()
const ProfileSchema = z.object({
  displayName: optionalText,
  handle: optionalText,
  bio: optionalText,
  avatarUrl: optionalText,
})
type ProfileFormValue = z.infer<typeof ProfileSchema>
type UserResponse = {
  id: number
  clerkUserId: string
  displayName: string | null
  handle: string | null
  bio: string | null
  avatarUrl: string | null
  email: string | null
}
export default function ProfilePage() {
  // getting the token from the methods =>
  const { getToken } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  return (
    <div>
      <h1>Profile Page</h1>
    </div>
  )
}
