export type QuestionType =
  | 'auto'
  | 'aptitude'
  | 'logical'
  | 'verbal'
  | 'coding'
  | 'sql'
  | 'other';

export type InputMode = 'image' | 'text' | 'camera';

export type AiProvider = 'gemini' | 'openai' | 'groq' | 'custom';

export type GeminiModel =
  | 'gemini-1.5-flash'
  | 'gemini-3.8-flash'
  | 'gemini-2.5-flash'
  | 'gemini-1.5-pro'
  | string;

export interface GeminiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  customBaseUrl?: string;
  storageType: 'session' | 'local';
}

export interface SolutionResult {
  id: string;
  questionText: string;
  questionType: QuestionType;
  imageBase64?: string;
  likelyAnswer: string;
  stepByStepExplanation: string[];
  calculationReasoning?: string;
  codeSnippet?: {
    language: string;
    code: string;
    timeComplexity?: string;
    spaceComplexity?: string;
  };
  testCases?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  confidenceNote: string;
  keyFormulasOrTricks?: string[];
  uncertaintyNotes?: string;
  rawText: string;
  timestamp: number;
}

export interface BatchQuestionItem {
  id: string;
  imagePreview?: string;
  questionText?: string;
  answer?: string;
  explanation?: string[];
  calculation?: string;
  status: 'pending' | 'solving' | 'done' | 'error';
  isLoadingExplanation?: boolean;
  error?: string;
  timestamp: number;
}

export interface HistoryItem {
  id: string;
  title: string;
  questionType: QuestionType;
  questionText: string;
  imageBase64?: string;
  solution: SolutionResult;
  timestamp: number;
  bookmarked: boolean;
}

export interface CodingProblemInput {
  language: string;
  problemTitle: string;
  problemStatement: string;
  constraints: string;
  sampleInput: string;
  sampleOutput: string;
  userCodeDraft?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}
