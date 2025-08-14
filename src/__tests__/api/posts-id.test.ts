import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { GET, PUT, DELETE } from '@/app/api/posts/[id]/route'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    post: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
  },
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

describe('/api/posts/[id]', () => {
  const mockPostId = 'test-post-id'
  const mockParams = { id: mockPostId }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should fetch a post by ID successfully', async () => {
      const mockPost = {
        id: mockPostId,
        title: 'Test Post',
        content: 'Test content',
        excerpt: 'Test excerpt',
        slug: 'test-post',
        published: true,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.post.findUnique.mockResolvedValue(mockPost)

      const request = new NextRequest('http://localhost:3000/api/posts/test-post-id')
      const response = await GET(request, { params: mockParams })
      const data = await response.json()

      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: mockPostId },
      })
      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        id: mockPost.id,
        title: mockPost.title,
        content: mockPost.content,
        excerpt: mockPost.excerpt,
        slug: mockPost.slug,
        published: mockPost.published,
      })
      expect(data.createdAt).toBeDefined()
      expect(data.publishedAt).toBeDefined()
      expect(data.updatedAt).toBeDefined()
    })

    it('should return 404 when post is not found', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/posts/non-existent-id')
      const response = await GET(request, { params: { id: 'non-existent-id' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Post not found' })
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.post.findUnique.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/posts/test-post-id')
      const response = await GET(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch post' })
    })
  })

  describe('PUT', () => {
    const mockUpdateData = {
      title: 'Updated Post',
      content: 'Updated content',
      excerpt: 'Updated excerpt',
      published: true,
      scheduledAt: null,
    }

    const mockExistingPost = {
      id: mockPostId,
      title: 'Original Post',
      content: 'Original content',
      excerpt: 'Original excerpt',
      slug: 'original-post',
      published: false,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockUpdatedPost = {
      ...mockExistingPost,
      ...mockUpdateData,
      slug: 'test-slug',
      publishedAt: new Date(),
      updatedAt: new Date(),
    }

    it('should update a post successfully', async () => {
      const { postSchema } = require('@/lib/validations')
      postSchema.parse.mockReturnValue(mockUpdateData)

      mockPrisma.post.findUnique.mockResolvedValue(mockExistingPost)
      mockPrisma.post.findFirst.mockResolvedValue(null)
      mockPrisma.post.update.mockResolvedValue(mockUpdatedPost)

      const request = new NextRequest('http://localhost:3000/api/posts/test-post-id', {
        method: 'PUT',
        body: JSON.stringify(mockUpdateData),
      })
      const response = await PUT(request, { params: mockParams })
      const data = await response.json()

      expect(postSchema.parse).toHaveBeenCalledWith(mockUpdateData)
      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: mockPostId },
      })
      expect(mockPrisma.post.findFirst).toHaveBeenCalledWith({
        where: {
          slug: 'test-slug',
          NOT: { id: mockPostId },
        },
      })
      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: mockPostId },
        data: {
          ...mockUpdateData,
          slug: 'test-slug',
          publishedAt: expect.any(Date),
          scheduledAt: null,
        },
      })
      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        id: mockUpdatedPost.id,
        title: mockUpdatedPost.title,
        content: mockUpdatedPost.content,
        excerpt: mockUpdatedPost.excerpt,
        slug: mockUpdatedPost.slug,
        published: mockUpdatedPost.published,
        scheduledAt: mockUpdatedPost.scheduledAt,
      })
      expect(data.createdAt).toBeDefined()
      expect(data.publishedAt).toBeDefined()
      expect(data.updatedAt).toBeDefined()
    })

    it('should return 404 when updating non-existent post', async () => {
      const { postSchema } = require('@/lib/validations')
      postSchema.parse.mockReturnValue(mockUpdateData)

      mockPrisma.post.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/posts/non-existent-id', {
        method: 'PUT',
        body: JSON.stringify(mockUpdateData),
      })
      const response = await PUT(request, { params: { id: 'non-existent-id' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Post not found' })
    })

    it('should return error when slug already exists for different post', async () => {
      const { postSchema } = require('@/lib/validations')
      postSchema.parse.mockReturnValue(mockUpdateData)

      mockPrisma.post.findUnique.mockResolvedValue(mockExistingPost)
      mockPrisma.post.findFirst.mockResolvedValue({ id: 'different-post-id', title: 'Different Post' })

      const request = new NextRequest('http://localhost:3000/api/posts/test-post-id', {
        method: 'PUT',
        body: JSON.stringify(mockUpdateData),
      })
      const response = await PUT(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'A post with this title already exists' })
    })

    it('should not update publishedAt if post was already published', async () => {
      const { postSchema } = require('@/lib/validations')
      const alreadyPublishedData = { ...mockUpdateData, published: true }
      postSchema.parse.mockReturnValue(alreadyPublishedData)

      const alreadyPublishedPost = { ...mockExistingPost, published: true, publishedAt: new Date('2023-01-01') }

      mockPrisma.post.findUnique.mockResolvedValue(alreadyPublishedPost)
      mockPrisma.post.findFirst.mockResolvedValue(null)
      mockPrisma.post.update.mockResolvedValue(mockUpdatedPost)

      const request = new NextRequest('http://localhost:3000/api/posts/test-post-id', {
        method: 'PUT',
        body: JSON.stringify(alreadyPublishedData),
      })
      const response = await PUT(request, { params: mockParams })

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: mockPostId },
        data: {
          ...alreadyPublishedData,
          slug: 'test-slug',
          publishedAt: alreadyPublishedPost.publishedAt,
          scheduledAt: null,
        },
      })
      expect(response.status).toBe(200)
    })

    it('should handle validation errors', async () => {
      const { postSchema } = require('@/lib/validations')
      const validationError = new Error('Validation failed')
      validationError.name = 'ZodError'
      postSchema.parse.mockImplementation(() => {
        throw validationError
      })

      const request = new NextRequest('http://localhost:3000/api/posts/test-post-id', {
        method: 'PUT',
        body: JSON.stringify({ invalid: 'data' }),
      })
      const response = await PUT(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Invalid data provided' })
    })

    it('should handle general errors', async () => {
      const { postSchema } = require('@/lib/validations')
      postSchema.parse.mockReturnValue(mockUpdateData)

      mockPrisma.post.findUnique.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/posts/test-post-id', {
        method: 'PUT',
        body: JSON.stringify(mockUpdateData),
      })
      const response = await PUT(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to update post' })
    })
  })

  describe('DELETE', () => {
    it('should delete a post successfully', async () => {
      mockPrisma.post.delete.mockResolvedValue({ id: mockPostId, title: 'Deleted Post' })

      const request = new NextRequest('http://localhost:3000/api/posts/test-post-id', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: mockParams })
      const data = await response.json()

      expect(mockPrisma.post.delete).toHaveBeenCalledWith({
        where: { id: mockPostId },
      })
      expect(response.status).toBe(200)
      expect(data).toEqual({ message: 'Post deleted successfully' })
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.post.delete.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/posts/test-post-id', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to delete post' })
    })
  })
})
