import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { GET, POST } from '@/app/api/subscribers/route'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    subscriber: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/lib/validations', () => ({
  subscriberSchema: {
    parse: jest.fn(),
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/subscribers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should fetch all subscribed subscribers successfully', async () => {
      const mockSubscribers = [
        {
          id: '1',
          email: 'test1@example.com',
          name: 'Test User 1',
          subscribed: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          email: 'test2@example.com',
          name: 'Test User 2',
          subscribed: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockPrisma.subscriber.findMany.mockResolvedValue(mockSubscribers)

      const response = await GET()
      const data = await response.json()

      expect(mockPrisma.subscriber.findMany).toHaveBeenCalledWith({
        where: { subscribed: true },
        orderBy: { createdAt: 'desc' },
      })
      expect(response.status).toBe(200)
      expect(data).toMatchObject([
        {
          id: mockSubscribers[0].id,
          email: mockSubscribers[0].email,
          name: mockSubscribers[0].name,
          subscribed: mockSubscribers[0].subscribed,
        },
        {
          id: mockSubscribers[1].id,
          email: mockSubscribers[1].email,
          name: mockSubscribers[1].name,
          subscribed: mockSubscribers[1].subscribed,
        },
      ])
      expect(data[0].createdAt).toBeDefined()
      expect(data[0].updatedAt).toBeDefined()
      expect(data[1].createdAt).toBeDefined()
      expect(data[1].updatedAt).toBeDefined()
    })

    it('should return empty array when no subscribed subscribers exist', async () => {
      mockPrisma.subscriber.findMany.mockResolvedValue([])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.subscriber.findMany.mockRejectedValue(new Error('Database error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch subscribers' })
    })
  })

  describe('POST', () => {
    const mockSubscriberData = {
      email: 'test@example.com',
      name: 'Test User',
    }

    const mockCreatedSubscriber = {
      id: '1',
      ...mockSubscriberData,
      subscribed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should create a new subscriber successfully', async () => {
      const { subscriberSchema } = require('@/lib/validations')
      subscriberSchema.parse.mockReturnValue(mockSubscriberData)

      mockPrisma.subscriber.findUnique.mockResolvedValue(null)
      mockPrisma.subscriber.create.mockResolvedValue(mockCreatedSubscriber)

      const request = new NextRequest('http://localhost:3000/api/subscribers', {
        method: 'POST',
        body: JSON.stringify(mockSubscriberData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(subscriberSchema.parse).toHaveBeenCalledWith(mockSubscriberData)
      expect(mockPrisma.subscriber.findUnique).toHaveBeenCalledWith({
        where: { email: mockSubscriberData.email },
      })
      expect(mockPrisma.subscriber.create).toHaveBeenCalledWith({
        data: {
          email: mockSubscriberData.email,
          name: mockSubscriberData.name,
        },
      })
      expect(response.status).toBe(201)
      expect(data).toMatchObject({
        id: mockCreatedSubscriber.id,
        email: mockCreatedSubscriber.email,
        name: mockCreatedSubscriber.name,
        subscribed: mockCreatedSubscriber.subscribed,
      })
      expect(data.createdAt).toBeDefined()
      expect(data.updatedAt).toBeDefined()
    })

    it('should create subscriber without name when name is not provided', async () => {
      const subscriberDataWithoutName = { email: 'test@example.com' }
      const { subscriberSchema } = require('@/lib/validations')
      subscriberSchema.parse.mockReturnValue(subscriberDataWithoutName)

      const createdSubscriberWithoutName = {
        id: '1',
        ...subscriberDataWithoutName,
        name: null,
        subscribed: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.subscriber.findUnique.mockResolvedValue(null)
      mockPrisma.subscriber.create.mockResolvedValue(createdSubscriberWithoutName)

      const request = new NextRequest('http://localhost:3000/api/subscribers', {
        method: 'POST',
        body: JSON.stringify(subscriberDataWithoutName),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(mockPrisma.subscriber.create).toHaveBeenCalledWith({
        data: {
          email: subscriberDataWithoutName.email,
          name: undefined,
        },
      })
      expect(response.status).toBe(201)
      expect(data).toMatchObject({
        id: createdSubscriberWithoutName.id,
        email: createdSubscriberWithoutName.email,
        name: createdSubscriberWithoutName.name,
        subscribed: createdSubscriberWithoutName.subscribed,
      })
      expect(data.createdAt).toBeDefined()
      expect(data.updatedAt).toBeDefined()
    })

    it('should return error when email is already subscribed', async () => {
      const { subscriberSchema } = require('@/lib/validations')
      subscriberSchema.parse.mockReturnValue(mockSubscriberData)

      const existingSubscriber = {
        id: '1',
        email: mockSubscriberData.email,
        name: 'Existing User',
        subscribed: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.subscriber.findUnique.mockResolvedValue(existingSubscriber)

      const request = new NextRequest('http://localhost:3000/api/subscribers', {
        method: 'POST',
        body: JSON.stringify(mockSubscriberData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Email is already subscribed' })
    })

    it('should reactivate subscription when email exists but is unsubscribed', async () => {
      const { subscriberSchema } = require('@/lib/validations')
      subscriberSchema.parse.mockReturnValue(mockSubscriberData)

      const unsubscribedSubscriber = {
        id: '1',
        email: mockSubscriberData.email,
        name: 'Unsubscribed User',
        subscribed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const reactivatedSubscriber = {
        ...unsubscribedSubscriber,
        subscribed: true,
        name: mockSubscriberData.name,
        updatedAt: new Date(),
      }

      mockPrisma.subscriber.findUnique.mockResolvedValue(unsubscribedSubscriber)
      mockPrisma.subscriber.update.mockResolvedValue(reactivatedSubscriber)

      const request = new NextRequest('http://localhost:3000/api/subscribers', {
        method: 'POST',
        body: JSON.stringify(mockSubscriberData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(mockPrisma.subscriber.update).toHaveBeenCalledWith({
        where: { email: mockSubscriberData.email },
        data: {
          subscribed: true,
          name: mockSubscriberData.name,
        },
      })
      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        id: reactivatedSubscriber.id,
        email: reactivatedSubscriber.email,
        name: reactivatedSubscriber.name,
        subscribed: reactivatedSubscriber.subscribed,
      })
      expect(data.createdAt).toBeDefined()
      expect(data.updatedAt).toBeDefined()
    })

    it('should preserve existing name when reactivating if no new name provided', async () => {
      const subscriberDataWithoutName = { email: 'test@example.com' }
      const { subscriberSchema } = require('@/lib/validations')
      subscriberSchema.parse.mockReturnValue(subscriberDataWithoutName)

      const unsubscribedSubscriber = {
        id: '1',
        email: subscriberDataWithoutName.email,
        name: 'Existing Name',
        subscribed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const reactivatedSubscriber = {
        ...unsubscribedSubscriber,
        subscribed: true,
        updatedAt: new Date(),
      }

      mockPrisma.subscriber.findUnique.mockResolvedValue(unsubscribedSubscriber)
      mockPrisma.subscriber.update.mockResolvedValue(reactivatedSubscriber)

      const request = new NextRequest('http://localhost:3000/api/subscribers', {
        method: 'POST',
        body: JSON.stringify(subscriberDataWithoutName),
      })
      const response = await POST(request)

      expect(mockPrisma.subscriber.update).toHaveBeenCalledWith({
        where: { email: subscriberDataWithoutName.email },
        data: {
          subscribed: true,
          name: 'Existing Name',
        },
      })
      expect(response.status).toBe(200)
    })

    it('should handle validation errors', async () => {
      const { subscriberSchema } = require('@/lib/validations')
      const validationError = new Error('Validation failed')
      validationError.name = 'ZodError'
      subscriberSchema.parse.mockImplementation(() => {
        throw validationError
      })

      const request = new NextRequest('http://localhost:3000/api/subscribers', {
        method: 'POST',
        body: JSON.stringify({ invalid: 'data' }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Invalid data provided' })
    })

    it('should handle general errors', async () => {
      const { subscriberSchema } = require('@/lib/validations')
      subscriberSchema.parse.mockReturnValue(mockSubscriberData)

      mockPrisma.subscriber.findUnique.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/subscribers', {
        method: 'POST',
        body: JSON.stringify(mockSubscriberData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to subscribe' })
    })
  })
})
