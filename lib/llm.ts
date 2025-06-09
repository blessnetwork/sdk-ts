export interface ModelQuantization {
  DEFAULT: string;
  [key: string]: string;
}

export interface ModelsInterface {
  LLAMA_3_2_1B: ModelQuantization;
  LLAMA_3_2_3B: ModelQuantization;
  MISTRAL_7B: ModelQuantization;
  MIXTRAL_8X7B: ModelQuantization;
  GEMMA_2_2B: ModelQuantization;
  GEMMA_2_7B: ModelQuantization;
  GEMMA_2_9B: ModelQuantization;
}

export interface LlmOptions {
  system_message?: string;
  tools_sse_urls?: string[];
  temperature?: number;
  top_p?: number;
}

export interface LlmInstance {
  setOptions(options: LlmOptions): void;
  getOptions(): LlmOptions;
  chat(prompt: string): string;
}

export type BlessLLMType = (model: string) => LlmInstance;

// Wrapper function that calls the global BlessLLM function
export function BlessLLM(model: string): LlmInstance {
  // Access the global BlessLLM function that's provided by the runtime
  const globalBlessLLM = (globalThis as any).BlessLLM as BlessLLMType;
  
  if (!globalBlessLLM) {
      throw new Error('BlessLLM runtime function not available. Make sure you are running in the Blockless environment.');
  }
  
  return globalBlessLLM(model);
}

// Export the MODELS constant that wraps the global MODELS
export const MODELS: ModelsInterface = (globalThis as any).MODELS || {
  LLAMA_3_2_1B: { DEFAULT: '' },
  LLAMA_3_2_3B: { DEFAULT: '' },
  MISTRAL_7B: { DEFAULT: '' },
  MIXTRAL_8X7B: { DEFAULT: '' },
  GEMMA_2_2B: { DEFAULT: '' },
  GEMMA_2_7B: { DEFAULT: '' },
  GEMMA_2_9B: { DEFAULT: '' },
};
