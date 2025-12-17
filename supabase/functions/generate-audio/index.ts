// AudiText - Text-to-Speech Edge Function
// Returns audio as Base64-encoded JSON

import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, voice_id } = await req.json()

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Aggressive text cleaning for ElevenLabs compatibility
    let cleanText = text
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code
      .replace(/`[^`]+`/g, '')
      // Convert links to just text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove heading markers
      .replace(/^#+\s*/gm, '')
      // Remove bold/italic markers
      .replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, ' ')
      // Remove special markdown
      .replace(/>/g, '').replace(/</g, '')
      // Remove footnote references
      .replace(/\[\d+\]/g, '')
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, '')
      // Replace multiple spaces with single
      .replace(/\s+/g, ' ')
      // Replace multiple newlines with single
      .replace(/\n{2,}/g, '\n')
      // Remove any remaining non-printable characters
      .replace(/[^\x20-\x7E\n]/g, '')
      .trim()

    // Take first 4000 characters after cleaning
    cleanText = cleanText.slice(0, 4000)

    // Ensure we have meaningful text
    if (cleanText.length < 20) {
      return new Response(
        JSON.stringify({ success: false, error: 'Text too short after cleaning' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${cleanText.length} chars, first 100: ${cleanText.slice(0, 100)}`)

    const selectedVoice = voice_id || 'EXAVITQu4vr4xnSDxMaL'

    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    )

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text()
      console.error('ElevenLabs error:', elevenLabsResponse.status, errorText)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `ElevenLabs: ${elevenLabsResponse.status}`,
          details: errorText.slice(0, 500)
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const audioBuffer = await elevenLabsResponse.arrayBuffer()
    const audioBase64 = base64Encode(new Uint8Array(audioBuffer))

    console.log(`Audio generated: ${audioBuffer.byteLength} bytes`)

    return new Response(
      JSON.stringify({
        success: true,
        audio: audioBase64,
        contentType: 'audio/mpeg',
        byteLength: audioBuffer.byteLength,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
