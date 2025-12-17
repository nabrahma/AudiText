# AudiText - Backend Setup Guide (Phase 1)

## Prerequisites
- Supabase project created at [supabase.com](https://supabase.com)
- Jina AI API key from [jina.ai/reader](https://jina.ai/reader)

---

## Step 1: Run Database Migration

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the contents of `supabase/migrations/20241217_init_library.sql`
6. Paste and click **Run**

✅ You should see "Success. No rows returned" message.

**Verify:** Go to **Table Editor** → You should see `library_items` table.

---

## Step 2: Set Edge Function Secrets

In your Supabase Dashboard:

1. Go to **Project Settings** → **Edge Functions**
2. Click **Manage Secrets**
3. Add the following secret:
   - **Name:** `JINA_API_KEY`
   - **Value:** `jina_784d1403958f4d2ebfa4207c8b00978eQ-eAqU9_PWsLRxHCeErB7JBsQ-Zl`

---

## Step 3: Deploy Edge Function

### Option A: Via Supabase CLI (Recommended)

```bash
# Login to Supabase (opens browser)
npx supabase login

# Link to your project
npx supabase link --project-ref uivhxrlbyjtmckvnexrk

# Deploy the function
npx supabase functions deploy extract-content
```

### Option B: Via Dashboard

1. Go to **Edge Functions** in dashboard
2. Click **New Function**
3. Name it `extract-content`
4. Copy/paste the code from `supabase/functions/extract-content/index.ts`
5. Click **Deploy**

---

## Step 4: Test the Function

Open your terminal or use an API client:

```bash
curl -X POST "https://uivhxrlbyjtmckvnexrk.supabase.co/functions/v1/extract-content" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpdmh4cmxieWp0bWNrdm5leHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NzQxMTAsImV4cCI6MjA4MTU1MDExMH0.DNZvZam2n4YE0Q_xAxa2Ettx86xoi4cqyluCWOQ_RrY" \
  -d '{"url": "https://paulgraham.com/greatwork.html"}'
```

**Expected Response:**
```json
{
  "title": "How to Do Great Work",
  "content": "July 2023...",
  "source": "paulgraham.com",
  "platform": "web",
  "word_count": 12500
}
```

---

## Supabase Credentials (Your Project)

| Key | Value |
|-----|-------|
| **Project URL** | `https://uivhxrlbyjtmckvnexrk.supabase.co` |
| **Anon Key** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| **Project Ref** | `uivhxrlbyjtmckvnexrk` |

---

## Troubleshooting

### "JINA_API_KEY not configured"
- Make sure you added the secret in **Project Settings** → **Edge Functions** → **Manage Secrets**

### "Failed to extract content"
- Check if the URL is accessible (not behind a paywall)
- Some sites may block automated requests

### Function not found (404)
- Ensure the function is deployed and active in the dashboard

---

## Next Phase
Once this is working, Phase 2 will add:
- `generate-audio` function for ElevenLabs TTS
- Audio streaming to the frontend player
