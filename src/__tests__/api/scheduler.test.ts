import { NextRequest } from 'next/server'
import { processScheduledPosts } from '@/lib/scheduler'
import { POST } from '@/app/api/scheduler/route'

// Mock dependencies
jest.mock('@/lib/scheduler', () => ({
  processScheduledPosts: jest.fn(),
}))

const mockProcessScheduledPosts = processScheduledPosts as jest.MockedFunction<typeof processScheduledPosts>

describe('/api/scheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    it('should process scheduled posts successfully and return count', async () => {
      const mockPublishedCount = 3
      mockProcessScheduledPosts.mockResolvedValue(mockPublishedCount)

      const request = new NextRequest('http://localhost:3000/api/scheduler', {
        method: 'POST',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(mockProcessScheduledPosts).toHaveBeenCalledTimes(1)
      expect(response.status).toBe(200)
      expect(data).toEqual({
        message: `Processed ${mockPublishedCount} scheduled posts`,
        publishedCount: mockPublishedCount,
      })
    })

    it('should return 0 when no scheduled posts are processed', async () => {
      mockProcessScheduledPosts.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/scheduler', {
        method: 'POST',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(mockProcessScheduledPosts).toHaveBeenCalledTimes(1)
      expect(response.status).toBe(200)
      expect(data).toEqual({
        message: 'Processed 0 scheduled posts',
        publishedCount: 0,
      })
    })

    it('should handle single scheduled post processing', async () => {
      mockProcessScheduledPosts.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/scheduler', {
        method: 'POST',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        message: 'Processed 1 scheduled posts',
        publishedCount: 1,
      })
    })

    it('should handle large numbers of scheduled posts', async () => {
      const mockPublishedCount = 150
      mockProcessScheduledPosts.mockResolvedValue(mockPublishedCount)

      const request = new NextRequest('http://localhost:3000/api/scheduler', {
        method: 'POST',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        message: `Processed ${mockPublishedCount} scheduled posts`,
        publishedCount: mockPublishedCount,
      })
    })

    it('should handle scheduler errors gracefully', async () => {
      const mockError = new Error('Scheduler processing failed')
      mockProcessScheduledPosts.mockRejectedValue(mockError)

      const request = new NextRequest('http://localhost:3000/api/scheduler', {
        method: 'POST',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(mockProcessScheduledPosts).toHaveBeenCalledTimes(1)
      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Failed to process scheduled posts',
      })
    })

    it('should handle database connection errors', async () => {
      const mockError = new Error('Database connection failed')
      mockProcessScheduledPosts.mockRejectedValue(mockError)

      const request = new NextRequest('http://localhost:3000/api/scheduler', {
        method: 'POST',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Failed to process scheduled posts',
      })
    })

    it('should handle validation errors from scheduler', async () => {
      const mockError = new Error('Invalid scheduled post data')
      mockProcessScheduledPosts.mockRejectedValue(mockError)

      const request = new NextRequest('http://localhost:3000/api/scheduler', {
        method: 'POST',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Failed to process scheduled posts',
      })
    })

    it('should handle timeout errors gracefully', async () => {
      const mockError = new Error('Scheduler timeout')
      mockProcessScheduledPosts.mockRejectedValue(mockError)

      const request = new NextRequest('http://localhost:3000/api/scheduler', {
        method: 'POST',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Failed to process scheduled posts',
      })
    })
  })
})
