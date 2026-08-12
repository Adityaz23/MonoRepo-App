'use client'
import { apiGet, createBrowserApiClient } from '@/lib/api-client'
import { useAuth } from '@clerk/nextjs'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
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
  emailId: string | null
  displayName: string | null
  handle: string | null
  avatarUrl: string | null
  bio: string | null
}
function ProfilePage() {
  const { getToken } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken])
  const form = useForm<ProfileFormValue>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: { displayName: '', bio: '', handle: '', avatarUrl: '' },
  })
  useEffect(() => {
    let isMounted = true
    async function loadProfile() {
      try {
        setIsLoading(true)
        const getUserInfo = await apiGet<UserResponse>(apiClient, '/api/me')
        if (!isMounted) {
          return
        }
        console.log(getUserInfo, 'getUserInfo')
        form.reset({
          displayName: getUserInfo.displayName ?? '',
          bio: getUserInfo.bio ?? '',
          avatarUrl: getUserInfo.avatarUrl ?? '',
          handle: getUserInfo.handle ?? '',
        })
      } catch (error: any) {
        console.error(`Error : ${error}`)
      } finally {
        if (isMounted) {
          setIsLoading
        }
      }
    }
    loadProfile()
  }, [apiClient, form])
  return <div>Profile</div>
}
export default ProfilePage
