'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils'

interface Post {
  id: string
  title: string
  content: string
  excerpt?: string
  slug: string
  published: boolean
  publishedAt?: string
  createdAt: string
}

interface Subscriber {
  email: string
  name?: string
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [subscriberData, setSubscriberData] = useState<Subscriber>({ email: '', name: '' })
  const [subscribing, setSubscribing] = useState(false)
  const [subscribeMessage, setSubscribeMessage] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts?published=true&limit=5')
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubscribing(true)
    setSubscribeMessage('')

    try {
      const response = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriberData)
      })

      if (response.ok) {
        setSubscribeMessage('Successfully subscribed to the newsletter!')
        setSubscriberData({ email: '', name: '' })
      } else {
        const error = await response.json()
        setSubscribeMessage(error.error || 'Failed to subscribe')
      }
    } catch (_error) {
      setSubscribeMessage('Failed to subscribe')
    } finally {
      setSubscribing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to My Newsletter
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Stay updated with the latest posts and insights
        </p>

        {/* Newsletter Subscription */}
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
          <h2 className="text-2xl font-semibold mb-4 text-black">Subscribe to Newsletter</h2>
          <form onSubmit={handleSubscribe} className="space-y-4">
            <input
              type="email"
              placeholder="Your email address"
              value={subscriberData.email}
              onChange={(e) => setSubscriberData({ ...subscriberData, email: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
            <input
              type="text"
              placeholder="Your name (optional)"
              value={subscriberData.name}
              onChange={(e) => setSubscriberData({ ...subscriberData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
            <button
              type="submit"
              disabled={subscribing}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {subscribing ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
          {subscribeMessage && (
            <p className={`mt-4 text-sm ${subscribeMessage.includes('Successfully') ? 'text-green-600' : 'text-red-600'}`}>
              {subscribeMessage}
            </p>
          )}
        </div>
      </div>

      {/* Recent Posts */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Recent Posts</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No posts published yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <article key={post.id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  <a href={`/posts/${post.slug}`} className="hover:text-blue-600">
                    {post.title}
                  </a>
                </h3>
                <p className="text-gray-600 mb-4">
                  {post.publishedAt && formatDate(new Date(post.publishedAt))}
                </p>
                <p className="text-gray-700 mb-4">
                  {post.excerpt || post.content.substring(0, 200) + '...'}
                </p>
                <a
                  href={`/posts/${post.slug}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Read more →
                </a>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
