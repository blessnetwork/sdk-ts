// Type definitions for the models
interface ModelQuantization {
    DEFAULT: string;
    [key: string]: string;
}

interface ModelsInterface {
    LLAMA_3_2_1B: ModelQuantization;
    LLAMA_3_2_3B: ModelQuantization;
    MISTRAL_7B: ModelQuantization;
    MIXTRAL_8X7B: ModelQuantization;
    GEMMA_2_2B: ModelQuantization;
    GEMMA_2_7B: ModelQuantization;
    GEMMA_2_9B: ModelQuantization;
}

// Type definitions for the options
interface LlmOptions {
    system_message: string;
    temperature?: number;
    top_p?: number;
}

// Type definition for the LLM instance
interface LlmInstance {
    setOptions(options: LlmOptions): void;
    getOptions(): LlmOptions;
    chat(prompt: string): string;
    MODELS: ModelsInterface;
}

// Type definition for the BlessLLM constructor
interface BlessLLMConstructor {
    (model: string): LlmInstance;
    MODELS: ModelsInterface;
}

// Declare the global BlessLLM
declare const BlessLLM: BlessLLMConstructor;
declare const MODELS: ModelsInterface;

const supportedModels = JSON.stringify(MODELS, null, 2);
console.log("Supported Models", supportedModels);

// Create instance
const llm = BlessLLM(MODELS.MISTRAL_7B.DEFAULT);

// Set options
llm.setOptions({
  system_message: "You are a helpful assistant. First time I ask, your name will be Lucy. Second time I ask, your name will be Bob."
});

// Get options
const options = llm.getOptions();
console.log("Options", JSON.stringify(options, null, 2));

// Chat
console.log(llm.chat("What is your name?"));
console.log(llm.chat("What is your name?"));
