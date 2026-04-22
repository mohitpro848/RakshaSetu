import { useState, useEffect } from "react";
import { ArrowLeft, MessageCircle, Heart, Send, Plus, Filter, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ForumPost {
  id: string;
  user_id: string;
  author_name: string | null;
  title: string;
  content: string;
  category: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface ForumComment {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string | null;
  content: string;
  created_at: string;
}

interface CommunityForumProps {
  onBack: () => void;
}

const categories = [
  { id: "safety_tip", label: "Safety Tips", emoji: "💡" },
  { id: "experience", label: "Experiences", emoji: "📝" },
  { id: "question", label: "Questions", emoji: "❓" },
  { id: "alert", label: "Alerts", emoji: "🚨" },
  { id: "resource", label: "Resources", emoji: "📚" },
];

const CommunityForum = ({ onBack }: CommunityForumProps) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("safety_tip");
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchPosts(); }, [filterCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase.from("forum_posts").select("*").order("created_at", { ascending: false });
    if (filterCategory !== "all") query = query.eq("category", filterCategory);
    const { data } = await query;
    setPosts((data as ForumPost[]) || []);
    setLoading(false);
  };

  const fetchComments = async (postId: string) => {
    const { data } = await supabase.from("forum_comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
    setComments((data as ForumComment[]) || []);
  };

  const handleCreatePost = async () => {
    if (!user || !newTitle.trim() || !newContent.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("forum_posts").insert({
      user_id: user.id,
      author_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Anonymous",
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
    });
    setSubmitting(false);
    if (!error) {
      toast({ title: "Post created!", description: "Your post is now visible to the community." });
      setShowNewPost(false);
      setNewTitle("");
      setNewContent("");
      fetchPosts();
    }
  };

  const handleLike = async (post: ForumPost) => {
    await supabase.from("forum_posts").update({ likes_count: post.likes_count + 1 }).eq("id", post.id);
    fetchPosts();
  };

  const handleAddComment = async () => {
    if (!user || !selectedPost || !newComment.trim()) return;
    setSubmitting(true);
    await supabase.from("forum_comments").insert({
      post_id: selectedPost.id,
      user_id: user.id,
      author_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Anonymous",
      content: newComment.trim(),
    });
    await supabase.from("forum_posts").update({ comments_count: selectedPost.comments_count + 1 }).eq("id", selectedPost.id);
    setNewComment("");
    setSubmitting(false);
    fetchComments(selectedPost.id);
    fetchPosts();
  };

  const openPost = (post: ForumPost) => {
    setSelectedPost(post);
    fetchComments(post.id);
  };

  const timeAgo = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  // Post detail view
  if (selectedPost) {
    return (
      <div className="min-h-screen bg-muted/50">
        <header className="bg-card border-b border-border">
          <div className="container flex items-center gap-3 h-14 px-4">
            <button onClick={() => setSelectedPost(null)} className="p-2 hover:bg-muted rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-sm font-bold text-foreground truncate">{selectedPost.title}</h1>
          </div>
        </header>
        <main className="container px-4 py-4 space-y-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-primary">{selectedPost.author_name}</span>
              <span className="text-[10px] text-muted-foreground">{timeAgo(selectedPost.created_at)}</span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{selectedPost.content}</p>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
              <button onClick={() => handleLike(selectedPost)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-crisis-critical">
                <Heart className="w-3.5 h-3.5" /> {selectedPost.likes_count}
              </button>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageCircle className="w-3.5 h-3.5" /> {comments.length}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {comments.map((c) => (
              <div key={c.id} className="bg-card rounded-lg border border-border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-foreground">{c.author_name}</span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-xs text-foreground">{c.content}</p>
              </div>
            ))}
          </div>

          {user && (
            <div className="flex gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 text-sm bg-card border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button onClick={handleAddComment} disabled={submitting || !newComment.trim()} className="p-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // New post form
  if (showNewPost) {
    return (
      <div className="min-h-screen bg-muted/50">
        <header className="bg-card border-b border-border">
          <div className="container flex items-center gap-3 h-14 px-4">
            <button onClick={() => setShowNewPost(false)} className="p-2 hover:bg-muted rounded-lg"><X className="w-5 h-5" /></button>
            <h1 className="text-sm font-bold text-foreground">New Post</h1>
          </div>
        </header>
        <main className="container px-4 py-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setNewCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${newCategory === cat.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"}`}>
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Post title..."
            className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary" />
          <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Share your safety tip, experience, or question..."
            rows={6} className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
          <button onClick={handleCreatePost} disabled={submitting || !newTitle.trim() || !newContent.trim()}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm disabled:opacity-50">
            {submitting ? "Posting..." : "Post to Community"}
          </button>
        </main>
      </div>
    );
  }

  // Posts list
  return (
    <div className="min-h-screen bg-muted/50">
      <header className="bg-card border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
            <MessageCircle className="w-5 h-5 text-primary" />
            <h1 className="text-sm font-bold text-foreground">{t("forum.title")}</h1>
          </div>
          {user && (
            <button onClick={() => setShowNewPost(true)} className="p-2 bg-primary text-primary-foreground rounded-lg">
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <div className="container px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setFilterCategory("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition-colors ${filterCategory === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>
            All
          </button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition-colors ${filterCategory === cat.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      <main className="container px-4 pb-6 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground mb-1">No posts yet</p>
            <p className="text-xs text-muted-foreground">Be the first to share a safety tip!</p>
          </div>
        ) : (
          posts.map((post) => {
            const cat = categories.find((c) => c.id === post.category);
            return (
              <button key={post.id} onClick={() => openPost(post)} className="w-full text-left bg-card rounded-xl border border-border p-4 hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  {cat && <span className="text-xs">{cat.emoji}</span>}
                  <span className="text-[10px] font-bold text-primary uppercase">{cat?.label}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(post.created_at)}</span>
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">{post.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">{post.author_name}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                    <Heart className="w-3 h-3" /> {post.likes_count}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageCircle className="w-3 h-3" /> {post.comments_count}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </main>
    </div>
  );
};

export default CommunityForum;
