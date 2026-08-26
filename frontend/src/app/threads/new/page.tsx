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
  body: z.string().trim().min(15, 'Body is too short'),
  categorySlug: z.string().trim().min(1, 'Category is required'),
})

type NewThreadFormValue = z.infer<typeof NewThreadSchema>

export default function NewThreadPage() {
  const { getToken } = useAuth()
  const router = useRouter()

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken])

  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<NewThreadFormValue>({
    resolver: zodResolver(NewThreadSchema),
    defaultValues: {
      title: '',
      categorySlug: '',
      body: '',
    },
  })

  useEffect(() => {
    let isMounted = true

    async function load() {
      setIsLoading(true)

      try {
        const extractCats = await apiGet<Category[]>(apiClient, '/api/threads/categories')

        if (!isMounted) return

        setCategories(extractCats)

        if (extractCats.length > 0) {
          form.setValue('categorySlug', extractCats[0]?.slug ?? '')
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
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

      toast.error('Failed to create thread', {
        description: 'Something went wrong while publishing your thread.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-[calc(100vh-68px)] overflow-hidden bg-[#090d18] px-4 pb-16 pt-28 text-foreground">
      {/* Background glow - left */}
      <div
        className="
          pointer-events-none
          absolute
          -left-32
          bottom-0
          h-96
          w-96
          rounded-full
          bg-indigo-600/20
          blur-[130px]
        "
      />

      {/* Background glow - right */}
      <div
        className="
          pointer-events-none
          absolute
          -right-32
          top-40
          h-125
          w-125
          rounded-full
          bg-fuchsia-600/20
          blur-[140px]
        "
      />

      <div className="relative mx-auto w-full max-w-3xl">
        {/* Page heading */}
        <div className="mb-7">
          <h1
            className="
              font-serif
              text-4xl
              font-bold
              tracking-tight
              text-white
              md:text-5xl
            "
          >
            Start a new thread.
          </h1>

          <p className="mt-3 text-sm text-white/50">
            Share something with the ThreadFlow community.
          </p>
        </div>

        {/* Main form card */}
        <Card
          className="
            overflow-hidden
            rounded-none
            border
            border-white/5
            bg-[#171514]
            shadow-2xl
          "
        >
          <CardHeader className="px-8 pb-6 pt-8 md:px-10 md:pt-10">
            <CardTitle
              className="
                relative
                pl-5
                font-serif
                text-2xl
                font-bold
                uppercase
                tracking-wide
                text-white
              "
            >
              {/* Gradient accent */}
              <span
                className="
                  absolute
                  left-0
                  top-1
                  h-7
                  w-1
                  rounded-full
                  bg-linear-to-b
                  from-fuchsia-500
                  to-indigo-500
                "
              />
              Thread Details
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-7 px-8 md:px-10">
            {/* Title */}
            <div className="space-y-3">
              <label
                htmlFor="title"
                className="
                  font-serif
                  text-sm
                  font-bold
                  text-white
                "
              >
                Thread title
              </label>

              <Input
                id="title"
                placeholder="Thread Title..."
                {...form.register('title')}
                disabled={isLoading || isSubmitting}
                className="
                  h-11
                  rounded-lg
                  border-white/10
                  bg-[#0f1118]
                  px-4
                  text-sm
                  text-white
                  placeholder:text-white/35
                  focus:border-fuchsia-500/50
                  focus:ring-2
                  focus:ring-fuchsia-500/10
                "
              />

              {form.formState.errors.title && (
                <p className="text-xs text-red-400">{form.formState.errors.title.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-3">
              <label
                htmlFor="categorySlug"
                className="
                  font-serif
                  text-sm
                  font-bold
                  text-white
                "
              >
                Category
              </label>

              <select
                id="categorySlug"
                {...form.register('categorySlug')}
                disabled={isLoading || isSubmitting}
                className="
                  h-11
                  w-full
                  appearance-none
                  rounded-lg
                  border
                  border-white/10
                  bg-[#0f1118]
                  px-4
                  text-sm
                  text-white
                  outline-none
                  transition
                  focus:border-fuchsia-500/50
                  focus:ring-2
                  focus:ring-fuchsia-500/10
                "
              >
                {categories.map(category => (
                  <option
                    value={category.slug}
                    id={category.slug}
                    key={category.slug}
                    className="bg-[#0f1118]"
                  >
                    {category.name}
                  </option>
                ))}
              </select>

              {form.formState.errors.categorySlug && (
                <p className="text-xs text-red-400">{form.formState.errors.categorySlug.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="body"
                  className="
                    font-serif
                    text-sm
                    font-bold
                    text-white
                  "
                >
                  Description
                </label>

                <span className="text-xs text-white/35">
                  {form.watch('body')?.length ?? 0}/5000
                </span>
              </div>

              <Textarea
                id="body"
                rows={9}
                placeholder="Add thread description..."
                disabled={isLoading || isSubmitting}
                {...form.register('body')}
                className="
                  resize-none
                  rounded-lg
                  border-white/10
                  bg-[#0f1118]
                  px-4
                  py-3
                  text-sm
                  leading-6
                  text-white
                  placeholder:text-white/35
                  focus:border-fuchsia-500/50
                  focus:ring-2
                  focus:ring-fuchsia-500/10
                "
              />

              {form.formState.errors.body && (
                <p className="text-xs text-red-400">{form.formState.errors.body.message}</p>
              )}
            </div>
          </CardContent>

          {/* Footer */}
          <CardFooter
            className="
              mt-8
              flex
              flex-col
              items-stretch
              gap-5
              border-t
              border-white/5
              px-8
              py-6
              sm:flex-row
              sm:items-center
              sm:justify-between
              md:px-10
            "
          >
            <p className="text-xs text-white/40">Your thread will be visible to the community.</p>

            <Button
              type="submit"
              disabled={isLoading || isSubmitting}
              onClick={form.handleSubmit(onThreadSubmit)}
              className="
                h-11
                min-w-40
                rounded-lg
                border-0
                bg-gradient-to-r
                from-pink-500
                to-indigo-500
                px-6
                font-serif
                text-sm
                font-bold
                uppercase
                tracking-wide
                text-white
                shadow-lg
                shadow-fuchsia-500/10
                transition-all
                hover:scale-[1.02]
                hover:from-pink-400
                hover:to-indigo-400
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {isSubmitting ? 'Publishing...' : 'Publish Thread'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
