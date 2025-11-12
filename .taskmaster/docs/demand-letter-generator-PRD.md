# Product Requirements Document (PRD)

## Project Overview

**Project:** Demand Letter Generator  
**Organization:** Steno  
**Project ID:** 8mKWMdtQ1jdYzU0cVQPV_1762206474285  
**Stage:** Engineering-Ready (MVP)

---

## 1. Executive Summary

The **Demand Letter Generator** is an AI-powered web application designed to automate the drafting of demand letters for law firms. Built as a Next.js + Firebase + OpenAI system, it allows attorneys to upload source materials, extract factual information, generate outlines, and produce refined demand letters collaboratively in real time.

This MVP aims to demonstrate the end-to-end flow of document generation, live editing, and export functionality using modern web and AI technologies.

---

## 2. Goals & Success Metrics

### Goals
- Reduce attorney drafting time through automated letter generation.
- Showcase multi-step AI orchestration with user review and editing.
- Enable collaborative, Google Docs–style editing of generated drafts.

### Success Metrics
- Time-to-draft reduced by 50% compared to manual creation.
- Seamless multi-user collaboration with minimal sync conflicts.
- High generation accuracy and coherence across letter sections.

---

## 3. Target Users

| Role | Description | Primary Needs |
|------|--------------|----------------|
| **Attorney** | Drafts and reviews legal documents | Efficient generation, customization, export |
| **Paralegal** | Assists in editing and fact-checking | Collaboration, annotation, clarity |

---

## 4. Core User Stories

1. **As an attorney**, I want to upload multiple source files (PDFs, Word docs, text) to automatically generate a first draft.
2. **As an attorney**, I want to view and edit AI-generated drafts in real time.
3. **As a paralegal**, I want to leave inline comments for review.
4. **As a user**, I want to export the final draft to `.docx`, `.pdf`, or `.txt`.
5. **As a user**, I want to duplicate a document to create a new version.

---

## 5. System Architecture

### Overview

```
┌──────────────────────────────┐
│         Frontend (Next.js)   │
│  - React Components          │
│  - Multi-Step Workflow       │
│  - Collaborative Editor      │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  API Routes (/api/*)         │
│  - Document Upload Handler   │
│  - AI Orchestration Handler  │
│  - Export & Template APIs    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Firebase Backend             │
│  - Firestore (docs, users)    │
│  - Storage (file uploads)     │
│  - Auth (session mgmt)        │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  OpenAI (GPT-4o via Vercel)  │
│  - Fact Extraction            │
│  - Outline Generation         │
│  - Draft Composition          │
│  - Refinement Steps           │
└──────────────────────────────┘
```

---

## 6. AI Orchestration Flow

### Step Breakdown

1. **Fact Extraction:**
   - Model analyzes uploaded documents.
   - Extracts structured facts (e.g., incident details, injuries, damages).
   - Returns JSON structure for review.

2. **Outline Generation:**
   - GPT-4o creates a section outline using extracted data.
   - Sections: Introduction, Liability, Damages, Conclusion.

3. **Draft Generation:**
   - Full letter generated from outline and selected tone/template.
   - Supports custom tone (professional, assertive, empathetic, etc.).

4. **Refinement:**
   - Users can request specific changes ("make tone more formal", etc.).
   - AI refines content without regenerating entire document.

5. **Collaboration & Annotation:**
   - Multi-user live editing with CRDT synchronization.
   - Inline sidebar comments and discussion threads.

6. **Export:**
   - Output to `.docx`, `.pdf`, or `.txt`.
   - Last saved version retained; users can duplicate to start a new version.

### AI Task Segmentation

| LLM Task | Description | Agent Responsibility |
|-----------|--------------|----------------------|
| `Extractor` | Parse documents, extract structured facts | Tokenize + summarize input files |
| `Outliner` | Build section structure based on facts | Compose high-level organization |
| `Composer` | Write full draft using prompt template | Generate cohesive text output |
| `Refiner` | Modify tone/style upon request | Apply stylistic transformations |
| `Reviewer` | Summarize differences between versions | Provide change summaries |

---

## 7. Functional Requirements

### P0: Must Have
- Multi-file upload (PDF, DOCX, TXT)
- AI-driven fact extraction, outline, and draft generation
- Live collaborative editing
- Inline comment annotations
- Export to `.docx`, `.pdf`, `.txt`
- Firebase Auth user sessions

### P1: Should Have
- Template creation and editing
- Clone document functionality ("Save as New Version")

### P2: Nice to Have
- Style/tone presets selectable from UI
- Rich-text editor features (headers, lists, bold/italic)

---

## 8. Non-Functional Requirements

| Category | Requirement |
|-----------|-------------|
| **Performance** | AI response under 5 seconds; sync under 250ms |
| **Scalability** | Support 100 concurrent editing sessions |
| **Reliability** | Auto-save every 5 seconds |
| **Security (MVP)** | Firebase Auth; no encryption required |
| **Compliance** | N/A (demo only) |

---

## 9. Data Model (Firestore Schema)

### Collections

#### `/users/{userId}`
```json
{
  "email": "user@example.com",
  "displayName": "Jane Attorney",
  "createdAt": "2025-11-11T00:00:00Z"
}
```

#### `/documents/{docId}`
```json
{
  "title": "Smith v. Jones Demand Letter",
  "ownerId": "userId",
  "collaborators": ["uid2", "uid3"],
  "createdAt": "2025-11-11T00:00:00Z",
  "updatedAt": "2025-11-11T01:23:00Z",
  "status": "draft", // or 'final'
  "content": "<rich-text-json>",
  "facts": {"incidentDate": "...", "injuries": ["..."]},
  "outline": ["Introduction", "Liability", "Damages", "Conclusion"]
}
```

#### `/templates/{templateId}`
```json
{
  "name": "Default Demand Letter Template",
  "tone": "Professional",
  "systemPrompt": "You are a legal assistant drafting demand letters...",
  "userPrompts": ["Empathetic tone", "Formal structure"],
  "createdBy": "userId"
}
```

#### `/comments/{commentId}`
```json
{
  "docId": "documentId",
  "authorId": "userId",
  "text": "Please clarify damages section.",
  "position": {"start": 123, "end": 180},
  "resolved": false,
  "createdAt": "2025-11-11T01:40:00Z"
}
```

---

## 10. API Endpoints (Next.js /api Routes)

### `POST /api/upload`
Handles file uploads to Firebase Storage.
```ts
Request: { files: File[] }
Response: { urls: string[] }
```

### `POST /api/generate`
Triggers multi-step AI orchestration.
```ts
Request: {
  docId: string,
  steps: ["extract", "outline", "compose"],
  promptTemplateId: string
}
Response: {
  facts?: object,
  outline?: string[],
  draft?: string
}
```

### `POST /api/refine`
Applies user-specific refinements to AI output.
```ts
Request: { docId: string, instructions: string }
Response: { updatedDraft: string }
```

### `GET /api/export`
Generates downloadable output in chosen format.
```ts
Query: ?docId=abc&format=pdf|docx|txt
Response: binary blob
```

### `POST /api/clone`
Creates a duplicate of an existing document.
```ts
Request: { docId: string, newTitle?: string }
Response: { newDocId: string }
```

---

## 11. User Experience Flow

```
[Login] → [Upload Files] → [AI Extraction]
      ↓          ↓
   [Outline] → [Draft Generation]
      ↓          ↓
 [Collaborative Editing + Comments]
      ↓
 [Export to .docx / .pdf / .txt]
```

### Editor Interface
- Left pane: Live document editor (real-time synced)
- Right sidebar: Comment threads + AI refinement input
- Top toolbar: Export, Clone, Template, and Style controls

---

## 12. LLM System Prompts

### System Prompt (Hard-Coded)
```
You are an expert legal assistant who drafts professional demand letters.
Use clear, persuasive, and legally appropriate language.
Respect the structure of: Introduction → Liability → Damages → Conclusion.
Output should be cohesive, formal, and human-readable.
```

### Dynamic User Prompt Example
```
{"tone": "Empathetic", "style": "Formal", "notes": "Highlight emotional impact of injuries."}
```

---

## 13. Future Extensions (Post-MVP)

- Integration with Steno’s internal systems (case management, client CRM)
- Template marketplace for different case types
- Advanced version history and diff visualization
- Named entity recognition for automated citation insertion

---

## 14. Appendix: Development Notes

- **Framework:** Next.js 14 (App Router) + TypeScript
- **AI SDK:** `@vercel/ai` with OpenAI GPT-4o
- **Database & Storage:** Firebase Firestore + Firebase Storage
- **Auth:** Firebase Auth (Google & Email providers)
- **Real-time Editing:** Firestore listeners + CRDT sync model
- **Export Handling:** `docx`, `pdf-lib`, and native string download
- **Styling:** Tailwind CSS + shadcn/ui (Radix primitives); use shadcn conventions for theming and dark mode


### UI Components (Tailwind + shadcn/ui)
- **Component Library:** Use `shadcn/ui` built on Radix primitives with Tailwind CSS.
- **Theming:** Implement `ThemeProvider` with system + light/dark modes; tokens mapped via Tailwind config.
- **Accessibility:** Prefer Radix components for focus management, keyboard nav, and ARIA.
- **Core Components to Use:**
  - **Layout & Navigation:** `Card`, `ScrollArea`, `Tabs`, `Dialog`, `Drawer`, `DropdownMenu`, `Popover`, `Tooltip`, `Breadcrumb`.
  - **Forms:** `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `RadioGroup`, `Label`, `Form` helpers with `react-hook-form`.
  - **Feedback:** `Toast` (sonner), `Alert`, `Badge`, `Skeleton`, `Progress`.
  - **Editor Toolbar:** `Button`, `Toggle`, `Separator`, `DropdownMenu`, `Popover`.
  - **Data Display:** `Table`, `Accordion`, `Collapsible`.
- **Icons:** `lucide-react` (consistent 16/20/24 sizing via Tailwind utilities).


---

**End of PRD — Engineering-Ready Document**

