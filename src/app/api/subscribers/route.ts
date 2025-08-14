import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { subscriberSchema } from '@/lib/validations'

export async function GET() {
  try {
    const subscribers = await prisma.subscriber.findMany({
      where: { subscribed: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(subscribers)
  } catch (error) {
    console.error('Error fetching subscribers:', error)
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = subscriberSchema.parse(body)

    // Check if email already exists
    const existingSubscriber = await prisma.subscriber.findUnique({
      where: { email: validatedData.email }
    })

    if (existingSubscriber) {
      if (existingSubscriber.subscribed) {
        return NextResponse.json({ error: 'Email is already subscribed' }, { status: 400 })
      } else {
        // Reactivate subscription
        const subscriber = await prisma.subscriber.update({
          where: { email: validatedData.email },
          data: { 
            subscribed: true,
            name: validatedData.name || existingSubscriber.name
          }
        })
        return NextResponse.json(subscriber, { status: 200 })
      }
    }

    const subscriber = await prisma.subscriber.create({
      data: {
        email: validatedData.email,
        name: validatedData.name
      }
    })

    return NextResponse.json(subscriber, { status: 201 })
  } catch (error) {
    console.error('Error creating subscriber:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}