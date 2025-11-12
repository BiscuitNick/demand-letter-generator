import OpenAI from "openai";
import type {
  ExtractorInput,
  ExtractorOutput,
  OutlinerInput,
  OutlinerOutput,
  ComposerInput,
  ComposerOutput,
  ExtractedFact,
} from "./types";
import {
  EXTRACTOR_SYSTEM_PROMPT,
  EXTRACTOR_USER_PROMPT,
  OUTLINER_SYSTEM_PROMPT,
  OUTLINER_USER_PROMPT,
  COMPOSER_SYSTEM_PROMPT,
  COMPOSER_USER_PROMPT,
} from "./prompts";

/**
 * Initialize OpenAI client
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extract facts from documents using GPT-4
 */
export async function extractFacts(
  input: ExtractorInput
): Promise<ExtractorOutput> {
  // Format documents for the prompt
  const documentsText = input.documents
    .map((doc, idx) => {
      return `--- Document ${idx + 1}: ${doc.name} ---\n${doc.content}\n`;
    })
    .join("\n");

  const userPrompt = EXTRACTOR_USER_PROMPT.replace("{{DOCUMENTS}}", documentsText)
    .replace(
      "{{INSTRUCTIONS}}",
      input.instructions
        ? `Additional instructions: ${input.instructions}`
        : ""
    );

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: EXTRACTOR_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3, // Lower temperature for more factual extraction
  });

  const responseText = completion.choices[0].message.content || "{}";
  const parsed = JSON.parse(responseText);

  // Normalize the response
  const facts: ExtractedFact[] = Array.isArray(parsed.facts)
    ? parsed.facts
    : [];

  return {
    facts: facts.map((fact) => ({
      text: fact.text || "",
      sourceFile: fact.sourceFile,
      confidence: fact.confidence || 0.8,
      category: fact.category,
    })),
    summary: parsed.summary || "Facts extracted from provided documents.",
  };
}

/**
 * Generate outline from extracted facts using GPT-4
 */
export async function generateOutline(
  input: OutlinerInput
): Promise<OutlinerOutput> {
  // Format facts for the prompt
  const factsText = input.facts
    .map((fact, idx) => {
      return `${idx + 1}. [${fact.category || "general"}] ${fact.text} (confidence: ${fact.confidence})`;
    })
    .join("\n");

  const userPrompt = OUTLINER_USER_PROMPT.replace("{{FACTS}}", factsText).replace(
    "{{INSTRUCTIONS}}",
    input.instructions ? `Additional instructions: ${input.instructions}` : ""
  );

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: OUTLINER_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.5, // Moderate creativity for structure
  });

  const responseText = completion.choices[0].message.content || "{}";
  const parsed = JSON.parse(responseText);

  return {
    sections: Array.isArray(parsed.sections) ? parsed.sections : [],
    reasoning: parsed.reasoning || "Outline generated based on extracted facts.",
  };
}

/**
 * Compose demand letter from outline and facts using GPT-4
 */
export async function composeLetter(
  input: ComposerInput
): Promise<ComposerOutput> {
  // Format outline for the prompt
  const outlineText = input.outline
    .map((section) => {
      return `${section.order}. ${section.title}\n   ${section.description || ""}\n   ${section.suggestedContent || ""}`;
    })
    .join("\n\n");

  // Format facts for the prompt
  const factsText = input.facts
    .map((fact) => {
      return `- ${fact.text}${fact.sourceFile ? ` (Source: ${fact.sourceFile})` : ""}`;
    })
    .join("\n");

  // Build tone instructions
  const toneInstructions = input.tonePrompt
    ? input.tonePrompt
    : `Use a ${input.tone || "professional"} tone.`;

  const userPrompt = COMPOSER_USER_PROMPT.replace("{{OUTLINE}}", outlineText)
    .replace("{{FACTS}}", factsText)
    .replace("{{TONE}}", toneInstructions)
    .replace(
      "{{INSTRUCTIONS}}",
      input.instructions ? `Additional instructions: ${input.instructions}` : ""
    );

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: COMPOSER_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7, // Higher creativity for natural writing
  });

  const content = completion.choices[0].message.content || "";

  // Parse sections from the composed letter (try to match outline sections)
  const sections = input.outline.map((section) => ({
    sectionId: section.id,
    content: "", // Would need more sophisticated parsing to extract section content
  }));

  return {
    content,
    sections,
  };
}
