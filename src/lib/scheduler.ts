import { prisma } from './db'
import { sendEmail, generateNewsletterEmail } from './email'

export async function processScheduledPosts() {
  try {
    const now = new Date()
    
    // Find posts that are scheduled to be published and haven't been published yet
    const scheduledPosts = await prisma.post.findMany({
      where: {
        published: false,
        scheduledAt: {
          lte: now
        }
      }
    })

    for (const post of scheduledPosts) {
      // Update post to published
      await prisma.post.update({
        where: { id: post.id },
        data: {
          published: true,
          publishedAt: now,
          scheduledAt: null
        }
      })

      // Send email to subscribers
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
        console.error(`Failed to send newsletter emails for post ${post.id}:`, emailError)
      }

      console.log(`Published scheduled post: ${post.title}`)
    }

    return scheduledPosts.length
  } catch (error) {
    console.error('Error processing scheduled posts:', error)
    throw error
  }
}