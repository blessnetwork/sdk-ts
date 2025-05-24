// Create instance
const llm = BlessLLM("Llama-3.1-8B-Instruct-q4f16_1-MLC");

// Set options
llm.setOptions({
  tools_sse_urls: [
    "http://localhost:3001/sse",
  ],
});

// Chat
console.log(llm.chat("Add the following numbers: 1215, 2213"));
