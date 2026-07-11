# Setup Instructions

## 1. Database Setup

Go to your Supabase dashboard (https://supabase.com/dashboard) and run this SQL in the SQL Editor:

```sql
-- Create watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id TEXT PRIMARY KEY,
  contentId TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('movie', 'anime', 'tv')) NOT NULL,
  poster TEXT,
  status TEXT CHECK (status IN ('Planned', 'Watching', 'Completed', 'Dropped')) DEFAULT 'Planned',
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own watchlist" ON watchlist
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);
CREATE UNIQUE INDEX idx_watchlist_user_content ON watchlist(user_id, contentId);
```

## 2. Environment Variables

Your `.env.local` is already configured correctly.

## 3. Run the App

```bash
npm run dev
```

## 4. Test Authentication

1. Go to http://localhost:3000
2. Click "Sign In" 
3. Create a new account or sign in
4. Browse movies and add to watchlist
5. Click "Watch Now" to test streaming

## Fixed Issues

✅ Authentication now uses Supabase directly (no custom server needed)
✅ Watchlist uses Supabase database
✅ Error handling improved
✅ Video streaming works with demo videos