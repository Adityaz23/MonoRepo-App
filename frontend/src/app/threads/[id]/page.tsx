'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { apiGet, createBrowserApiClient } from '@/lib/api-client'
import { Comment, MeResponse, ThreadDetail } from '@/types/thread'
import { useAuth } from '@clerk/nextjs'
import { ArrowLeft, MessageCircle, ThumbsUp, Trash2Icon } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
export default function ThreadsDetailPage() {
  // Taking the params from the backend threadId
  const params = useParams<{ id: string }>()
  const id = Number(params.id)

  const router = useRouter()
  const { getToken, userId } = useAuth()

  // States
  const [thread, setThread] = useState<ThreadDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [myHandle, setMyHandle] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComments, setNewComments] = useState<string>('')
  const [isPostingComment, setIsPostingComment] = useState(false)
  const [commentBeingDeletedId, setCommentBeingDeletedId] = useState<number | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isTogglingLike, setIsTogglingLike] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null)

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken])

  useEffect(() => {
    let isMounted = true

    async function load() {
      setIsLoading(true)

      try {
        const [extractThreadDetails, extractCommentList] = await Promise.all([
          apiGet<ThreadDetail>(apiClient, `/api/threads/threads/${id}`),
          apiGet<Comment[]>(apiClient, `/api/threads/threads/${id}/replies`),
        ])

        if (!isMounted) return

        setThread(extractThreadDetails)
        setLikeCount(extractThreadDetails?.likeCount ?? 0)
        setIsLiked(extractThreadDetails?.viewerHasLikedThisPostOrNot ?? false)
        setComments(extractCommentList)

        if (userId) {
          try {
            const me = await apiGet<MeResponse>(apiClient, '/api/me')

            if (!isMounted) return

            setMyHandle(me?.handle ?? null)
          } catch (error) {
            if (!isMounted) return

            setMyHandle(null)
          }
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    if (Number.isFinite(id) && id > 0) {
      load()
    } else {
      setIsLoading(false)
    }

    return () => {
      isMounted = false
    }
  }, [apiClient, userId, id])

  // Methods for the like,delete and handle comments reply ->
  async function handleAddComment() {
    const trimmedComment = newComments.trim()
    if (trimmedComment.length < 2) return
    if (!userId) {
      toast.error('Sign in is needed', { description: 'Please sign in to add a comment.' })
      return
    }
    try {
      setIsPostingComment(true)
      const res = await apiClient.post(`/api/threads/threads/${id}/replies`, {
        body: trimmedComment,
      })
      const created: Comment = res.data.data
      console.log(created)
      setComments(prev => [...prev, created])
      setNewComments('')
      toast.success('Comment Added', { description: 'Your reply has been posted.' })
    } catch (error) {
      console.error(`Error :${error}`)
    } finally {
      setIsPostingComment(false)
    }
  }
  async function handleToggleLike() {
    if (!thread) return
    if (!userId) {
      toast.error('Sign in is needed', { description: 'Please sign in to like a comment.' })
      return
    }
    try {
      setIsTogglingLike(true)
      if (isLiked) {
        await apiClient.delete(`/api/threads/threads/${id}/like`)
        setIsLiked(false)
        setLikeCount(prev => Math.max(0, prev - 1))
        toast.success('Like removed', { description: 'Your upvote has been removed' })
      } else {
        await apiClient.post(`/api/threads/threads/${id}/like`)
        setIsLiked(true)
        setLikeCount(prev => prev + 1)
        toast.success('Liked', { description: 'You have upvoted this comment.' })
      }
    } catch (error) {
      console.error(`Error :${error}`)
    } finally {
      setIsTogglingLike(false)
    }
  }
  async function handleDeleteComment(currentCommentIdToBeDeleted: number) {
    if (!userId) {
      toast.error('Sign in is needed', {
        description: 'Please sign in to delete a comment.',
      })

      return
    }

    try {
      setCommentBeingDeletedId(currentCommentIdToBeDeleted)

      await apiClient.delete(`/api/threads/replies/${currentCommentIdToBeDeleted}`)

      setComments(prev => prev.filter(cmt => cmt.id !== currentCommentIdToBeDeleted))

      toast.success('Comment deleted', {
        description: 'Your comment has been deleted.',
      })
    } catch (error) {
      console.error('Error:', error)

      toast.error('Failed to delete comment', {
        description: 'Something went wrong. Please try again.',
      })
    } finally {
      setCommentBeingDeletedId(null)
      setCommentToDelete(null)
    }
  }
  if (isLoading) {
    return (
      <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative flex min-h-[70vh] items-center justify-center px-4">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />

            <p className="text-sm text-muted-foreground">Loading thread...</p>
          </div>
        </div>
      </main>
    )
  }
  if (!thread) {
    return (
      <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative flex min-h-[70vh] items-center justify-center px-4">
          <Card className="w-full max-w-md border-border/60 bg-card/80 shadow-2xl backdrop-blur-xl">
            <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border/70 bg-secondary/70">
                <MessageCircle className="h-6 w-6 text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Thread not found</h2>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  This thread may have been removed or the link may be invalid.
                </p>
              </div>

              <Button
                variant="ghost"
                className="w-fit rounded-full border border-border/60 bg-card/50 px-4 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-all hover:bg-card hover:text-foreground"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to threads
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-105 w-105 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />

        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-6 md:py-10">
        {/* Back button */}
        <Button
          variant="ghost"
          className="w-fit rounded-full border border-border/60 bg-card/50 px-4 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-all hover:bg-card hover:text-foreground"
          onClick={() => router.push('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to threads
        </Button>

        {/* Main thread card */}
        <Card className="overflow-hidden border-border/60 bg-card/80 shadow-2xl shadow-black/10 backdrop-blur-xl">
          {/* Top accent */}
          <div className="h-px w-full bg-linear-to-r from-transparent via-primary/60 to-transparent" />

          <CardHeader className="space-y-5 p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              {/* Thread information */}
              <div className="min-w-0 flex-1 space-y-4">
                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge
                    variant="outline"
                    className="rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary"
                  >
                    {thread.category.name}
                  </Badge>

                  {thread.author.handle && (
                    <>
                      <span className="text-border">•</span>

                      <span className="font-medium text-muted-foreground">
                        @{thread.author.handle}
                      </span>
                    </>
                  )}

                  <span className="text-border">•</span>

                  <span className="text-muted-foreground">
                    {new Date(thread.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Title */}
                <h1 className="max-w-3xl text-2xl font-bold tracking-tight text-foreground md:text-3xl lg:text-4xl">
                  {thread.title}
                </h1>

                {/* Author */}
                {thread.author.displayName && (
                  <p className="text-sm text-muted-foreground">
                    Posted by{' '}
                    <span className="font-medium text-foreground">{thread.author.displayName}</span>
                  </p>
                )}
              </div>

              {/* Like action */}
              {userId && (
                <div className="shrink-0">
                  <Button
                    size="sm"
                    variant={isLiked ? 'default' : 'outline'}
                    onClick={handleToggleLike}
                    disabled={isTogglingLike}
                    className={
                      isLiked
                        ? 'rounded-full bg-primary px-4 text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90'
                        : 'rounded-full border-border/70 bg-background/50 px-4 hover:border-primary/40 hover:bg-primary/5'
                    }
                  >
                    <ThumbsUp className={`mr-2 h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />

                    {isTogglingLike
                      ? '...'
                      : likeCount > 0
                        ? `${likeCount} Like${likeCount === 1 ? '' : 's'}`
                        : 'Like'}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          {/* Thread body */}
          <CardContent className="px-6 pb-8 md:px-8">
            <div className="rounded-xl border border-border/50 bg-background/30 p-5 md:p-6">
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground md:text-[15px]">
                {thread.body}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <Card className="overflow-hidden border-border/60 bg-card/70 shadow-xl backdrop-blur-xl">
          <CardHeader className="border-b border-border/50 px-6 py-5 md:px-8">
            <CardTitle className="flex items-center gap-3 text-lg">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <MessageCircle className="h-5 w-5 text-primary" />
              </span>

              <span>
                Comments <span className="text-muted-foreground">({comments.length})</span>
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 p-6 md:p-8">
            {/* Empty comments */}
            {comments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-background/20 px-5 py-10 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/70">
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                </div>

                <p className="text-sm font-medium text-foreground">No comments yet</p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Be the first person to join the conversation.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map(comment => {
                  const isCommentAuthor =
                    !!comment.author.handle && !!myHandle && comment.author.handle === myHandle

                  const isDeleting = commentBeingDeletedId === comment.id

                  return (
                    <div
                      key={comment.id}
                      className="group rounded-xl border border-border/60 bg-background/30 p-5 transition-colors hover:border-border/90 hover:bg-background/50"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-col gap-1">
                          {comment.author.handle && (
                            <span className="truncate text-sm font-semibold text-foreground">
                              @{comment.author.handle}
                            </span>
                          )}

                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {isCommentAuthor && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={commentBeingDeletedId === comment.id}
                            onClick={() => setCommentToDelete(comment.id)}
                            className="h-8 rounded-full px-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {comment.body}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add reply */}
            <div className="border-t border-border/60 pt-6">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground">Add your reply</h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  Share your thoughts with the community.
                </p>
              </div>

              <div className="space-y-3">
                <Textarea
                  value={newComments}
                  onChange={event => setNewComments(event.target.value)}
                  rows={5}
                  placeholder="Write your reply..."
                  disabled={!userId || isPostingComment}
                  className="resize-none rounded-xl border-border/60 bg-background/50 p-4 text-sm placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:ring-primary/20"
                />

                <div className="flex items-center justify-between gap-3">
                  {!userId ? (
                    <p className="text-xs text-muted-foreground">Sign in to leave a reply.</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Be respectful and constructive.</p>
                  )}

                  <Button
                    disabled={isPostingComment || !newComments.trim() || !userId}
                    className="rounded-full bg-primary px-5 text-primary-foreground shadow-lg shadow-primary/10 transition-all hover:bg-primary/90 hover:shadow-primary/20"
                    onClick={handleAddComment}
                  >
                    {isPostingComment ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <AlertDialog
        open={commentToDelete !== null}
        onOpenChange={open => {
          if (!open) {
            setCommentToDelete(null)
          }
        }}
      >
        <AlertDialogContent className="border-border/60 bg-card/95 shadow-2xl backdrop-blur-xl sm:max-w-md">
          <AlertDialogHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <Trash2Icon className="h-5 w-5 text-destructive" />
            </div>

            <AlertDialogTitle className="text-lg font-semibold text-foreground">
              Delete this comment?
            </AlertDialogTitle>

            <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
              This action cannot be undone. Your comment will be permanently removed from this
              thread.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4 gap-2 sm:gap-2">
            <AlertDialogCancel
              className="rounded-full border-border/70 bg-background/50 hover:bg-background"
              disabled={commentBeingDeletedId !== null}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              className="rounded-full bg-destructive px-5 text-destructive-foreground hover:bg-destructive/90"
              disabled={commentBeingDeletedId !== null}
              onClick={() => {
                if (commentToDelete !== null) {
                  handleDeleteComment(commentToDelete)
                }
              }}
            >
              {commentBeingDeletedId !== null ? 'Deleting...' : 'Delete comment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
