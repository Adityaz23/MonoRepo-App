'use client'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { apiGet, createBrowserApiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { useAuth } from '@clerk/nextjs'
import { zodResolver } from '@hookform/resolvers/zod'
import { User } from 'lucide-react'
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
  const { getToken, isLoaded, isSignedIn } = useAuth()
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
          setIsLoading(false)
        }
      }
    }
    loadProfile()
  }, [apiClient, form])
  const displayNameValue = form.watch('displayName')
  const handleValue = form.watch('handle')
  const avatarUrlValue = form.watch('avatarUrl')
  if (!isLoaded) {
    return <div>Loading...</div>
  }
  return (
    <>
      {isSignedIn && <div>User is signed in</div>}
      {isSignedIn && (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
          <div>
            <h1>
              <User className="w-8 h-8 text-primary" />
              Profile Settings
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your Profile</p>
          </div>
          <Card className="border-border/70 bg-card">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20">
                  {avatarUrlValue && (
                    <AvatarImage
                      src={avatarUrlValue || '/placeholder.xyz'}
                      alt={displayNameValue}
                    />
                  )}
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-2xl text-foreground">
                    {displayNameValue || 'Your dispaly name'}
                  </CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium',
                        handleValue
                          ? 'bg-primary/10 text-primary'
                          : 'bg-accent text-accent-foreground'
                      )}
                    >
                      {handleValue ? `@${handleValue}` : '@handle.com'}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
          <Card className="border-border/70 bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Display Name</label>
                    <Input id="displayName" />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
export default ProfilePage
