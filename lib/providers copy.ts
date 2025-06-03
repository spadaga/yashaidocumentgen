// Provider configurations and model definitions
export const PROVIDER_MODELS = {
    groq: [
      { name: "llama-3.3-70b-versatile", maxTokens: 10000, description: "Meta Llama 3.3 70B - Most Capable" },
      { name: "llama-3.1-8b-instant", maxTokens: 5000, description: "Meta Llama 3.1 8B - Ultra Fast" },
      { name: "gemma2-9b-it", maxTokens: 12000, description: "Google Gemma 2 9B - Balanced" },
      { name: "llama3-8b-8192", maxTokens: 5000, description: "Llama 3 8B - Reliable" },
      { name: "llama3-70b-8192", maxTokens: 5000, description: "Llama 3 70B - Powerful" },
    ],
    deepinfra: [
      { name: "meta-llama/Llama-3.3-70B-Instruct", maxTokens: 8000, description: "Llama 3.3 70B - Latest" },
      { name: "meta-llama/Llama-3.1-8B-Instruct", maxTokens: 6000, description: "Llama 3.1 8B - Fast" },
      { name: "microsoft/WizardLM-2-8x22B", maxTokens: 10000, description: "WizardLM 2 - Advanced Reasoning" },
      { name: "Qwen/Qwen2.5-72B-Instruct", maxTokens: 8000, description: "Qwen 2.5 72B - Multilingual" },
      { name: "nvidia/Llama-3.1-Nemotron-70B-Instruct", maxTokens: 8000, description: "Nemotron 70B - NVIDIA" },
    ],
    together: [
      { name: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo", maxTokens: 8000, description: "Llama 3.2 Vision" },
      { name: "meta-llama/Llama-3.1-8B-Instruct-Turbo", maxTokens: 6000, description: "Llama 3.1 8B Turbo" },
      { name: "Qwen/Qwen2.5-7B-Instruct-Turbo", maxTokens: 6000, description: "Qwen 2.5 7B Turbo" },
      { name: "meta-llama/Llama-3.1-70B-Instruct-Turbo", maxTokens: 8000, description: "Llama 3.1 70B Turbo" },
      { name: "mistralai/Mixtral-8x7B-Instruct-v0.1", maxTokens: 6000, description: "Mixtral 8x7B" },
    ],
    fireworks: [
      { name: "accounts/fireworks/models/llama-v3p1-8b-instruct", maxTokens: 6000, description: "Llama 3.1 8B" },
      { name: "accounts/fireworks/models/qwen2p5-7b-instruct", maxTokens: 6000, description: "Qwen 2.5 7B" },
      { name: "accounts/fireworks/models/llama-v3p1-70b-instruct", maxTokens: 8000, description: "Llama 3.1 70B" },
      { name: "accounts/fireworks/models/mixtral-8x7b-instruct", maxTokens: 6000, description: "Mixtral 8x7B" },
    ],
    cerebras: [
      { name: "llama3.1-8b", maxTokens: 5000, description: "Llama 3.1 8B - Ultra Fast" },
      { name: "llama3.3-70b", maxTokens: 8000, description: "Llama 3.3 70B - Powerful" },
      { name: "llama3.1-70b", maxTokens: 8000, description: "Llama 3.1 70B - Balanced" },
    ],
    openrouter: [
      { name: "meta-llama/llama-3.1-8b-instruct:free", maxTokens: 5000, description: "Llama 3.1 8B (Free)" },
      { name: "microsoft/wizardlm-2-8x22b:free", maxTokens: 8000, description: "WizardLM 2 (Free)" },
      { name: "google/gemma-2-9b-it:free", maxTokens: 6000, description: "Gemma 2 9B (Free)" },
      { name: "qwen/qwen-2.5-7b-instruct:free", maxTokens: 6000, description: "Qwen 2.5 7B (Free)" },
    ],
    xai: [
      { name: "grok-beta", maxTokens: 10000, description: "Grok Beta - Latest" },
      { name: "grok-vision-beta", maxTokens: 8000, description: "Grok Vision - Multimodal" },
    ],
  }
  
  export const PROVIDER_INFO = {
    groq: {
      name: "Groq",
      description: "Ultra-fast inference with generous free tier",
      website: "console.groq.com",
    },
    deepinfra: {
      name: "DeepInfra",
      description: "Good free tier with diverse models",
      website: "deepinfra.com",
    },
    together: {
      name: "Together.ai",
      description: "Free credits with vision models",
      website: "together.ai",
    },
    fireworks: {
      name: "Fireworks.ai",
      description: "Fast inference with free tier",
      website: "fireworks.ai",
    },
    cerebras: {
      name: "Cerebras",
      description: "World's fastest inference",
      website: "cerebras.ai",
    },
    openrouter: {
      name: "OpenRouter",
      description: "Access to many providers",
      website: "openrouter.ai",
    },
    xai: {
      name: "xAI",
      description: "Grok models by Elon Musk",
      website: "x.ai",
    },
  }
