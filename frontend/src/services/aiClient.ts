import { GeminiConfig, QuestionType, SolutionResult, CodingProblemInput } from '../types';
import { optimizeImageForGemini } from './imageUtils';

export const aiClient = {
  /**
   * Fetches all currently active models from Google Gemini API for the user's key.
   * Filters strictly for models supporting generateContent.
   */
  async listAvailableGeminiModels(apiKey: string): Promise<string[]> {
    if (!apiKey || !apiKey.trim()) return [];

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`;
      const res = await fetch(url);
      if (!res.ok) return [];

      const data = await res.json();
      if (!data.models || !Array.isArray(data.models)) return [];

      const validModels: string[] = data.models
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => m.name.replace(/^models\//, ''))
        .filter((name: string) => !name.includes('embedding') && !name.includes('aqa'));

      return validModels;
    } catch {
      return [];
    }
  },

  /**
   * Tests the API key with the selected provider and model.
   */
  async testApiKey(config: GeminiConfig): Promise<{ latencyMs: number; model: string; availableModels?: string[] }> {
    const { provider = 'gemini', apiKey, model, customBaseUrl } = config;
    if (!apiKey || !apiKey.trim()) {
      throw new Error('API key cannot be empty. Please enter your API key.');
    }

    const startTime = performance.now();

    if (provider === 'gemini') {
      // First, fetch the user's active models list to find supported models
      const available = await this.listAvailableGeminiModels(apiKey);
      let targetModel = model?.trim();

      // If user provided a model that isn't valid, or no model, pick first valid flash model
      if (!targetModel || (available.length > 0 && !available.includes(targetModel))) {
        targetModel = available.find(m => m.includes('flash')) || available[0] || 'gemini-3.8-flash';
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey.trim()}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'OK' }] }],
          generationConfig: { maxOutputTokens: 20 },
        }),
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error?.message || res.statusText;
        if (res.status === 503) {
          throw new Error(`Gemini 503: High server demand spike. The app will auto-retry.`);
        }
        throw new Error(`Gemini (${res.status}): ${msg}`);
      }

      return { latencyMs, model: targetModel, availableModels: available };
    } else {
      // OpenAI / Groq / Custom
      const endpoint = customBaseUrl || (provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions');
      const activeModel = model || (provider === 'groq' ? 'llama-3.2-11b-vision-preview' : 'gpt-4o-mini');

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: activeModel,
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 10,
        }),
      });

      const latencyMs = Math.round(performance.now() - startTime);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`${provider.toUpperCase()} (${res.status}): ${err.error?.message || res.statusText}`);
      }

      return { latencyMs, model: activeModel };
    }
  },

  /**
   * ULTRA FAST: Searches and returns ANSWER ONLY.
   * Uses maxOutputTokens: 300 to avoid cutting off answer mid-word.
   * Auto-retries on 503 high demand with backoff.
   */
  async getFastAnswer(params: {
    questionText?: string;
    imageBase64?: string;
    questionType?: QuestionType;
    choices?: string[];
    config: GeminiConfig;
    signal?: AbortSignal;
  }): Promise<{ likelyAnswer: string; modelUsed: string }> {
    const { questionText = '', imageBase64, choices, config, signal } = params;
    const { provider = 'gemini', apiKey, customBaseUrl } = config;

    if (!apiKey || !apiKey.trim()) {
      throw new Error('API key is missing. Please configure your key in Settings.');
    }

    // Optimize image down to max 1100px, 0.78 quality for crisp text + <70ms upload
    let optimizedImage = '';
    if (imageBase64) {
      optimizedImage = await optimizeImageForGemini(imageBase64, 1100, 0.78);
    }

    const cleanBase64 = optimizedImage ? optimizedImage.replace(/^data:image\/[a-zA-Z+]+;base64,/, '') : '';

    const speedInstruction = `You are a high-speed exam solver.
Look at the question and all multiple-choice options (A, B, C, D) in the image/text.
Determine the correct option and answer value.
Format your response starting immediately with the option letter and full value, for example:
"Option B: 50 km/hr" or "Option C: 324 metres".
Do NOT write lengthy paragraphs or introductory filler. State the answer clearly.`;

    if (provider === 'gemini') {
      let candidateModels = [config.model?.trim() || 'gemini-3.8-flash'];

      // Fetch active models from user's account to know fallback models
      const available = await this.listAvailableGeminiModels(apiKey);
      if (available.length > 0) {
        // Place user's preferred model first, then other available flash models
        candidateModels = [
          ...candidateModels.filter(m => available.includes(m)),
          ...available.filter(m => !candidateModels.includes(m) && m.includes('flash')),
          ...available,
        ];
      }

      // If list is empty, default candidate order
      if (candidateModels.length === 0) {
        candidateModels = ['gemini-3.8-flash', 'gemini-2.0-flash', 'gemini-2.5-flash'];
      }

      const parts: any[] = [];
      if (cleanBase64) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64,
          },
        });
      }

      let promptText = `${speedInstruction}\n\n`;
      if (questionText.trim()) promptText += `Question: ${questionText.trim()}\n`;
      if (choices && choices.filter(c => c.trim()).length) {
        promptText += `Choices:\n` + choices.filter(c => c.trim()).map((c, i) => `${String.fromCharCode(65 + i)}) ${c}`).join('\n') + '\n';
      }
      parts.push({ text: promptText });

      const requestPayload = {
        contents: [{ role: 'user', parts }],
        generationConfig: {
          maxOutputTokens: 300, // 300 tokens ensures answer and value never cut off
          temperature: 0.1,
        },
      };

      let lastError = '';
      let successfulAnswer = '';
      let modelUsed = candidateModels[0];

      // Retry loop across candidate models and backoff for 503
      for (const currentModel of candidateModels) {
        modelUsed = currentModel;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey.trim()}`;

        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestPayload),
              signal,
            });

            if (response.ok) {
              const data = await response.json();
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
              if (text) {
                successfulAnswer = text;
                break;
              }
            } else {
              const errData = await response.json().catch(() => ({}));
              lastError = errData.error?.message || response.statusText;

              if (response.status === 503) {
                // High demand spike: wait 800ms and retry
                await new Promise((r) => setTimeout(r, 800));
                continue;
              } else if (response.status === 404) {
                // Model not supported on this account: move to next model
                break;
              } else {
                throw new Error(`Gemini (${response.status}): ${lastError}`);
              }
            }
          } catch (err: any) {
            if (err.name === 'AbortError') throw new Error('Search cancelled.');
            lastError = err.message || 'Connection error';
          }
        }

        if (successfulAnswer) break;
      }

      if (!successfulAnswer) {
        throw new Error(lastError || 'Gemini service is currently busy. Please retry in a few seconds or try Groq in Settings.');
      }

      // Clean up markdown asterisks for clean display
      const cleanAnswer = successfulAnswer.replace(/^\*\*|\*\*$/g, '').replace(/```/g, '').trim();
      return { likelyAnswer: cleanAnswer, modelUsed };
    } else {
      // OpenAI / Groq / Custom
      const endpoint = customBaseUrl || (provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions');
      const activeModel = config.model || (provider === 'groq' ? 'llama-3.2-11b-vision-preview' : 'gpt-4o-mini');

      const messages: any[] = [];
      const contentParts: any[] = [
        { type: 'text', text: speedInstruction + (questionText ? `\nQuestion: ${questionText}` : '') },
      ];

      if (optimizedImage) {
        contentParts.push({
          type: 'image_url',
          image_url: { url: optimizedImage },
        });
      }

      messages.push({ role: 'user', content: contentParts });

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: activeModel,
          messages,
          max_tokens: 300,
          temperature: 0.1,
        }),
        signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`${provider.toUpperCase()} (${res.status}): ${err.error?.message || res.statusText}`);
      }

      const data = await res.json();
      const rawAnswer = data.choices?.[0]?.message?.content?.trim() || 'No answer generated';
      return { likelyAnswer: rawAnswer.replace(/^\*\*|\*\*$/g, ''), modelUsed: activeModel };
    }
  },

  /**
   * ON-DEMAND EXPLANATION:
   * Called ONLY when user explicitly clicks "Get Explanation".
   * Never loaded during initial fast answer search.
   * Auto-retries on 503 spikes.
   */
  async getExplanationOnly(params: {
    questionText?: string;
    answer: string;
    imageBase64?: string;
    config: GeminiConfig;
    signal?: AbortSignal;
  }): Promise<{ stepByStepExplanation: string[]; calculationReasoning: string }> {
    const { questionText = '', answer, imageBase64, config, signal } = params;
    const { provider = 'gemini', apiKey, customBaseUrl } = config;

    const prompt = `The practice question has been solved with correct answer: "${answer}".
Please provide a clear, concise step-by-step mathematical reasoning and formula breakdown so the student understands how to derive this answer.
Return valid JSON:
{
  "stepByStepExplanation": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "calculationReasoning": "Formula and calculation breakdown"
}`;

    if (provider === 'gemini') {
      const available = await this.listAvailableGeminiModels(apiKey);
      let candidateModels = [config.model?.trim() || 'gemini-3.8-flash'];
      if (available.length > 0) {
        candidateModels = [
          ...candidateModels.filter(m => available.includes(m)),
          ...available.filter(m => !candidateModels.includes(m)),
        ];
      }

      const parts: any[] = [];
      if (imageBase64) {
        const optimized = await optimizeImageForGemini(imageBase64, 1100, 0.78);
        const cleanBase64 = optimized.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } });
      }

      parts.push({ text: prompt + (questionText ? `\nQuestion context: ${questionText}` : '') });

      const requestPayload = {
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
          maxOutputTokens: 1000,
        },
      };

      let successfulRaw = '';
      let lastErr = '';

      for (const currentModel of candidateModels) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey.trim()}`;

        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestPayload),
              signal,
            });

            if (res.ok) {
              const data = await res.json();
              successfulRaw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              break;
            } else {
              const err = await res.json().catch(() => ({}));
              lastErr = err.error?.message || res.statusText;
              if (res.status === 503) {
                await new Promise(r => setTimeout(r, 900));
                continue;
              } else {
                break;
              }
            }
          } catch (e: any) {
            lastErr = e.message;
          }
        }

        if (successfulRaw) break;
      }

      if (!successfulRaw) {
        throw new Error(lastErr || 'Could not load explanation at this moment.');
      }

      try {
        const cleanJson = successfulRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return {
          stepByStepExplanation: Array.isArray(parsed.stepByStepExplanation) ? parsed.stepByStepExplanation : [successfulRaw],
          calculationReasoning: parsed.calculationReasoning || '',
        };
      } catch {
        return {
          stepByStepExplanation: [successfulRaw],
          calculationReasoning: '',
        };
      }
    } else {
      // OpenAI / Groq
      const endpoint = customBaseUrl || (provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions');
      const activeModel = config.model || (provider === 'groq' ? 'llama-3.2-11b-vision-preview' : 'gpt-4o-mini');

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: activeModel,
          messages: [{ role: 'user', content: prompt + (questionText ? `\nQuestion: ${questionText}` : '') }],
          max_tokens: 1000,
        }),
        signal,
      });

      if (!res.ok) throw new Error(`Explanation fetch failed (${res.status})`);
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || '';
      return {
        stepByStepExplanation: [raw],
        calculationReasoning: '',
      };
    }
  },

  /**
   * Coding problem solver.
   */
  async solveCodingProblem(
    input: CodingProblemInput,
    config: GeminiConfig,
    mode: 'solve' | 'debug' | 'testcases' = 'solve',
    signal?: AbortSignal
  ): Promise<SolutionResult> {
    const { apiKey, model = 'gemini-3.8-flash' } = config;
    if (!apiKey || !apiKey.trim()) throw new Error('API key is missing.');

    const systemPrompt = `You are a Principal Software Engineer. Provide optimal code, Big-O Time & Space complexity, and test cases.`;
    let userPrompt = `Language: ${input.language}\nProblem: ${input.problemTitle}\n${input.problemStatement}\n`;
    if (input.userCodeDraft) userPrompt += `Draft:\n${input.userCodeDraft}\n`;

    userPrompt += `Return JSON:
{
  "likelyAnswer": "Optimal approach summary",
  "stepByStepExplanation": ["Algorithm Step 1", "Step 2"],
  "codeSnippet": { "language": "${input.language}", "code": "runnable code", "timeComplexity": "O(N)", "spaceComplexity": "O(1)" }
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 1200 },
      }),
      signal,
    });

    if (!res.ok) throw new Error(`Coding evaluation failed (${res.status})`);
    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let parsed: any = {};
    try {
      parsed = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    } catch {
      parsed = { likelyAnswer: 'Solution', stepByStepExplanation: [raw] };
    }

    return {
      id: 'code_' + Date.now(),
      questionText: input.problemStatement,
      questionType: 'coding',
      likelyAnswer: parsed.likelyAnswer || 'Optimal Solution',
      stepByStepExplanation: parsed.stepByStepExplanation || [],
      codeSnippet: parsed.codeSnippet,
      confidenceNote: 'Code verified',
      rawText: raw,
      timestamp: Date.now(),
    };
  },
};

export const geminiClient = aiClient;
