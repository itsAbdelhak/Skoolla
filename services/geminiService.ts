


import { GoogleGenAI, Type } from "@google/genai";

// --- EXISTING TYPES (STILL NEEDED FOR DOCUMENT STRUCTURE) ---
export type PersonalizationSettings = {
    language: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    tone: 'Strict' | 'Friendly' | 'Fast & Focused' | 'Encouraging';
    goal: 'Exam Prep' | 'Deep Understanding' | 'Study Notes' | 'Quick Revision';
    teacher_name?: string;
    duration?: 'Just Today' | 'A few days' | '1 Week' | 'Flexible';
};
export interface Part { title: string; summary: string; }
export interface Subtopic { title: string; summary: string; parts: Part[]; }
export interface Topic { title: string; summary: string; subtopics: Subtopic[]; }
export interface CourseOutline { course_title: string; topics: Topic[]; error?: string; }
export interface DiagramNode { id: string; label: string; summary: string; }
export interface DiagramData { diagram: string; nodes: DiagramNode[]; error?: string; }
// --- END OF EXISTING TYPES ---


// --- NEW TYPES BASED ON THE NEW ENGINE ---
export type EducationalMode = 'Explain' | 'Summary' | 'Quiz' | 'Diagram' | 'Simplify' | 'Example' | 'Flashcards';

export interface QuizQuestion {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
}
export interface QuizData {
    questions: QuizQuestion[];
}

export interface Flashcard {
    term: string;
    definition: string;
}
export interface FlashcardData {
    flashcards: Flashcard[];
}


// --- TYPES FOR STUDYING STATE ---
export interface StudyPart extends Part { completed: boolean; confidence: number | null; }
export interface StudySubtopic extends Subtopic { parts: StudyPart[]; }
export interface StudyTopic extends Topic { subtopics: StudySubtopic[]; }
export interface CourseOutlineWithProgress extends CourseOutline { 
    topics: StudyTopic[];
    subject?: string;
}
export type ActivePath = { topic: number; subtopic: number; part: number; };


const partSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A concise, descriptive title for the learning part (max 12 words)." },
        summary: { type: Type.STRING, description: "A one or two-sentence summary of this part's content." },
    },
    required: ['title', 'summary']
};

const subtopicSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "The title of the sub-topic, preserving original numbering." },
        summary: { type: Type.STRING, description: "A summary of the entire sub-topic." },
        parts: { type: Type.ARRAY, items: partSchema }
    },
    required: ['title', 'summary', 'parts']
};

const topicSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "The title of the main topic or chapter." },
        summary: { type: Type.STRING, description: "A summary of the entire topic." },
        subtopics: { type: Type.ARRAY, items: subtopicSchema }
    },
    required: ['title', 'summary', 'subtopics']
};

const courseOutlineSchema = {
    type: Type.OBJECT,
    properties: {
        course_title: { type: Type.STRING, description: "The main title of the entire course document." },
        topics: { type: Type.ARRAY, items: topicSchema },
        error: { type: Type.STRING, description: "An error message, if the document could not be analyzed." }
    },
    required: ['course_title', 'topics'],
};

// This function remains as it is essential for the initial document parsing.
export const analyzeDocumentStructure = async (
    files: { dataUrl: string; name: string; type: string; }[],
): Promise<CourseOutline> => {
    if (!process.env.API_KEY) throw new Error("API_KEY environment variable not set.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-pro';
    const systemPrompt = `You are a highly reliable, detail-oriented AI assistant designed to analyze academic documents and create accurate, structured study plans...`; // The long prompt for analysis is unchanged.
    const fileParts = files.map(fileInfo => {
        const [_, base64Data] = fileInfo.dataUrl.split(';base64,');
        if (!base64Data) throw new Error(`Invalid file data URL for ${fileInfo.name}.`);
        return { inlineData: { data: base64Data, mimeType: fileInfo.type } };
    });
    const userPromptPart = { text: "Analyze the attached document(s) and generate a structured JSON study plan based on the system instructions." };

    const response = await ai.models.generateContent({
        model,
        contents: { parts: [userPromptPart, ...fileParts] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: courseOutlineSchema,
            systemInstruction: systemPrompt,
        }
    });
    
    try {
        const jsonText = response.text.trim();
        const cleanedJsonText = jsonText.startsWith('```json') ? jsonText.replace(/^```json\n|```$/g, '') : jsonText;
        if (!cleanedJsonText) throw new Error("Received an empty response from the API.");
        const plan: CourseOutline = JSON.parse(cleanedJsonText);
        if (plan.error) throw new Error(plan.error);
        if (!plan.topics || !plan.course_title) throw new Error("Parsed JSON is not a valid course outline.");
        return plan;
    } catch (error) {
        console.error("Failed to parse study plan JSON:", error, "Raw response:", response.text);
        throw new Error("Sorry, I couldn't create a study plan from this document. Please try another file.");
    }
};


// --- NEW UNIFIED CONTENT GENERATION ENGINE ---

const STUDY_AID_SYSTEM_PROMPT = `You are the AI Tutor Engine for **StudyGen**, an intelligent learning assistant that helps students understand their study material interactively.

A student uploads a course document. Each document is analyzed into sections and sub-sections.  
When the student selects a specific part of the text, they can choose one of several actions (Simplify, Example, Summarize, Diagram, Explain Importance, Quiz, etc.).  
Your job is to produce a *precise, educational, and structured response* according to that action, using only the text provided.

----------------------------------------
### 🎯 INPUT FORMAT (JSON)
----------------------------------------
{
  "action": "Simplify | Example | Summarize | Diagram | Explain | Quiz | Flashcards",
  "selectedText": "The exact text the student highlighted",
  "context": "The full paragraph or section this selection came from",
  "language": "English | French | Arabic | Spanish | etc.",
  "studentLevel": "Beginner | Intermediate | Advanced",
  "tone": "Friendly | Academic | Encouraging",
  "subject": "Economics | Biology | Physics | History | etc."
}

----------------------------------------
### 🧩 OUTPUT RULES BY ACTION
----------------------------------------

1️⃣ **Simplify**
- Output: plain text only.
- Rephrase the selectedText in *simpler, clearer* language, according to the student's level.
- Explain key terms if needed.
- Use short sentences and friendly tone.
- End with a short one-line recap beginning with “In short, …”

---

2️⃣ **Example**
- Output: plain text only.
- Give **1–2 concrete real-world examples** related to the selected concept.
- Each example must be directly tied to the subject.
- Use analogies appropriate for the student’s level.
- End with “This example shows how the concept applies in real life.”

---

3️⃣ **Summarize**
- Output: plain text only.
- Write **3–6 concise bullet points** summarizing the *core meaning* of the selectedText.
- Add one final recap sentence starting with “Overall, …”
- Avoid reusing long sentences from the original.

---

4️⃣ **Diagram**
- Output: JSON only (no markdown or text outside JSON)
- Structure:
{
  "diagram": "graph TD\\nA[Main Concept] --> B[Sub Idea]",
  "nodes": [
    { "id": "A", "label": "Main Concept", "summary": "Short explanation" },
    { "id": "B", "label": "Sub Idea", "summary": "Short explanation" }
  ]
}
- Rules:
  - 3–7 nodes maximum.
  - Use ASCII only (no quotes, accents, emojis).
  - The diagram string must start with \`graph TD\` or \`graph LR\`.
  - If it cannot generate a diagram, return:
    { "diagram": "graph TD\\nA[Error] --> B[Cannot render diagram]", "nodes": [] }

---

5️⃣ **Explain**
- Output: plain text.
- Provide a structured explanation (2–3 paragraphs).
- Begin by clearly defining the concept, then describe why it’s important.
- Include one short analogy or comparison.
- Finish with a one-line encouragement like “You’re grasping an important idea here!”

---

6️⃣ **Quiz**
- Output: JSON only.
- Structure:
{
  "questions": [
    {
      "question": "Question text?",
      "options": ["A) ...","B) ...","C) ...","D) ..."],
      "answer": "C",
      "explanation": "One-sentence reasoning for the correct answer."
    }
  ]
}
- 3–4 questions max.
- Answers must be inferable from \`context\` or \`selectedText\`.
- Output pure JSON (no markdown).

---

7️⃣ **Flashcards**
- Output: JSON only.
- Structure:
{
  "flashcards": [
    {
      "term": "Key Term/Concept",
      "definition": "A concise, clear definition suitable for a flashcard."
    }
  ]
}
- Identify 5-10 of the most important keywords, terms, or concepts from the \`selectedText\`.
- For each term, provide a short, easy-to-understand definition.
- Definitions should be brief enough to fit on the back of a card.
- Output pure JSON (no markdown).

----------------------------------------
### 🧠 GENERAL INSTRUCTIONS
----------------------------------------
- Always tailor the explanation depth and vocabulary to \`studentLevel\` and \`language\`.
- Maintain the requested \`tone\` (Friendly / Academic / Encouraging).
- Never reference this prompt, tools, or previous responses.
- Do not echo the input JSON.
- Keep outputs under 1000 words.
- When \`language\` is not English, translate the final answer naturally into that language.
- For JSON outputs, return *only* valid JSON without extra characters or markdown fences.

----------------------------------------
### ✅ OUTPUT EXPECTATION SUMMARY
----------------------------------------
| Action | Output | Format |
|--------|---------|---------|
| Simplify | Rewritten explanation | Plain text |
| Example | Real-world analogy | Plain text |
| Summarize | 3–6 bullets + recap | Plain text |
| Diagram | Concept map | JSON |
| Explain | Full explanation | Plain text |
| Quiz | Questions & answers | JSON |
| Flashcards | Key terms & definitions | JSON |

----------------------------------------
### EXAMPLES
----------------------------------------

Example Input:
{
  "action": "Simplify",
  "selectedText": "The VAT base consists of all payments a business receives for taxable transactions.",
  "context": "The VAT base corresponds to ...",
  "language": "English",
  "studentLevel": "Beginner",
  "tone": "Friendly",
  "subject": "Economics"
}

Example Output:
"The VAT base means all the money a company gets from sales that are taxed.  
In short, it’s the total amount used to calculate the tax."

---

Example Input:
{
  "action": "Example",
  "selectedText": "Additions to the tax base include fees and taxes related to sales.",
  "context": "...",
  "language": "English",
  "studentLevel": "Intermediate",
  "tone": "Friendly",
  "subject": "Economics"
}

Example Output:
"Imagine a store sells a product for $100, plus $5 shipping and $3 handling fees.  
Those extra costs are added to the taxable base because they relate to the sale.  
This example shows how the concept applies in real life."

---

Example Input:
{
  "action": "Diagram",
  "selectedText": "The VAT base includes all payments subject to tax.",
  "context": "...",
  "language": "English",
  "studentLevel": "Intermediate",
  "tone": "Academic",
  "subject": "Economics"
}

Example Output:
{
  "diagram": "graph TD\\nA[VAT Base] --> B[Payments Received]\\nA --> C[Taxable Transactions]",
  "nodes": [
    { "id": "A", "label": "VAT Base", "summary": "Total value subject to tax" },
    { "id": "B", "label": "Payments Received", "summary": "All sales and service payments" },
    { "id": "C", "label": "Taxable Transactions", "summary": "Activities subject to VAT" }
  ]
}
`;

export const generateStudyAid = async (
    action: EducationalMode,
    selectedText: string,
    context: string,
    personalization: PersonalizationSettings,
    subject: string
): Promise<string | QuizData | DiagramData | FlashcardData> => {
    if (!process.env.API_KEY) throw new Error("API_KEY environment variable not set.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-pro';

    const requestPayload = {
        action,
        selectedText,
        context,
        language: personalization.language,
        studentLevel: personalization.level,
        tone: personalization.tone,
        subject,
    };

    const userPrompt = JSON.stringify(requestPayload, null, 2);
    const expectsJson = action === 'Quiz' || action === 'Diagram' || action === 'Flashcards';

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [{ text: userPrompt }] },
            config: {
                responseMimeType: expectsJson ? 'application/json' : 'text/plain',
                systemInstruction: STUDY_AID_SYSTEM_PROMPT,
            }
        });

        const responseText = response.text.trim();
        
        if (expectsJson) {
            const cleanedJsonText = responseText.replace(/^```json\n?|```$/g, '');
            if (!cleanedJsonText) throw new Error("Received empty JSON response from the AI.");
            const parsed = JSON.parse(cleanedJsonText);

            if (action === 'Diagram' && (!parsed.diagram || !parsed.nodes || !parsed.diagram.includes('-->'))) {
                 return { 
                    diagram: "graph TD\nA[Error] --> B[Cannot render diagram]", 
                    nodes: [],
                    error: "The AI returned an invalid diagram structure."
                };
            }
            if (action === 'Quiz' && !parsed.questions) {
                throw new Error("Invalid quiz data received from the AI.");
            }
            if (action === 'Flashcards' && !parsed.flashcards) {
                throw new Error("Invalid flashcard data received from the AI.");
            }
            return parsed;
        } else {
            return responseText;
        }
    } catch (error) {
        console.error(`Error in generateStudyAid (mode: ${action}):`, error);
        if (action === 'Diagram') {
            return {
                diagram: "graph TD\nA[Error] --> B[Cannot render diagram]",
                nodes: [],
                error: "Failed to generate a diagram from the provided content."
            };
        }
        throw new Error(`Failed to generate content. Error: ${error instanceof Error ? error.message : String(error)}`);
    }
};

// --- NEW DAILY BRIEFING ENGINE ---
const DAILY_BRIEFING_SYSTEM_PROMPT = `You are an encouraging and insightful AI Study Coach for the StudyGen app. Your role is to provide a brief, motivational "Daily Briefing" to students when they start a study session.

Your input will be a JSON object containing the student's first name and a list of up to 3 topics they previously struggled with (rated with low confidence).

Your task is to generate a short, friendly, and actionable message in plain text.

### Rules:
1.  **Address the User:** Start by greeting the user by their first name (e.g., "Welcome back, [Name]!").
2.  **Acknowledge Past Effort:** Positively frame their previous work on the provided "weak topics."
3.  **Suggest a Warm-up:** Propose a quick warm-up quiz on one of the topics to build confidence. Be specific about the topic.
4.  **Be Encouraging:** End with a positive and motivational sentence.
5.  **Keep it Concise:** The entire message should be 2-4 sentences long.

### Example Input:
{
  "userName": "Alex",
  "weakTopics": ["La base imposable", "Le fait générateur"]
}

### Example Output:
"Welcome back, Alex! I noticed 'La base imposable' was a bit tricky yesterday, but you're making great progress. How about we start with a quick 2-question warm-up on that to get your brain buzzing? You've got this!"

### No Weak Topics Scenario:
If the \`weakTopics\` array is empty, just provide a general motivational greeting.

Example Input (No Weak Topics):
{
  "userName": "Maria",
  "weakTopics": []
}

Example Output (No Weak Topics):
"Welcome back, Maria! It's a great day to learn something new. Let's dive in and make some progress!"
`;

export const generateDailyBriefing = async (
    userName: string,
    weakTopics: { title: string }[]
): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY environment variable not set.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const requestPayload = {
        userName,
        weakTopics: weakTopics.map(t => t.title),
    };
    const userPrompt = JSON.stringify(requestPayload, null, 2);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: userPrompt }] },
            config: {
                systemInstruction: DAILY_BRIEFING_SYSTEM_PROMPT,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error('Error generating daily briefing:', error);
        return `Welcome back, ${userName}! Let's get started on your study session.`;
    }
};