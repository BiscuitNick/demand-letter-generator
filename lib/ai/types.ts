/**
 * AI Pipeline Types and Interfaces
 */

/**
 * Pipeline step types
 */
export type PipelineStep = "extract" | "outline" | "compose";

/**
 * Extracted fact from documents
 */
export interface ExtractedFact {
  text: string;
  sourceFile?: string;
  confidence: number; // 0-1
  category?: string; // e.g., "damages", "liability", "timeline"
}

/**
 * Outline section for demand letter
 */
export interface OutlineSection {
  id: string;
  title: string;
  order: number;
  description?: string;
  suggestedContent?: string;
}

/**
 * Extractor input
 */
export interface ExtractorInput {
  documents: Array<{
    name: string;
    content: string;
    type: string;
  }>;
  instructions?: string;
}

/**
 * Extractor output
 */
export interface ExtractorOutput {
  facts: ExtractedFact[];
  summary: string;
}

/**
 * Outliner input
 */
export interface OutlinerInput {
  facts: ExtractedFact[];
  template?: string;
  instructions?: string;
}

/**
 * Outliner output
 */
export interface OutlinerOutput {
  sections: OutlineSection[];
  reasoning: string;
}

/**
 * Composer input
 */
export interface ComposerInput {
  outline: OutlineSection[];
  facts: ExtractedFact[];
  tone?: "professional" | "assertive" | "empathetic";
  instructions?: string;
}

/**
 * Composer output
 */
export interface ComposerOutput {
  content: string;
  sections: Array<{
    sectionId: string;
    content: string;
  }>;
}

/**
 * Pipeline progress event
 */
export interface PipelineProgressEvent {
  step: PipelineStep;
  status: "started" | "processing" | "completed" | "error";
  message: string;
  data?: unknown;
  error?: string;
}

/**
 * Template for AI prompts
 */
export interface AITemplate {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  userPromptTemplate: string;
  tone?: "professional" | "assertive" | "empathetic";
}
