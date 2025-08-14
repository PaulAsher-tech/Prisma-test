import { NextResponse } from 'next/server'
import { processScheduledPosts } from '@/lib/scheduler'

export async function POST() {
  try {
    const publishedCount = await processScheduledPosts()
    
    return NextResponse.json({ 
      message: `Processed ${publishedCount} scheduled posts`,
      publishedCount 
    })
  } catch (error) {
    console.error('Error in scheduler endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to process scheduled posts' },
      { status: 500 }
    )
  }
}