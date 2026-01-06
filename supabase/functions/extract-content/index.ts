// AudiText - Content Extraction Edge Function
// Extracts clean text from URLs using Jina AI Reader + Gemini AI Cleaning (if available)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExtractRequest {
  url: string
}

interface ExtractResponse {
  title: string
  content: string
  cleaned_content?: string
  source: string
  platform: string
  word_count: number
  author?: string
  ai_cleaned: boolean
}

// Clean content using OpenRouter (OpenAI compatible)
async function cleanWithOpenRouter(rawText: string, apiKey: string): Promise<string | null> {
  const url = 'https://openrouter.ai/api/v1/chat/completions'
  
  const prompt = `
    You are an expert editor preparing text for Audio Reading (Text-to-Speech).
    Task: Clean the provided raw web extraction.
    
    Rules:
    1. **Format**: The FIRST LINE must be the Title as a Markdown Header 1. Example: "# Vitalik's thoughts on Ethereum".
    2. **Format**: The SECOND LINE must be the Author. Example: "Author: Vitalik Buterin".
    3. **Title Generation**: If the content is a tweet or status update without a clear title, generate a short, descriptive title like "[Author]'s Tweet about [Topic]".
    4. Extract ONLY the main article body or Social Media Post. 
    5. Remove sidebars, navigation, "Published on", "Read time", "Share", footer text.
    6. **CRITICAL**: If this is a Twitter/X or Social Media post, IGNORE "Login", "Sign Up", "See new posts" text. SEARCH for the actual user post/tweet content. It might be buried in the text.
    7. Remove all Markdown images, links, and code blocks.
    8. Remove URLs.
    9. Fix spacing.
    10. Only return "ERROR: Content unreadable" if there is ABSOLUTELY NO article/post content found (e.g. only a Login form).
    
    Raw Text:
    ${rawText.slice(0, 20000)}
  `

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://auditext.app', // Optional, good practice for OpenRouter
        'X-Title': 'AudiText'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini', // Fallback to reliable GPT-4o-mini
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('OpenRouter API Error:', response.status, errText)
      return `ERROR: OpenRouter API Error: ${response.status} - ${errText}`
    }

    const data = await response.json()
    const cleanText = data.choices?.[0]?.message?.content
    return cleanText || "ERROR: OpenRouter returned empty content"
  } catch (e) {
    console.error('OpenRouter Call Failed:', e)
    return `ERROR: OpenRouter Call Failed: ${String(e)}`
  }
}

// Clean content using Google Gemini (Direct)
async function cleanWithGemini(rawText: string, apiKey: string): Promise<string | null> {
  // Use gemini-1.5-flash for best cost/performance ratio
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
  
  const prompt = `
    You are an expert editor preparing text for Audio Reading (Text-to-Speech).
    Task: Clean the provided raw web extraction.
    
    Rules:
    1. **Format**: The FIRST LINE must be the Title as a Markdown Header 1. Example: "# Vitalik's thoughts on Ethereum".
    2. **Format**: The SECOND LINE must be the Author. Example: "Author: Vitalik Buterin".
    3. **Title Generation**: If the content is a tweet or status update without a clear title, generate a short, descriptive title like "[Author]'s Tweet about [Topic]".
    4. Extract ONLY the main article body or Social Media Post. 
    5. Remove sidebars, navigation, "Published on", "Read time", "Share", footer text.
    6. **CRITICAL**: If this is a Twitter/X or Social Media post, IGNORE "Login", "Sign Up", "See new posts" text. SEARCH for the actual user post/tweet content. It might be buried in the text.
    7. Remove all Markdown images, links, and code blocks.
    8. Remove URLs.
    9. Fix spacing.
    10. Only return "ERROR: Content unreadable" if there is ABSOLUTELY NO article/post content found.
    
    Raw Text:
    ${rawText.slice(0, 30000)}
  `

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192
        }
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Gemini API Error:', response.status, errText)
      return `ERROR: Gemini API Error: ${response.status} - ${errText}`
    }

    const data = await response.json()
    const cleanText = data.candidates?.[0]?.content?.parts?.[0]?.text
    return cleanText || "ERROR: Gemini returned empty content"
  } catch (e) {
    console.error('Gemini Call Failed:', e)
    return `ERROR: Gemini Call Failed: ${String(e)}`
  }
}

function detectPlatform(url: string): { source: string; platform: string } {
  const lowerUrl = url.toLowerCase()
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return { source: 'Twitter', platform: 'twitter' }
  if (lowerUrl.includes('medium.com')) return { source: 'Medium', platform: 'medium' }
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    return { source: domain, platform: 'web' }
  } catch {
    return { source: 'Web', platform: 'web' }
  }
}

function extractTitle(content: string): string {
  const h1Match = content.match(/^#\s+(.+)$/m)
  return h1Match ? h1Match[1].trim() : 'Untitled'
}

function countWords(content: string): number {
  return content.split(/\s+/).filter(w => w.length > 0).length
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json() as ExtractRequest

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const jinaApiKey = Deno.env.get('JINA_API_KEY')
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY')
    
    // DEBUG LOGGING
    console.log(`Debug: Gemini Key Present? ${!!geminiApiKey}`)
    if (geminiApiKey) console.log(`Debug: Gemini Key length: ${geminiApiKey.length}`)
    console.log(`Debug: OpenRouter Key Present? ${!!openRouterApiKey}`)

    if (!jinaApiKey) {
      return new Response(JSON.stringify({ error: 'JINA_API_KEY not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 1. Extract Raw Content (Jina)
    console.log(`Extracting: ${url}`)
    const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${jinaApiKey}`, 'X-Return-Format': 'markdown' },
    })

    if (!jinaRes.ok) throw new Error(`Jina failed: ${jinaRes.status}`)
    const rawContent = await jinaRes.text()
    
    // Check if empty
    if (!rawContent || rawContent.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'No content extracted from URL' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 2. AI Cleaning (Gemini Priority -> OpenRouter Fallback)
    let finalContent = rawContent
    let isAiCleaned = false
    let usedProvider = 'none'
    let lastError = null

    // Try Gemini First (Best Cost/Performance)
    if (geminiApiKey) {
      console.log('Cleaning with Gemini 1.5 Flash...')
      const aiCleaned = await cleanWithGemini(rawContent, geminiApiKey)
      
      if (aiCleaned && !aiCleaned.startsWith('ERROR:')) {
           console.log('Gemini cleaning successful')
           finalContent = aiCleaned
           isAiCleaned = true
           usedProvider = 'gemini'
      } else {
         lastError = aiCleaned
         console.warn('Gemini cleaning failed, falling back if possible')
      }
    }

    // Fallback to OpenRouter if Gemini not used or failed
    if (!isAiCleaned && openRouterApiKey) {
      console.log('Cleaning with OpenRouter (Fallback)...')
      const aiCleaned = await cleanWithOpenRouter(rawContent, openRouterApiKey)
      
      if (aiCleaned) {
        if (aiCleaned.startsWith('ERROR:')) {
            console.log('OpenRouter returned error:', aiCleaned)
            if (!lastError) lastError = aiCleaned 
        } else {
           console.log('OpenRouter cleaning successful')
           finalContent = aiCleaned
           isAiCleaned = true
           usedProvider = 'openrouter'
        }
      }
    }

    // 3. Fallback Cleaning for Twitter (if AI failed)
    // ... (rest of logic)

    // ...

    // Continues to fallback logic...

    // 3. Fallback Cleaning for Twitter (if AI failed)
    // AI might fail due to key/quota, but we still want to read the tweet if possible.
    if (!isAiCleaned && (url.includes('x.com') || url.includes('twitter.com'))) {
       const lower = rawContent.toLowerCase()
       // If it's the "Login wall" garbage, we can't save it.
       if (lower.includes('log in') && lower.includes('sign up') && rawContent.length < 500) {
          finalContent = "System Notification: X (Twitter) requires login. Please try a different public tweet."
       } else {
          // Robust Line-by-Line Cleaning for Twitter/Social
          const lines = rawContent.split('\n')
          
          // 1. Partial Match Safe (Likely junk if line contains this)
          const junkPhrases = [
             'log in', 'sign up', 'don’t miss what’s happening', 
             'people on x are the first to know', 'published time',
             'see new posts', 'click to copy link',
             'by signing up', 'verified orgs',
             'terms of service', 'privacy policy', 'cookie policy',
             'accessibility', 'ads info', '© 20', 'trending now', 
             'what’s happening', 'politics · trending', 'show more'
          ]

          // 2. Exact Match Only (Common words that are valid in sentences)
          const junkEq = new Set([
             'conversation', 'article', 'bookmarks', 'messages', 'profile', 
             'more', 'home', 'explore', 'notifications', 'communities', 
             'premium', 'business', 'jobs', 'follow', 'new to x?', 
             'captured', 'relevant people'
          ])
          
          finalContent = lines.filter(line => {
             const cleanLine = line.trim().toLowerCase()
             if (cleanLine.length === 0) return true // Keep paragraph breaks
             
             // 1. Remove isolated numbers (stats like 25, 19K, 2049) if they look like stats
             if (/^[\d,.]+[KMB]?$/.test(cleanLine)) return false
             
             // 2. Exact Match Checks (Navigation menus)
             if (junkEq.has(cleanLine)) return false

             // 3. Partial Match Checks (Phrases)
             for (const junk of junkPhrases) {
                if (cleanLine.includes(junk)) {
                    // Only remove if line is short (< 100 chars) ensuring it's likely a UI element
                    if (cleanLine.length < 100) return false
                }
             }
             
             // 4. Specific Header/Footer Patterns
             if (cleanLine === 'untitled') return false
             if (cleanLine.includes('/ x')) return false // "Name / X" titles
             if (cleanLine.includes(' on x:')) return false // "Name on X: ..."
             if (cleanLine.length < 2 && !/[a-z0-9]/i.test(cleanLine)) return false 
             if (cleanLine.match(/^=+/)) return false 
             if (cleanLine.match(/^-+/)) return false 
             
             return true
          }).join('\n')
          
          // Final sweep to ensure Title isn't "Untitled" if we have content
          const tempTitle = extractTitle(finalContent)
          if (finalContent.length > 50 && (!tempTitle || tempTitle === 'Untitled')) {
             // Try to use the first meaningful line as title
             const manualTitle = finalContent.split('\n').find(l => l.trim().length > 10)?.substring(0, 50)
             if (manualTitle) {
                 // Prepend as H1 so extractTitle picks it up later
                 finalContent = `# ${manualTitle}...\n\n${finalContent}`
             }
          }
       }
    }

    // DEBUG: If AI failed, append error to content so user sees it
    if (!isAiCleaned && lastError) {
        finalContent = `[SYSTEM: AI Cleaning Failed - ${lastError?.substring(0, 100)}... Using Fallback]\n\n${finalContent}`
    }

    // 4. Parse Metadata
    const { source, platform } = detectPlatform(url)
    const title = extractTitle(isAiCleaned ? finalContent : rawContent) 
    const word_count = countWords(finalContent)

    const response: ExtractResponse & { debug_info?: any } = {
      title,
      content: finalContent, 
      cleaned_content: isAiCleaned ? finalContent : undefined,
      source,
      platform,
      word_count,
      ai_cleaned: isAiCleaned,
      debug_info: {
        has_jina_key: !!jinaApiKey,
        has_gemini_key: !!geminiApiKey,
        has_openrouter_key: !!openRouterApiKey,
        active_provider: usedProvider,
        last_error: lastError,
        is_ai_cleaned: isAiCleaned
      }
    }

    return new Response(JSON.stringify(response), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
