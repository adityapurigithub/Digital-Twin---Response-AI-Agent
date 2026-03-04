/**
 * AutoPilot AI — OpenAI Service
 * Handles:
 *  1. Generating an AI reply draft in Aditya's persona
 *  2. Computing a confidence score (0-100) for the message
 *  3. Classifying message sentiment/intent
 */

const OpenAI = require('openai');
const { store } = require('../store');

let openai;

function getClient() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-placeholder') {
      console.warn('[OpenAI] ⚠  No valid API key set. Running in DEMO mode — responses will be mocked.');
      return null;
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

// ─── Mock responses for demo / dev without a real key ────────────────
function mockResponse(incomingText) {
  const lower = incomingText.toLowerCase();
  if (lower.includes('time') || lower.includes('meeting') || lower.includes('kab hai')) {
    return { draft: "Haan bhai! Meeting 4 PM ko hai, don't be late 😄", confidence: 97, sentiment: 'Routine question', intent: 'Meeting / schedule query' };
  }
  if (lower.includes('birthday') || lower.includes('happy') || lower.includes('janamdin')) {
    return { draft: 'Arrey thank you so much yaar!! 🥳🎂', confidence: 99, sentiment: 'Positive / celebratory', intent: 'Birthday / congratulations' };
  }
  if (lower.includes('project') || lower.includes('update') || lower.includes('report') || lower.includes('kaam')) {
    return { draft: "Hi! Kaam sahi chal raha hai. I'll send a detailed update shortly. 🚀", confidence: 58, sentiment: 'Professional / Urgent', intent: 'Work / project status request' };
  }
  if (lower.includes('upset') || lower.includes('angry') || lower.includes('hate') || lower.includes('gussa') || lower.includes('pareshan')) {
    return { draft: "Arrey yaar, I'm really sorry about that. Baad mein baat karte hain aaram se.", confidence: 38, sentiment: 'Upset / Emotional', intent: 'Conflict / emotional message' };
  }
  if (lower.includes('eat') || lower.includes('food') || lower.includes('mom') || lower.includes('khana') || lower.includes('kha liya')) {
    return { draft: "Haan mummy kha liya, sab theek hai! Aap chinta mat karo ❤️", confidence: 95, sentiment: 'Family / caring', intent: 'Welfare check' };
  }
  if (lower.includes('kya chal raha') || lower.includes('kaisa hai') || lower.includes('aur bata')) {
    return { draft: "Bas badhiya bhai, tum sunao kya chal raha hai aajkal?", confidence: 85, sentiment: 'Casual / friendly', intent: 'General greeting' };
  }
  return { draft: "Haan got your message. Thodi der mein reply karta hoon!", confidence: 72, sentiment: 'Neutral', intent: 'General message' };
}

// ─── Main function ────────────────────────────────────────────────────
async function analyzeAndDraft({ incomingText, senderName, platform, contactDirective }) {
  const client = getClient();

  // If no valid OpenAI key, fall back to mock
  if (!client) {
    const mock = mockResponse(incomingText);
    return mock;
  }

  const personaLines = store.persona.join('\n- ');

  const systemPrompt = `
You are AutoPilot AI, an intelligent assistant acting as a "Digital Twin" for a person named Aditya.
Your job is to:
1. Read an incoming message sent to Aditya on ${platform}.
2. Generate a natural, human reply in Aditya's exact voice and style. **CRITICAL: You MUST match the sender's language. If they use Hindi/Hinglish, you must immediately reply using casual Hinglish.**
3. Give a confidence score (0-100) for how confident you are that the auto-reply is appropriate without human review.
4. Classify the sentiment and intent.

ADITYA'S PERSONA RULES:
- ${personaLines}

CONTACT-SPECIFIC DIRECTIVE FOR "${senderName || 'Unknown'}":
${contactDirective || 'No specific directive. Use Aditya\'s default casual tone.'}

CONFIDENCE SCORING GUIDE:
- 90-100: Routine, low-stakes (greetings, simple factual Q&A, birthday wishes)
- 70-89:  Moderate complexity (scheduling, social plans, friend chat)
- 40-69:  Higher stakes (client/work messages, commitments, plans)
- 0-39:   Sensitive (emotional conflicts, financial requests, legal matters, emergencies)

Respond ONLY with a valid JSON object in this exact format:
{
  "draft": "the reply text here",
  "confidence": 85,
  "sentiment": "Positive / casual",
  "intent": "Meeting / schedule query"
}
`.trim();

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system',  content: systemPrompt },
        { role: 'user',    content: `Incoming message from ${senderName || 'Unknown'} on ${platform}:\n\n"${incomingText}"` },
      ],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0].message.content;
    const parsed = JSON.parse(raw);

    return {
      draft:      parsed.draft      || "Hey! Got your message. I'll reply soon.",
      confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 70)),
      sentiment:  parsed.sentiment  || 'Neutral',
      intent:     parsed.intent     || 'General',
    };
  } catch (err) {
    console.error('[OpenAI] Error calling API:', err.message);
    // Fall back to mock on API error
    return mockResponse(incomingText);
  }
}

module.exports = { analyzeAndDraft };
