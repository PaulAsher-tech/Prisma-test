import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { postSchema } from '@/lib/validations'
import { generateSlug } from '@/lib/utils'
import { sendEmail, generateNewsletterEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const published = searchParams.get('published')
    const limit = searchParams.get('limit')

    const posts = await prisma.post.findMany({
      where: published === 'true' ? { published: true } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit) : undefined
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = postSchema.parse(body)

    const slug = generateSlug(validatedData.title)
    
    // Check if slug already exists
    const existingPost = await prisma.post.findUnique({
      where: { slug }
    })

    if (existingPost) {
      return NextResponse.json({ error: 'A post with this title already exists' }, { status: 400 })
    }

    const post = await prisma.post.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        excerpt: validatedData.excerpt,
        slug,
        published: validatedData.published,
        publishedAt: validatedData.published ? new Date() : null,
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null
      }
    })

    // Send email to subscribers if post is published
    if (validatedData.published) {
      try {
        const subscribers = await prisma.subscriber.findMany({
          where: { subscribed: true }
        })

        if (subscribers.length > 0) {
          const postUrl = `${process.env.NEXT_PUBLIC_APP_URL}/posts/${post.slug}`
          const emailHtml = generateNewsletterEmail(post.title, post.content, postUrl)

          await sendEmail({
            to: subscribers.map(sub => sub.email),
            subject: `New Post: ${post.title}`,
            html: emailHtml
          })
        }
      } catch (emailError) {
        console.error('Failed to send newsletter emails:', emailError)
        // Don't fail the post creation if email fails
      }
    }

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}