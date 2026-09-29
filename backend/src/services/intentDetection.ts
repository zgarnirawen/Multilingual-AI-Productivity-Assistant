import Groq from "groq-sdk";
import { withModelFallback } from "./modelFallback.js";
import { detectDeterministicModifyTaskTitle } from "./deterministicIntentClassifier.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const INTENT_CONFIDENCE_THRESHOLD = 0.6;

export type DetectedIntent =
  | "create_task" | "create_event" | "modify_task" | "delete_task" | "modify_event" | "delete_event"
  | "summarize_period" | "greeting" | "farewell" | "thanks" | "small_talk" | "capabilities" | "unrecognized";

export interface IntentResult {
  intent: DetectedIntent;
  language?: "fr" | "en";
  confidence?: number;
  taskTitle?: string;
  taskDateTime?: string;
  eventTitle?: string;
  eventDateTime?: string;
  durationMinutes?: number;
  timeOffsetMinutes?: number;
  contactName?: string;
  summaryPeriodStart?: string;
  summaryPeriodEnd?: string;
  summaryScope?: 'tasks' | 'events' | 'both';
  summaryDates?: string[];
  targetTitleQuery?: string;
  newTaskTitle?: string;
  newEventTitle?: string;
  newEventDateTime?: string;
}

/** Normalizes optional entities before they reach the proposal UI. */
export function normalizeActionEntities(result: IntentResult): IntentResult {
  const normalized = { ...result };
  if (normalized.contactName) normalized.contactName = normalized.contactName.trim().replace(/\s+/g, ' ');
  if (normalized.targetTitleQuery) {
    let query = normalized.targetTitleQuery.trim().replace(/\s+/g, ' ');
    // Remove generic item-reference wording while preserving the identifying subject.
    const genericPrefixes = [
      /^(?:la|le|les|l')?\s*(?:tâche|tache|rappel|élément|element)\s+(?:concernant|à propos de|au sujet de|sur|pour)\s+/i,
      /^(?:the\s+)?(?:task|reminder|item)\s+(?:about|concerning|regarding|for)\s+/i,
      /^(?:la|le|les|l')\s+/i,
      /^the\s+/i,
    ];
    let previous: string;
    do {
      previous = query;
      for (const prefix of genericPrefixes) query = query.replace(prefix, '').trim();
    } while (query !== previous);
    normalized.targetTitleQuery = query || undefined;
  }
  if (normalized.durationMinutes !== undefined) {
    const duration = Number(normalized.durationMinutes);
    normalized.durationMinutes = Number.isFinite(duration) && duration > 0 && duration <= 1440 ? Math.round(duration) : undefined;
  }
  if (normalized.timeOffsetMinutes !== undefined) {
    const offset = Number(normalized.timeOffsetMinutes);
    normalized.timeOffsetMinutes = Number.isFinite(offset) && offset >= -1440 && offset <= 1440 && offset !== 0 ? Math.round(offset) : undefined;
  }
  return normalized;
}

const tools: Groq.Chat.Completions.ChatCompletionTool[] = [{
  type: "function",
  function: {
    name: "classify_intent",
    description: "Classify the user's message into a supported intent, extract relevant action entities, and provide a confidence score from 0 to 1.",
    parameters: {
      type: "object",
      properties: {
        intent: { type: "string", enum: ["create_task","create_event","summarize_period","modify_task","delete_task","modify_event","delete_event","greeting","farewell","thanks","small_talk","capabilities","unrecognized"] },
        language: { type: "string", enum: ["fr", "en"] },
        confidence: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Numeric confidence between 0 and 1. Example: 0.92. Never write words; return a JSON number only.",
    },
        taskTitle: { type: ["string", "null"], description: "Title/name of the task, only if intent is create_task. Do not include a separately extracted date/time phrase." },
        taskDateTime: { type: ["string", "null"], description: "ISO 8601 due date/time for create_task when explicitly mentioned or inferable. Return null when absent." },
        targetTitleQuery: { type: ["string", "null"], description: "Only for modify/delete intents. The title or description used to refer to the existing item." },
        newTaskTitle: { type: ["string", "null"], description: "Only for modify_task. The new task title, if provided." },
        newEventTitle: { type: ["string", "null"], description: "Only for modify_event. The new event title, if provided." },
        newEventDateTime: { type: ["string", "null"], description: "Only for modify_event. New event date/time in ISO 8601, if provided." },
        eventTitle: { type: ["string", "null"], description: "Title/name of the event or appointment, only if intent is create_event." },
        eventDateTime: { type: ["string", "null"], description: "ISO 8601 date/time if mentioned or inferable, only if intent is create_event." },
        durationMinutes: {
          type: ["integer", "null"],
          minimum: 1,
          maximum: 1440,
          description: "Duration normalized to minutes for an event. Examples: 30 minutes=30, 1 hour=60, 1h30=90. Do not use for moving an existing event later/earlier.",
        },
        timeOffsetMinutes: {
          type: ["integer", "null"],
          minimum: -1440,
          maximum: 1440,
          description: "Time shift for modify_event. Examples: 30 minutes later=30, two hours later=120, 30 minutes earlier=-30. Use only for relative schedule changes.",
        },
        contactName: {
          type: ["string", "null"],
          description: "Person/contact explicitly associated with the task or event. Extract only the stated name; never invent contact data. Return null when absent.",
        },
        summaryPeriodEnd: { type: ["string", "null"] },
        summaryScope: { type: ["string", "null"], enum: ["tasks", "events", "both", null] },
        summaryDates: { type: ["array", "null"], items: { type: "string" } },
      },
      required: ["intent", "language", "confidence"],
    },
  },
}];

export async function detectIntent(inputText: string): Promise<IntentResult> {
  const deterministicResult = detectDeterministicModifyTaskTitle(inputText);
  if (deterministicResult) return deterministicResult;

  const today = new Date().toISOString().split("T")[0];
  const primaryModel = process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-120b";
  const models = [primaryModel, process.env.GROQ_FALLBACK_MODEL || ""];
  const completion = await withModelFallback(models, (model) => groq.chat.completions.create({
    model,
    messages: [
      { role: "system", content: `You are an intent classifier for a productivity assistant. Today's date is ${today} (${new Date().toLocaleDateString('fr-FR', { weekday: 'long' })}).

Be flexible with casual speech, typos, abbreviations and voice-to-text errors. Extract action entities whenever explicitly present. Never invent a contact, duration, date, or name. Normalize event durations to minutes (30 minutes=30, 1 hour=60, 1h30=90). For relative event changes, use timeOffsetMinutes instead (30 minutes later=30, two hours later=120). For task requests, keep date/time separate from taskTitle in taskDateTime. For contacts, return only the person's stated name, never a phone number or other contact data. For targetTitleQuery, extract the shortest meaningful identifying phrase, not generic wording such as "la tâche concernant", "tâche à propos de", "task about", or "reminder regarding"; for "Supprime la tâche concernant les factures", return "factures".

Supported intents: greeting, farewell, thanks, small_talk, capabilities, create_task, create_event, modify_task, delete_task, modify_event, delete_event, summarize_period, unrecognized.
For valid informal requests, use the closest intent and confidence >=0.7 when meaning is reasonably clear. Use <0.6 only when genuinely unclear. Always call classify_intent. For modify_task, changing an existing task title is not creating a new task: phrases such as "renomme cette tâche", "remplace le titre par", "mets comme titre", "mets plutôt comme titre", "change le nom de cette tâche", or "remplace le nom de la tâche" mean modify_task. When "comme titre" refers to an existing task, classify modify_task.
Examples: "n'oublie pas d'appeler sam" -> create_task + contactName="sam"; "rdv avec Sara demain pendant 1h30" -> create_event + contactName="Sara" + durationMinutes=90; "réunion avec Nadia pour 45 minutes" -> create_event + contactName="Nadia" + durationMinutes=45; "qu'est-ce que j'ai cette semaine" -> summarize_period; "il fait combien dehors" -> unrecognized.` },
      { role: "user", content: inputText },
    ],
    tools,
    tool_choice: { type: "function", function: { name: "classify_intent" } },
  }));
  const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
  if (!toolCall) return { intent: "unrecognized", confidence: 0 };
  try {
    const args = JSON.parse(toolCall.function.arguments) as IntentResult;
    const confidence = Math.max(0, Math.min(1, Number(args.confidence)));
    if (!Number.isFinite(confidence) || confidence < INTENT_CONFIDENCE_THRESHOLD) return { intent: "unrecognized", language: args.language, confidence: Number.isFinite(confidence) ? confidence : 0 };
    return normalizeActionEntities({ ...args, confidence });
  } catch {
    return { intent: "unrecognized", confidence: 0 };
  }
}


