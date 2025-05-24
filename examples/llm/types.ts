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

// Declare runtime globals
declare global {
    const BlessLLM: BlessLLMType;
    const MODELS: ModelsInterface;
}
