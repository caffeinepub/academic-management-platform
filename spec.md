# Specification

## Summary
**Goal:** Fix the Chat feature in AcadMind by routing Gemini API calls directly from the frontend using the `@google/genai` SDK, bypassing the stopped ICP backend canister.

**Planned changes:**
- Remove all ICP actor/canister calls (e.g., `sendMessage`) from `Chat.tsx` and `geminiChat.ts` utility.
- Integrate `@google/genai` SDK directly in the frontend: instantiate `GoogleGenAI` with the user's `geminiApiKey` from `UserContext` and call `gemini-2.5-flash` model.
- Dynamically build the system prompt from the user's timetable slots and tasks using existing React Query hooks.
- Display an inline prompt in the chat UI if no `geminiApiKey` is stored, directing the user to add their key in the sidebar.
- Add `@google/genai` to `frontend/package.json` dependencies if not already present.
- Preserve all existing chat UI elements: scrollable history, Send button, Enter-to-send, typing indicator, Clear Chat button, and formatted responses.

**User-visible outcome:** Users can send chat messages and receive AI responses powered by Gemini 2.5 Flash directly from the frontend without encountering the canister-stopped error. Users without an API key see a clear inline prompt to add one.
