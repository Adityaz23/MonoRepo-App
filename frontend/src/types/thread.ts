export type Category = {
  id: number
  slug: string
  name: string
  description: string | null
  sortOrder: number
}

export type ThreadDetail = {
  id: number
  title: string
  body: string
  createdAt: string
  updatedAt: string
  category: {
    slug: string
    name: string
  }
  author: {
    displayName: string | null
    handle: string | null
  }
}
