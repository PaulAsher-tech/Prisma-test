import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { postSchema } from '@/lib/validations'
import { generateSlug } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = postSchema.parse(body)

    const existingPost = await prisma.post.findUnique({
      where: { id: params.id }
    })

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const slug = generateSlug(validatedData.title)
    
    // Check if slug already exists for a different post
    const slugExists = await prisma.post.findFirst({
      where: { 
        slug,
        NOT: { id: params.id }
      }
    })

    if (slugExists) {
      return NextResponse.json({ error: 'A post with this title already exists' }, { status: 400 })
    }

    const post = await prisma.post.update({
      where: { id: params.id },
      data: {
        title: validatedData.title,
        content: validatedData.content,
        excerpt: validatedData.excerpt,
        slug,
        published: validatedData.published,
        publishedAt: validatedData.published && !existingPost.published ? new Date() : existingPost.publishedAt,
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null
      }
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error updating post:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.post.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}