'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { apiGet, createBrowserApiClient } from '@/lib/api-client'
import { Category, ThreadSummary } from '@/types/thread'
import { useAuth } from '@clerk/nextjs'
import { Hash, Loader2, MessageSquare, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState } from 'react'

export default function ThreadPage() {
  const { getToken } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken])

  const [categories, setCategories] = useState<Category[]>([])
  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [gettingError, setGettingError] = useState(false)

  const activeCategory = searchParams.get('category') ?? 'all'
  const queryFromUrl = searchParams.get('q') ?? ''

  const [search, setSearch] = useState(queryFromUrl)

  useEffect(() => {
    setSearch(queryFromUrl)
  }, [queryFromUrl])

  useEffect(() => {
    let isMounted = true

    async function loadCategories() {
      try {
        const data = await apiGet<Category[]>(apiClient, '/api/threads/categories')

        if (!isMounted) return

        setCategories(data)
      } catch (error) {
        console.error('Failed to load categories:', error)

        if (isMounted) {
          setGettingError(true)
        }
      }
    }

    loadCategories()

    return () => {
      isMounted = false
    }
  }, [apiClient])

  useEffect(() => {
    let isMounted = true

    async function loadThreads() {
      try {
        setIsLoading(true)
        setGettingError(false)

        const data = await apiGet<ThreadSummary[]>(apiClient, '/api/threads/threads', {
          params: {
            category: activeCategory !== 'all' ? activeCategory : undefined,
            q: search || undefined,
          },
        })

        if (!isMounted) return

        setThreads(data)
      } catch (error) {
        console.error('Failed to load threads:', error)

        if (isMounted) {
          setGettingError(true)
          setThreads([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadThreads()

    return () => {
      isMounted = false
    }
  }, [apiClient, activeCategory, queryFromUrl])
  const pathname = usePathname()

  function applyFilters(currentCategory: string, currentSearch: string) {
    const params = new URLSearchParams()

    if (currentCategory && currentCategory !== 'all') {
      params.set('category', currentCategory)
    }

    if (currentSearch.trim()) {
      params.set('q', currentSearch.trim())
    }

    const queryString = params.toString()

    router.replace(queryString ? `${pathname}?${queryString}` : pathname)
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    applyFilters(activeCategory, search)
  }

  function handleCategoryChange(category: string) {
    applyFilters(category, search)
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-40 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 bottom-20 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page heading */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-pink-500 to-violet-500 shadow-lg shadow-purple-500/20">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Community
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Threads
              </h1>
            </div>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            Join the conversation, ask questions, share what you're building, and connect with other
            developers.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Categories */}
          <aside>
            <Card className="sticky top-24 overflow-hidden border-border/60 bg-card/90 shadow-xl shadow-black/10 backdrop-blur">
              <CardHeader className="border-b border-border/50 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Categories</CardTitle>

                    <p className="mt-1 text-xs text-muted-foreground">Browse discussions</p>
                  </div>

                  <Link href="/threads/new">
                    <Button
                      size="icon"
                      className="h-9 w-9 rounded-full bg-linear-to-br from-pink-500 to-violet-500 text-white shadow-lg shadow-purple-500/20 hover:opacity-90"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>

              <CardContent className="space-y-1 p-3">
                {/* All categories */}
                <button
                  type="button"
                  onClick={() => handleCategoryChange('all')}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all ${
                    activeCategory === 'all'
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                  }`}
                >
                  <Hash className="h-4 w-4" />

                  <span className="flex-1">All Categories</span>

                  {activeCategory === 'all' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </button>

                {categories.map(category => {
                  const isActive = activeCategory === category.slug

                  return (
                    <button
                      key={category.slug}
                      type="button"
                      onClick={() => handleCategoryChange(category.slug)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-primary/10 text-primary shadow-sm'
                          : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                      }`}
                    >
                      <Hash className="h-4 w-4" />

                      <span className="flex-1">{category.name}</span>

                      {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          </aside>

          {/* Main content */}
          <main className="min-w-0 space-y-5">
            {/* Search card */}
            <Card className="border-border/60 bg-card/90 shadow-xl shadow-black/10 backdrop-blur">
              <CardContent className="p-5">
                <form
                  onSubmit={handleSearch}
                  className="flex flex-col gap-4 sm:flex-row sm:items-center"
                >
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                        placeholder="Search threads..."
                        className="h-11 border-border/70 bg-background/70 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-11 bg-linear-to-r from-pink-500 to-violet-500 px-6 text-white shadow-lg shadow-purple-500/20 hover:opacity-90"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </form>

                {/* Active filters */}
                {(activeCategory !== 'all' || queryFromUrl) && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
                    <span className="text-xs text-muted-foreground">Active filters:</span>

                    {activeCategory !== 'all' && (
                      <Badge
                        variant="secondary"
                        className="border border-primary/20 bg-primary/10 text-primary"
                      >
                        {categories.find(category => category.slug === activeCategory)?.name ??
                          activeCategory}
                      </Badge>
                    )}

                    {queryFromUrl && (
                      <Badge
                        variant="secondary"
                        className="border border-primary/20 bg-primary/10 text-primary"
                      >
                        Search: "{queryFromUrl}"
                      </Badge>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSearch('')
                        applyFilters('all', '')
                      }}
                      className="ml-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Thread heading */}
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Latest Threads
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {threads.length === 0
                    ? 'No discussions yet'
                    : `${threads.length} ${threads.length === 1 ? 'discussion' : 'discussions'}`}
                </p>
              </div>

              <Link href="/threads/new">
                <Button variant="outline" className="hidden border-border/70 bg-card/70 sm:flex">
                  <Plus className="mr-2 h-4 w-4" />
                  New Thread
                </Button>
              </Link>
            </div>

            {/* Error */}
            {gettingError && !isLoading && (
              <Card className="border-red-500/20 bg-red-500/5">
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-red-400">
                    Something went wrong while loading threads.
                  </p>

                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => applyFilters(activeCategory, search)}
                  >
                    Try again
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center rounded-xl border border-border/60 bg-card/80 py-16 backdrop-blur">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Loading threads...
                </div>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !gettingError && threads.length === 0 && (
              <Card className="border-dashed border-border/70 bg-card/70">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>

                  <h3 className="font-semibold text-foreground">No threads found</h3>

                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Try changing your search or category, or start the first conversation.
                  </p>

                  <Link href="/threads/new">
                    <Button className="mt-5 bg-linear-to-r from-pink-500 to-violet-500 text-white hover:opacity-90">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Thread
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Threads */}
            {!isLoading &&
              !gettingError &&
              threads.map(thread => (
                <Link key={thread.id} href={`/threads/${thread.id}`} className="block">
                  <Card className="group overflow-hidden border-border/60 bg-card/90 shadow-lg shadow-black/5 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className="border-primary/20 bg-primary/10 text-xs text-primary"
                            >
                              {thread.category.name}
                            </Badge>

                            {thread.author?.handle && (
                              <span className="text-xs text-muted-foreground">
                                @{thread.author.handle}
                              </span>
                            )}

                            <span className="text-xs text-muted-foreground/70">•</span>

                            <span className="text-xs text-muted-foreground">
                              {new Date(thread.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <CardTitle className="line-clamp-2 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary md:text-xl">
                            {thread.title}
                          </CardTitle>
                        </div>

                        <MessageSquare className="hidden h-5 w-5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary sm:block" />
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {thread.excerpt}
                      </p>

                      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4">
                        <span className="text-xs text-muted-foreground">
                          {thread.author?.displayName
                            ? `By ${thread.author.displayName}`
                            : 'Anonymous'}
                        </span>

                        <span className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          View discussion →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </main>
        </div>
      </div>
    </div>
  )
}
