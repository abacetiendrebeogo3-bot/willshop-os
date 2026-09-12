/**
 * WILLShop OS — AI Gateway Abstraction Interface
 * Provider-agnostic interface.
 * Pure Domain Layer — NO lock-in to OpenRouter, OpenAI, or Anthropic.
 */

export interface AIModelMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIModelRequest {
  agentName: string;
  messages: AIModelMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
  responseFormat?: 'text' | 'json_object';
}

export interface AIModelResponse {
  content: string;
  promptTokens: number;
  completionTokens: number;
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
  totalTokens: number;
  estimatedCostUsd?: number;
  model: string;
  provider: string;
}

export interface IAIGateway {
  generateCompletion(request: AIModelRequest): Promise<AIModelResponse>;
}
