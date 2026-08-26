// This is for the people to create a new thread.
'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { apiGet, apiPost, createBrowserApiClient } from '@/lib/api-client'
import { Category, ThreadDetail } from '@/types/thread'
import { useAuth } from '@clerk/nextjs'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
const NewThreadSchema = z.object({
  title: z.string().trim().min(5, 'Title is too short'),
  body: z.string().trim().min(15, 'Body is too shoirt'),
  categorySlug: z.string().trim().min(1, 'Category is required'),
})

type NewThreadFormValue = z.infer<typeof NewThreadSchema>
export default function NewThreadPage() {
  const { getToken } = useAuth()
  const router = useRouter()
  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setISLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<NewThreadFormValue>({
    resolver: zodResolver(NewThreadSchema),
    defaultValues: {
      title: '',
      categorySlug: '',
      body: '',
    },
  })

  // Fetching the list of categories :-
  useEffect(() => {
    let isMounted = true
    async function load() {
      setISLoading(true)
      try {
        const extractCats = await apiGet<Category[]>(apiClient, '/api/threads/categories')
        if (!isMounted) return
        setCategories(extractCats)
        if (extractCats.length > 0) {
          form.setValue('categorySlug', extractCats[0]?.slug)
        }
      } catch (error) {
        console.error(`Error :${error}`)
      } finally {
        if (isMounted) setISLoading(false)
      }
    }
    load()
  }, [apiClient, form])

  async function onThreadSubmit(values: NewThreadFormValue) {
    try {
      setIsSubmitting(true)

      console.log('Submitting values:', values)

      const created = await apiPost<NewThreadFormValue, ThreadDetail>(
        apiClient,
        '/api/threads/threads',
        values
      )

      console.log('Created thread:', created)

      toast.success('New Thread Created Successfully', {
        description: 'Your thread is now live!',
      })

      router.push(`/threads/${created.id}`)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Start a new thread.</h1>
      </div>
      <Card className="border-border/70 bg-card">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Thread Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={form.handleSubmit(onThreadSubmit)}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground" htmlFor="title">
                Thread title
              </label>
              <Input
                id="title"
                placeholder="Thread Title..."
                {...form.register('title')}
                disabled={isLoading || isSubmitting}
                className="border-border bg-background/70 text-sm mt-3"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground" htmlFor="categorySlug">
                Category
              </label>
              <select
                id="categorySlug"
                {...form.register('categorySlug')}
                disabled={isLoading || isSubmitting}
                className="h-10 mt-3 w-full border border-border rounded-md bg-background/70 px-3 text-foreground text-sm focus:outline focus:ring-2 focus:ring-primary/30"
              >
                {categories.map(category => (
                  <option value={category.slug} key={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground" htmlFor="body">
                Description
              </label>
              <Textarea
                id="body"
                rows={6}
                placeholder="Add Threads Description"
                disabled={isLoading || isSubmitting}
                className="border-border mt-2 bg-background/70 text-sm"
                {...form.register('body')}
              />
            </div>
            <CardFooter className="flex justify-end border-t border-border px-0 pt-5">
              <Button
                type="submit"
                disabled={isSubmitting}
                className={'bg-primary text-primary-foreground hover:bg-primary/90'}
              >
                {isSubmitting ? 'Submitting' : 'Publish Thread'}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
