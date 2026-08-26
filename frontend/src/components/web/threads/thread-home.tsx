'use client'

import Link from 'next/link'

export default function ThreadPage() {
  return (
    <div>
      <Link href={'/threads/new'}>Add New Thread</Link>
    </div>
  )
}
