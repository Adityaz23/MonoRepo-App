'use client'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { apiGet, apiPatch, createBrowserApiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { useAuth } from '@clerk/nextjs'
import { zodResolver } from '@hookform/resolvers/zod'
import { AtSign, Camera, Link2, Loader2, Quote, SaveIcon, User, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
const optionalText = z
  .string()
  .transform(value => value.trim())
  .transform(value => (value === '' ? undefined : value))
  .optional()
const ProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters'),

  handle: z
    .string()
    .trim()
    .min(3, 'Handle must be at least 3 characters')
    .max(30, 'Handle must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Handle can only contain letters, numbers, and underscores')
    .optional(),

  bio: z.string().trim().max(160, 'Bio cannot exceed 160 characters').optional(),

  avatarUrl: z.string().url('Please enter a valid image URL').optional(),
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
  const { errors } = form.formState
  async function onSubmit(values: ProfileFormValue) {
    try {
      setIsSaving(true)
      const payload: Record<string, string> = {}
      if (values.displayName) payload.displayName = values.displayName
      if (values.handle) payload.handle = values.handle
      if (values.avatarUrl) payload.avatarUrl = values.avatarUrl
      if (values.bio) payload.bio = values.bio
      const apiResponse = await apiPatch<typeof payload, UserResponse>(
        apiClient,
        '/api/me',
        payload
      )
      form.reset({
        displayName: apiResponse.displayName ?? '',
        handle: apiResponse.handle ?? '',
        bio: apiResponse.bio ?? '',
        avatarUrl: apiResponse.avatarUrl ?? '',
      })
      toast.success('Profile updated successfully', {
        description: 'Your changes have been saved successfully!',
      })
    } catch (error) {
      console.error(`Error :${error}`)
    } finally {
      setIsSaving(false)
    }
  }
  useEffect(() => {
    let isMounted = true
    async function loadProfile() {
      try {
        setIsLoading(true)
        const getUserInfo = await apiGet<UserResponse>(apiClient, '/api/me')
        if (!isMounted) {
          return
        }
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
  const bioValue = form.watch('bio')
  const avatarUrlValue = form.watch('avatarUrl')
  if (!isLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }
  return (
    <>
      {isSignedIn && <div>User is signed in</div>}
      {isSignedIn && (
        <main className="relative flex flex-1 flex-col overflow-hidden font-sans">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="animate-blob absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-primary-via/30 blur-3xl" />
            <div className="animate-blob absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-primary-from/30 blur-3xl [animation-delay:4s]" />
            <div className="animate-blob absolute bottom-0 left-10 h-64 w-64 rounded-full bg-primary-to/20 blur-3xl [animation-delay:8s]" />
          </div>
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
            <header className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-4">
                <div className="chat-bubble-sent flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-primary/20 transition-transform duration-300 hover:rotate-3 hover:scale-105">
                  <User className="size-6 text-white" />
                </div>
                <div>
                  <h1 className="animate-gradient-x bg-linear-to-r from-primary-from via-primary-via to-primary-to bg-clip-text text-3xl font-bold tracking-tight text-transparent bg-size-[200%_200%]">
                    Profile Settings
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">Manage your profile</p>
                </div>
              </div>
            </header>
            <Card className="animate-in fade-in slide-in-from-bottom-4 border-border/70 bg-card/80 backdrop-blur duration-700 transition-all [animation-delay:100ms] hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-6">
                  <div className="group relative">
                    <div className="chat-bubble-sent animate-float rounded-full p-0.75 shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:scale-105">
                      <Avatar className="size-20 bg-card">
                        {avatarUrlValue ? (
                          <AvatarImage src={avatarUrlValue} alt={displayNameValue} />
                        ) : (
                          <div className="flex size-full items-center justify-center bg-card text-2xl font-bold text-primary">
                            {(displayNameValue || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </Avatar>
                    </div>
                    <div className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground opacity-0 shadow-md transition-opacity duration-300 group-hover:opacity-100">
                      <Camera className="size-3.5" />
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <CardTitle className="text-2xl tracking-normal text-foreground uppercase">
                      {displayNameValue || 'Your display name'}
                    </CardTitle>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-300',
                          handleValue
                            ? 'chat-bubble-sent text-white shadow-sm'
                            : 'bg-accent text-accent-foreground'
                        )}
                      >
                        <AtSign className="size-3" />
                        {handleValue ? `@${handleValue}` : 'handle'}
                      </span>
                      {bioValue && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                          <Quote className="size-3" />
                          {bioValue.length > 40 ? `${bioValue.slice(0, 40)}…` : bioValue}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <Card className="animate-in fade-in slide-in-from-bottom-4 border-border/70 bg-card/80 backdrop-blur duration-700 transition-all [animation-delay:200ms] hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="h-6 w-1 rounded-full bg-linear-to-b from-primary-from to-primary-to" />
                  <CardTitle className="text-lg tracking-normal text-foreground">
                    Edit Profile
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-5 md:col-span-2">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="displayName"
                          className="flex items-center gap-2 text-sm font-semibold text-foreground"
                        >
                          <UserRound className="size-3 text-primary" />
                          Display Name
                        </label>
                        <Input
                          id="displayName"
                          placeholder="Aditya Soni"
                          {...form.register('displayName')}
                          className={cn(
                            'border-border bg-background/60 rounded-lg px-3 transition-all duration-300 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                            errors.displayName && 'border-red-500 focus-visible:border-red-500'
                          )}
                          disabled={isLoading || isSaving}
                        />
                        {errors.displayName && (
                          <p className="animate-in fade-in slide-in-from-top-1 text-sm text-red-500">
                            {errors.displayName.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="handle"
                          className="flex items-center gap-2 text-sm font-semibold text-foreground"
                        >
                          <AtSign className="size-3 text-primary" />
                          Handle
                        </label>
                        <Input
                          id="handle"
                          placeholder="adiztya"
                          {...form.register('handle')}
                          className={cn(
                            'border-border bg-background/60 rounded-lg px-3 transition-all duration-300 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                            errors.handle && 'border-red-500 focus-visible:border-red-500'
                          )}
                          disabled={isLoading || isSaving}
                        />
                        {errors.handle && (
                          <p className="animate-in fade-in slide-in-from-top-1 text-sm text-red-500">
                            {errors.handle.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="bio"
                            className="flex items-center gap-2 text-sm font-semibold text-foreground"
                          >
                            <Quote className="size-3 text-primary" />
                            Bio
                          </label>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {bioValue?.length ?? 0}/160
                          </span>
                        </div>
                        <Textarea
                          id="bio"
                          placeholder="Tell us about yourself"
                          rows={3}
                          {...form.register('bio')}
                          className={cn(
                            'border-border bg-background/60 rounded-lg px-3 transition-all duration-300 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                            errors.bio && 'border-red-500 focus-visible:border-red-500'
                          )}
                          disabled={isLoading || isSaving}
                        />
                        {errors.bio && (
                          <p className="animate-in fade-in slide-in-from-top-1 text-sm text-red-500">
                            {errors.bio.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="avatarUrl"
                          className="flex items-center gap-2 text-sm font-semibold text-foreground"
                        >
                          <Link2 className="size-3 text-primary" />
                          Avatar URL
                        </label>
                        <Input
                          id="avatarUrl"
                          placeholder="https://example.com/avatar.jpg"
                          {...form.register('avatarUrl')}
                          className={cn(
                            'border-border bg-background/60 rounded-lg px-3 transition-all duration-300 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                            errors.avatarUrl && 'border-red-500 focus-visible:border-red-500'
                          )}
                          disabled={isLoading || isSaving}
                        />
                        {errors.avatarUrl && (
                          <p className="animate-in fade-in slide-in-from-top-1 text-sm text-red-500">
                            {errors.avatarUrl.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <CardFooter className="-mx-8 items-center justify-between gap-4 border-t border-border/70 pt-8">
                    <p className="text-xs text-muted-foreground">
                      Your profile changes will be visible to others.
                    </p>
                    <Button
                      type="submit"
                      disabled={isLoading || isSaving}
                      className="chat-bubble-sent rounded-lg border-transparent text-white shadow-md shadow-primary/20 transition-all duration-300 hover:opacity-85 hover:shadow-lg hover:shadow-primary/30"
                    >
                      {isSaving ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <SaveIcon className="size-4" />
                      )}
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </CardFooter>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      )}
    </>
  )
}
export default ProfilePage
