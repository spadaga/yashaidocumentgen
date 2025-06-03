// Provider configurations and model definitions - Expanded with all free AI providers
export const PROVIDER_MODELS = {
    groq: [
      {
        name: "llama-3.3-70b-versatile",
        maxTokens: 12000,
        description: "Meta Llama 3.3 70B - Most Capable (Vercel Integrated)",
      },
      {
        name: "llama-3.1-8b-instant",
        maxTokens: 8000,
        description: "Meta Llama 3.1 8B - Ultra Fast (Vercel Integrated)",
      },
      { name: "gemma2-9b-it", maxTokens: 10000, description: "Google Gemma 2 9B - Balanced Performance" },
      { name: "qwen-qwq-32b", maxTokens: 10000, description: "Google Gemma 2 9B - Balanced Performance" },
      { name: "llama3-70b-8192", maxTokens: 8000, description: "Llama 3 70B - High Performance" },
      { name: "mixtral-8x7b-32768", maxTokens: 15000, description: "Mixtral 8x7B - Advanced Reasoning" },
    ],
    openai: [
      { name: "gpt-4o-mini", maxTokens: 8000, description: "GPT-4o Mini - Cost Effective" },
      { name: "gpt-3.5-turbo", maxTokens: 4000, description: "GPT-3.5 Turbo - Fast and Reliable" },
      { name: "gpt-4", maxTokens: 8000, description: "GPT-4 - Most Capable" },
      { name: "gpt-4-turbo", maxTokens: 8000, description: "GPT-4 Turbo - Enhanced Performance" },
    ],
    deepinfra: [
      { name: "meta-llama/Llama-3.3-70B-Instruct", maxTokens: 8000, description: "Llama 3.3 70B - Latest Model" },
      { name: "meta-llama/Llama-3.1-8B-Instruct", maxTokens: 6000, description: "Llama 3.1 8B - Fast Generation" },
      { name: "microsoft/WizardLM-2-8x22B", maxTokens: 10000, description: "WizardLM 2 - Advanced Reasoning" },
      { name: "Qwen/Qwen2.5-72B-Instruct", maxTokens: 8000, description: "Qwen 2.5 72B - Multilingual Support" },
      { name: "nvidia/Llama-3.1-Nemotron-70B-Instruct", maxTokens: 8000, description: "Nemotron 70B - NVIDIA Optimized" },
    ],
    together: [
      {
        name: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
        maxTokens: 8000,
        description: "Llama 3.2 Vision - Multimodal",
      },
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
      { name: "llama3.1-8b", maxTokens: 5000, description: "Llama 3.1 8B - Ultra Fast Inference" },
      { name: "llama3.3-70b", maxTokens: 8000, description: "Llama 3.3 70B - High Performance" },
      { name: "llama3.1-70b", maxTokens: 8000, description: "Llama 3.1 70B - Balanced Performance" },
    ],
    openrouter: [
      { name: "meta-llama/llama-3.1-8b-instruct:free", maxTokens: 5000, description: "Llama 3.1 8B (Free Tier)" },
      { name: "microsoft/wizardlm-2-8x22b:free", maxTokens: 8000, description: "WizardLM 2 (Free Tier)" },
      { name: "google/gemma-2-9b-it:free", maxTokens: 6000, description: "Gemma 2 9B (Free Tier)" },
      { name: "qwen/qwen-2.5-7b-instruct:free", maxTokens: 6000, description: "Qwen 2.5 7B (Free Tier)" },
      { name: "anthropic/claude-3-haiku:beta", maxTokens: 8000, description: "Claude 3 Haiku (Beta)" },
      { name: "nousresearch/nous-capybara-7b:free", maxTokens: 6000, description: "Nous Capybara 7B (Free)" },
    { name: "mistralai/mistral-7b-instruct:free", maxTokens: 6000, description: "Mistral 7B (Free)" },
    { name: "openchat/openchat-7b:free", maxTokens: 6000, description: "OpenChat 7B (Free)" },
    { name: "gryphe/mythomist-7b:free", maxTokens: 6000, description: "MythoMist 7B (Free)" },
    { name: "undi95/toppy-m-7b:free", maxTokens: 6000, description: "Toppy M 7B (Free)" },
    ],
    xai: [
      { name: "grok-beta", maxTokens: 10000, description: "Grok Beta - Latest xAI Model" },
      { name: "grok-vision-beta", maxTokens: 8000, description: "Grok Vision - Multimodal Capabilities" },
      { name: "grok-2-latest", maxTokens: 8000, description: "Grok Vision - Multimodal Capabilities" },
    ],
    huggingface: [
      { name: "microsoft/DialoGPT-large", maxTokens: 4000, description: "DialoGPT Large - Conversational AI" },
      { name: "microsoft/DialoGPT-medium", maxTokens: 3000, description: "DialoGPT Medium - Balanced Performance" },
      { name: "google/flan-t5-large", maxTokens: 4000, description: "FLAN-T5 Large - Instruction Following" },
      { name: "bigscience/bloom-7b1", maxTokens: 5000, description: "BLOOM 7B - Multilingual Model" },
     
      { name: "microsoft/CodeBERT-base", maxTokens: 6000, description: "CodeBERT Base - Code Focused" },
      { name: "Salesforce/codegen-350M-mono", maxTokens: 4000, description: "CodeGen 350M - Code Generation" },
      { name: "bigcode/starcoder", maxTokens: 8000, description: "StarCoder - Code Expert" },
    ],
    mistral: [
      { name: "mistral-tiny", maxTokens: 4000, description: "Mistral Tiny - Fast and Efficient" },
      { name: "mistral-small", maxTokens: 6000, description: "Mistral Small - Balanced Performance" },
      { name: "mistral-medium", maxTokens: 8000, description: "Mistral Medium - High Quality" },
      { name: "open-mistral-7b", maxTokens: 5000, description: "Open Mistral 7B - Open Source" },
    ],
    replicate: [
      { name: "meta/llama-2-70b-chat", maxTokens: 8000, description: "Llama 2 70B Chat - Conversational" },
      { name: "meta/llama-2-13b-chat", maxTokens: 6000, description: "Llama 2 13B Chat - Efficient" },
      { name: "meta/llama-2-7b-chat", maxTokens: 4000, description: "Llama 2 7B Chat - Fast" },
      { name: "mistralai/mixtral-8x7b-instruct-v0.1", maxTokens: 6000, description: "Mixtral 8x7B Instruct" },
      { name: "togethercomputer/llama-2-7b-chat", maxTokens: 6000, description: "Llama 2 7B Together - Free" },
    ],
    perplexity: [
      { name: "llama-3.1-sonar-small-128k-online", maxTokens: 8000, description: "Sonar Small - Online Search" },
      { name: "llama-3.1-sonar-large-128k-online", maxTokens: 10000, description: "Sonar Large - Online Search" },
      { name: "llama-3.1-8b-instruct", maxTokens: 6000, description: "Llama 3.1 8B Instruct" },
      { name: "llama-3.1-70b-instruct", maxTokens: 8000, description: "Llama 3.1 70B Instruct" },
    ],
    anyscale: [
      { name: "meta-llama/Llama-2-7b-chat-hf", maxTokens: 4000, description: "Llama 2 7B Chat" },
      { name: "meta-llama/Llama-2-13b-chat-hf", maxTokens: 6000, description: "Llama 2 13B Chat" },
      { name: "meta-llama/Llama-2-70b-chat-hf", maxTokens: 8000, description: "Llama 2 70B Chat" },
      { name: "codellama/CodeLlama-34b-Instruct-hf", maxTokens: 6000, description: "Code Llama 34B Instruct" },
      
      
     
      { name: "mistralai/Mistral-7B-Instruct-v0.1", maxTokens: 6000, description: "Mistral 7B - Anyscale Free" },
    ],
    cohere: [
      { name: "command", maxTokens: 4000, description: "Command - General Purpose" },
      { name: "command-light", maxTokens: 3000, description: "Command Light - Fast and Efficient" },
      { name: "command-nightly", maxTokens: 5000, description: "Command Nightly - Latest Features" },
      { name: "command-r", maxTokens: 6000, description: "Command R - Enhanced Reasoning" },
      
      
    ],
    // NEW PROVIDERS - MISSING FROM YOUR CODE
  anthropic: [
    { name: "claude-3-5-sonnet-20241022", maxTokens: 8000, description: "Claude 3.5 Sonnet - Most Capable" },
    { name: "claude-3-haiku-20240307", maxTokens: 6000, description: "Claude 3 Haiku - Fast and Efficient" },
    { name: "claude-3-opus-20240229", maxTokens: 8000, description: "Claude 3 Opus - Most Powerful" },
    { name: "claude-3-sonnet-20240229", maxTokens: 8000, description: "Claude 3 Sonnet - Balanced Performance" },
  ],
  gemini: [
    { name: "gemini-1.5-flash", maxTokens: 8000, description: "Gemini 1.5 Flash - Fast and Free" },
    { name: "gemini-1.5-pro", maxTokens: 8000, description: "Gemini 1.5 Pro - Most Capable" },
    { name: "gemini-pro", maxTokens: 6000, description: "Gemini Pro - Balanced Performance" },
    { name: "gemini-pro-vision", maxTokens: 6000, description: "Gemini Pro Vision - Multimodal" },
  ],
  aleph: [
    { name: "luminous-base", maxTokens: 4000, description: "Luminous Base - Multilingual Foundation" },
    { name: "luminous-extended", maxTokens: 6000, description: "Luminous Extended - Enhanced Capabilities" },
    { name: "luminous-supreme", maxTokens: 8000, description: "Luminous Supreme - Most Advanced" },
    { name: "luminous-supreme-control", maxTokens: 8000, description: "Luminous Supreme Control - Fine-tuned" },
  ],
  stability: [
    { name: "stable-code-instruct-3b", maxTokens: 6000, description: "Stable Code Instruct 3B - Code Generation" },
    { name: "stablelm-2-1_6b", maxTokens: 4000, description: "StableLM 2 1.6B - Lightweight Model" },
    { name: "stablelm-2-12b", maxTokens: 6000, description: "StableLM 2 12B - Balanced Performance" },
    { name: "stable-beluga-7b", maxTokens: 6000, description: "Stable Beluga 7B - Instruction Following" },
  ],
  claude: [
    { name: "claude-3-5-sonnet-20241022", maxTokens: 8000, description: "Claude 3.5 Sonnet - Latest Version" },
    { name: "claude-3-haiku-20240307", maxTokens: 6000, description: "Claude 3 Haiku - Fast Response" },
    { name: "claude-3-opus-20240229", maxTokens: 8000, description: "Claude 3 Opus - Maximum Capability" },
  ],
  ollama: [
    { name: "llama3.2:3b", maxTokens: 6000, description: "Llama 3.2 3B - Local, Fast, Free" },
    { name: "llama3.2:1b", maxTokens: 4000, description: "Llama 3.2 1B - Ultra Fast Local" },
    { name: "codellama:7b", maxTokens: 6000, description: "Code Llama 7B - Local Code Expert" },
    { name: "mistral:7b", maxTokens: 6000, description: "Mistral 7B - Local Multilingual" },
    { name: "qwen2.5:7b", maxTokens: 6000, description: "Qwen 2.5 7B - Local Advanced" },
    { name: "gemma2:2b", maxTokens: 4000, description: "Gemma 2 2B - Local Lightweight" },
  ],
  }
  
  export const PROVIDER_INFO = {
    groq: {
      name: "Groq",
      description: "Ultra-fast inference with Vercel integration - Recommended",
      website: "console.groq.com",
      integrated: true,
    },
    openai: {
      name: "OpenAI",
      description: "Industry-leading models with high quality output",
      website: "platform.openai.com",
      integrated: false,
    },
    deepinfra: {
      name: "DeepInfra",
      description: "Good free tier with diverse model selection",
      website: "deepinfra.com",
      integrated: false,
    },
    together: {
      name: "Together.ai",
      description: "Free credits with vision model support",
      website: "together.ai",
      integrated: false,
    },
    fireworks: {
      name: "Fireworks.ai",
      description: "Fast inference with competitive pricing",
      website: "fireworks.ai",
      integrated: false,
    },
    cerebras: {
      name: "Cerebras",
      description: "World's fastest inference speeds",
      website: "cerebras.ai",
      integrated: false,
    },
    openrouter: {
      name: "OpenRouter",
      description: "Access to multiple providers through one API",
      website: "openrouter.ai",
      integrated: false,
    },
    xai: {
      name: "xAI",
      description: "Grok models by Elon Musk's xAI",
      website: "x.ai",
      integrated: false,
    },
    huggingface: {
      name: "Hugging Face",
      description: "Open-source models and community-driven AI",
      website: "huggingface.co",
      integrated: false,
    },
    mistral: {
      name: "Mistral AI",
      description: "European AI with strong multilingual capabilities",
      website: "console.mistral.ai",
      integrated: false,
    },
    replicate: {
      name: "Replicate",
      description: "Run open-source models in the cloud",
      website: "replicate.com",
      integrated: false,
    },
    perplexity: {
      name: "Perplexity",
      description: "AI with real-time web search capabilities",
      website: "perplexity.ai",
      integrated: false,
    },
    anyscale: {
      name: "Anyscale",
      description: "Scalable AI infrastructure and models",
      website: "console.anyscale.com",
      integrated: false,
    },
    cohere: {
      name: "Cohere",
      description: "Enterprise-focused language models",
      website: "dashboard.cohere.com",
      integrated: false,
    },
    // NEW PROVIDERS INFO
    anthropic: {
      name: "Anthropic",
      description: "Claude models with strong reasoning capabilities",
      website: "console.anthropic.com",
      integrated: false,
    },
    gemini: {
      name: "Google Gemini",
      description: "Google's multimodal AI models with generous free tier",
      website: "ai.google.dev",
      integrated: false,
    },
    aleph: {
      name: "Aleph Alpha",
      description: "European AI with multilingual capabilities",
      website: "aleph-alpha.com",
      integrated: false,
    },
    stability: {
      name: "Stability AI",
      description: "Open foundation models for text and code",
      website: "stability.ai",
      integrated: false,
    },
    claude: {
      name: "Claude",
      description: "Claude models with strong reasoning capabilities",
      website: "console.anthropic.com",
      integrated: false,
    },
    ollama: {
      name: "Ollama",
      description: "Run open-source models locally with no API costs - 100% FREE",
      website: "ollama.ai",
      integrated: false,
    },
  }
