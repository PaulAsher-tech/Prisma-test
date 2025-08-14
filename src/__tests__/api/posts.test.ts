import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail, generateNewsletterEmail } from '@/lib/email'
import { GET, POST } from '@/app/api/posts/route'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    post: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    subscriber: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn(),
  generateNewsletterEmail: jest.fn(),
}))

jest.mock('@/lib/utils', () => ({
  generateSlug: jest.fn(() => 'test-slug'),
}))

jest.mock('@/lib/validations', () => ({
  postSchema: {
    parse: jest.fn(),
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>
const mockGenerateNewsletterEmail = generateNewsletterEmail as jest.MockedFunction<typeof generateNewsletterEmail>

describe('/api/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  })

  describe('GET', () => {
    it('should fetch all posts when no query parameters are provided', async () => {
      const mockPosts = [
        { id: '1', title: 'Test Post 1', content: 'Content 1', published: true },
        { id: '2', title: 'Test Post 2', content: 'Content 2', published: false },
      ]

      mockPrisma.post.findMany.mockResolvedValue(mockPosts)

      const request = new NextRequest('http://localhost:3000/api/posts')
      const response = await GET(request)
      const data = await response.json()

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { createdAt: 'desc' },
        take: undefined,
      })
      expect(response.status).toBe(200)
      expect(data).toEqual(mockPosts)
    })

    it('should fetch only published posts when published=true', async () => {
      const mockPosts = [
        { id: '1', title: 'Test Post 1', content: 'Content 1', published: true },
      ]

      mockPrisma.post.findMany.mockResolvedValue(mockPosts)

      const request = new NextRequest('http://localhost:3000/api/posts?published=true')
      const response = await GET(request)
      const data = await response.json()

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: undefined,
      })
      expect(response.status).toBe(200)
      expect(data).toEqual(mockPosts)
    })

    it('should limit results when limit parameter is provided', async () => {
      const mockPosts = [
        { id: '1', title: 'Test Post 1', content: 'Content 1', published: true },
      ]

      mockPrisma.post.findMany.mockResolvedValue(mockPosts)

      const request = new NextRequest('http://localhost:3000/api/posts?limit=5')
      const response = await GET(request)
      const data = await response.json()

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
      expect(response.status).toBe(200)
      expect(data).toEqual(mockPosts)
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.post.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/posts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch posts' })
    })
  })

  describe('POST', () => {
    const mockPostData = {
      title: 'Test Post',
      content: 'Test content',
      excerpt: 'Test excerpt',
      published: true,
      scheduledAt: null,
    }

    const mockCreatedPost = {
      id: '1',
      ...mockPostData,
      slug: 'test-slug',
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should create a new post successfully', async () => {
      const { postSchema } = require('@/lib/validations')
      postSchema.parse.mockReturnValue(mockPostData)

      mockPrisma.post.findUnique.mockResolvedValue(null)
      mockPrisma.post.create.mockResolvedValue(mockCreatedPost)
      mockPrisma.subscriber.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify(mockPostData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(postSchema.parse).toHaveBeenCalledWith(mockPostData)
      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({ where: { slug: 'test-slug' } })
      expect(mockPrisma.post.create).toHaveBeenCalledWith({
        data: {
          ...mockPostData,
          slug: 'test-slug',
          publishedAt: expect.any(Date),
          scheduledAt: null,
        },
      })
      expect(response.status).toBe(201)
      expect(data).toMatchObject({
        id: mockCreatedPost.id,
        title: mockCreatedPost.title,
        content: mockCreatedPost.content,
        excerpt: mockCreatedPost.excerpt,
        slug: mockCreatedPost.slug,
        published: mockCreatedPost.published,
        scheduledAt: mockCreatedPost.scheduledAt,
      })
      expect(data.createdAt).toBeDefined()
      expect(data.publishedAt).toBeDefined()
      expect(data.updatedAt).toBeDefined()
    })

    it('should return error when post with same title already exists', async () => {
      const { postSchema } = require('@/lib/validations')
      postSchema.parse.mockReturnValue(mockPostData)

      mockPrisma.post.findUnique.mockResolvedValue({ id: '2', title: 'Test Post' })

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify(mockPostData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'A post with this title already exists' })
    })

    it('should send newsletter emails when post is published and subscribers exist', async () => {
      const { postSchema } = require('@/lib/validations')
      postSchema.parse.mockReturnValue(mockPostData)

      const mockSubscribers = [
        { id: '1', email: 'test1@example.com', name: 'Test User 1' },
        { id: '2', email: 'test2@example.com', name: 'Test User 2' },
      ]

      mockPrisma.post.findUnique.mockResolvedValue(null)
      mockPrisma.post.create.mockResolvedValue(mockCreatedPost)
      mockPrisma.subscriber.findMany.mockResolvedValue(mockSubscribers)
      mockGenerateNewsletterEmail.mockReturnValue('<html>Newsletter content</html>')
      mockSendEmail.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify(mockPostData),
      })
      const response = await POST(request)

      expect(mockPrisma.subscriber.findMany).toHaveBeenCalledWith({
        where: { subscribed: true },
      })
      expect(mockGenerateNewsletterEmail).toHaveBeenCalledWith(
        mockPostData.title,
        mockPostData.content,
        `http://localhost:3000/posts/${mockCreatedPost.slug}`
      )
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: ['test1@example.com', 'test2@example.com'],
        subject: `New Post: ${mockPostData.title}`,
        html: '<html>Newsletter content</html>',
      })
      expect(response.status).toBe(201)
    })

    it('should not fail post creation if email sending fails', async () => {
      const { postSchema } = require('@/lib/validations')
      postSchema.parse.mockReturnValue(mockPostData)

      const mockSubscribers = [{ id: '1', email: 'test@example.com', name: 'Test User' }]

      mockPrisma.post.findUnique.mockResolvedValue(null)
      mockPrisma.post.create.mockResolvedValue(mockCreatedPost)
      mockPrisma.subscriber.findMany.mockResolvedValue(mockSubscribers)
      mockGenerateNewsletterEmail.mockReturnValue('<html>Newsletter content</html>')
      mockSendEmail.mockRejectedValue(new Error('Email service error'))

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify(mockPostData),
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(mockSendEmail).toHaveBeenCalled()
    })

    it('should handle validation errors', async () => {
      const { postSchema } = require('@/lib/validations')
      const validationError = new Error('Validation failed')
      validationError.name = 'ZodError'
      postSchema.parse.mockImplementation(() => {
        throw validationError
      })

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify({ invalid: 'data' }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Invalid data provided' })
    })

    it('should handle general errors', async () => {
      const { postSchema } = require('@/lib/validations')
      postSchema.parse.mockReturnValue(mockPostData)

      mockPrisma.post.findUnique.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify(mockPostData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to create post' })
    })
  })
})
