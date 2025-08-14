import { z } from 'zod'

export const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  published: z.boolean().default(false),
  scheduledAt: z.string().optional().refine((val) => {
    if (!val || val === '') return true
    const date = new Date(val)
    return !isNaN(date.getTime()) && date > new Date()
  }, 'Scheduled date must be in the future')
})

export const subscriberSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().optional()
})

export type PostFormData = z.infer<typeof postSchema>
export type SubscriberFormData = z.infer<typeof subscriberSchema>