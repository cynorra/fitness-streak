'use client'

import { useState } from 'react'
import { toggleLike, addComment, toggleRepost } from './actions'

interface Comment {
  id: string
  content: string
  created_at: string
  profiles: { display_name: string } | null
}

interface Props {
  postId: string
  initialLikes: number
  initialReposts: number
  isLiked: boolean
  isReposted: boolean
  comments: Comment[]
}

export default function PostInteractions({ postId, initialLikes, initialReposts, isLiked, isReposted, comments }: Props) {
  const [likes, setLikes] = useState(initialLikes)
  const [reposts, setReposts] = useState(initialReposts)
  const [liked, setLiked] = useState(isLiked)
  const [reposted, setReposted] = useState(isReposted)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')

  const handleLike = async () => {
    setLiked(!liked)
    setLikes(liked ? likes - 1 : likes + 1)
    await toggleLike(postId)
  }

  const handleRepost = async () => {
    setReposted(!reposted)
    setReposts(reposted ? reposts - 1 : reposts + 1)
    await toggleRepost(postId)
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    const text = commentText
    setCommentText('')
    await addComment(postId, text)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-8 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <button 
          onClick={handleLike}
          className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${liked ? 'text-rose-500 scale-110' : 'text-zinc-400 hover:text-rose-500'}`}
        >
          <span>{liked ? '❤️' : '🤍'}</span>
          <span>{likes} Kudos</span>
        </button>

        <button 
          onClick={handleRepost}
          className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${reposted ? 'text-orange-500 scale-110' : 'text-zinc-400 hover:text-orange-500'}`}
        >
          <span>{reposted ? '🔄' : '🔃'}</span>
          <span>{reposts} Repost</span>
        </button>

        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-orange-500 transition-colors"
        >
          <span>💬</span>
          <span>{comments.length} Yorum</span>
        </button>
      </div>

      {showComments && (
        <div className="space-y-6 bg-zinc-50 dark:bg-zinc-800/30 p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 animate-fade-in">
          <form onSubmit={handleComment} className="flex gap-4">
            <input 
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Fikrini paylaş..."
              className="flex-1 bg-white dark:bg-zinc-900 border-none rounded-xl px-5 py-3 text-xs font-bold text-zinc-900 dark:text-zinc-50 shadow-inner outline-none ring-1 ring-zinc-200 dark:ring-zinc-800 focus:ring-2 focus:ring-orange-500 transition-all"
            />
            <button className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
              Gönder
            </button>
          </form>

          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">
                  {comment.profiles?.display_name?.[0] || 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-50">{comment.profiles?.display_name}</span>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{new Date(comment.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
