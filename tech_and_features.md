# Auto-Responder Digital Twin - Tech & Features Specification

## 1. Project Overview
A centralized web application dashboard that acts as an intelligent "Digital Twin" for your social media and messaging platforms. Instead of generic automated templates, this AI reads incoming messages, determines if it can confidently reply based on your personal context, auto-responds to routine queries, and flags complex or sensitive messages for your personal review.

**Target Platforms:**
*   WhatsApp (Initial Prototype Focus)
*   Instagram Direct (Future)
*   Facebook Messenger (Future)

## 2. Core Features (The "Never-Seen-Before" Factors)

### A. The "Draft vs. Auto-Send" Confidence Engine
The AI evaluates every incoming message and assigns an internal "Confidence Score" before taking action.
*   **High Confidence (>90%):** Routine questions ("What time is the meeting?", "Happy Birthday"). The AI auto-replies immediately in your tone.
*   **Low Confidence (<90%):** Sensitive topics, complex requests, or emotional messages. The AI does *not* send a message. Instead, it generates a "Draft Reply" and places the conversation in a "Needs Review" queue on your web dashboard for your approval.

### B. True "Persona Cloning" (Chameleon Mode)
The AI doesn't sound like a generic bot. It is trained on your past chat history to replicate:
*   Your typing style (lowercase usage, punctuation habits).
*   Your vocabulary and slang.
*   Your emoji preferences.
*   Platform-specific tones (e.g., professional for LinkedIn, casual for WhatsApp).

### C. Contact-Specific Directives (The "VIP List")
Sync your contacts and assign them custom instructions/roles from the dashboard:
*   **Clients:** "Check my calendar/Trello for project status. Be professional."
*   **Family:** "Always be polite, tell them I'm busy but will call later if I'm at work."
*   **Close Friends:** "Match their energy, joke around, use casual language."

### D. VIP "Breakthrough" Keywords
If you are in "Deep Work Mode" (Do Not Disturb), the bot handles all communications.
*   The bot auto-replies: *"Aditya is currently coding and notifications are off. If this is an emergency, type 'URGENT'."*
*   If the contact types "URGENT", the system bypasses silent mode and pings your dashboard/sends an SMS alert.

### E. The "Morning Executive Summary"
Instead of checking multiple apps to see what you missed overnight or during a focus session, the dashboard provides a clean summary:
*   *e.g., "3 friends asked about Friday (I said you'd confirm later). Client X asked for an invoice (Draft generated for review)."*

---

## 3. Technology Stack

### Frontend (The Control Dashboard)
*   **Framework:** React (via Vite or Next.js)
*   **Styling:** Tailwind CSS + custom modern UI/UX (Glassmorphism, Dark Mode)
*   **State Management:** Redux or Zustand (optional, based on complexity)

### Backend (Webhook & Logic Handler)
*   **Framework:** Node.js with Express.js
*   **Database:** MongoDB or PostgreSQL (to store message logs, VIP settings, and drafts)
*   **Vector Database (Memory):** Pinecone or Weaviate (for storing your chat style and past interactions for context).

### AI & Integrations
*   **Language Model:** OpenAI API (GPT-4o or GPT-4-turbo) for natural language processing and confidence scoring.
*   **WhatsApp Integration:** Twilio WhatsApp API or WhatsApp Cloud API (Meta).
*   **Other Integrations (Future):** Meta Graph API for Instagram/Messenger.

---

## 4. Development Phases

### Phase 1: The Core Engine (WhatsApp Prototype)
*   Set up Node.js Express server to handle Twilio WhatsApp webhooks.
*   Integrate OpenAI API to read incoming messages and generate a response.
*   Implement a basic rule: Auto-reply to everything just to test the connection.

### Phase 2: The Confidence Engine & Dashboard
*   Build the React frontend dashboard.
*   Implement the "Confidence Score" logic in the backend.
*   Route "Low Confidence" messages to the frontend dashboard for manual approval.
*   Database integration to store message states (Pending, Auto-Replied, Approved).

### Phase 3: Persona Customization & VIP Rules
*   Build the UI to manage contacts and set custom directives.
*   Refine the AI prompt to enforce Persona Cloning based on the contact.
*   Implement the "Breakthrough/URGENT" keyword feature.

### Phase 4: Expansion
*   Add Instagram and Facebook Messenger channels.
*   Implement the "Morning Executive Summary" generation.
