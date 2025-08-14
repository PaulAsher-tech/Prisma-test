import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/utils'

interface PostPageProps {
  params: {
    slug: string
  }
}

async function getPost(slug: string) {
  const post = await prisma.post.findUnique({
    where: { 
      slug,
      published: true
    }
  })

  if (!post) {
    return null
  }

  return post
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <article className="bg-white rounded-lg shadow-md p-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>
          <div className="flex items-center text-gray-600 mb-4">
            <time dateTime={post.publishedAt?.toISOString()}>
              {post.publishedAt && formatDate(post.publishedAt)}
            </time>
          </div>
          {post.excerpt && (
            <p className="text-xl text-gray-700 italic">
              {post.excerpt}
            </p>
          )}
        </header>

        <div className="prose prose-lg max-w-none text-gray-800">
          <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }} />
        </div>
      </article>

      <div className="mt-8 text-center">
        <a
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Home
        </a>
      </div>
    </div>
  )
}

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { slug: true }
  })

  return posts.map((post) => ({
    slug: post.slug
  }))
}