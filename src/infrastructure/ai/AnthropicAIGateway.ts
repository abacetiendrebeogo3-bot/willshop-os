/**
 * WILLShop OS — Anthropic Claude AI Gateway Implementation
 * Infrastructure Layer.
 * Provides real Anthropic Claude completion and Tool Calling capability.
 */

import { IAIGateway, AIModelRequest, AIModelResponse } from '../../domain/interfaces/IAIGateway';

export interface AnthropicToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export class AnthropicAIGateway implements IAIGateway {
  private readonly apiKey: string;
  private readonly defaultModel: string;

  constructor(apiKey?: string, defaultModel?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.defaultModel = defaultModel || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  }

  async generateCompletion(
    request: AIModelRequest & { tools?: AnthropicToolDefinition[] }
  ): Promise<AIModelResponse & { toolCalls?: Array<{ id: string; name: string; input: any }> }> {
    if (!this.apiKey) {
      console.warn('AnthropicAIGateway: ANTHROPIC_API_KEY is not set. Falling back to mock response.');
      return {
        content: "Bonjour ! Je suis l'Agent IA WillShop. Comment puis-je vous aider aujourd'hui ?",
        promptTokens: 10,
        completionTokens: 15,
        totalTokens: 25,
        model: 'willshop-ai-fallback',
        provider: 'fallback',
      };
    }

    const systemMessage = request.messages.find((m) => m.role === 'system')?.content || '';
    const userMessages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    try {
      const payload: Record<string, any> = {
        model: this.defaultModel,
        max_tokens: request.maxTokens || 400,
        temperature: request.temperature ?? 0.3,
        system: systemMessage,
        messages: userMessages,
      };

      if (request.tools && request.tools.length > 0) {
        payload.tools = request.tools;
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(`Anthropic API error [${response.status}]:`, errorText);
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const resData = await response.json();
      let textContent = '';
      const toolCalls: Array<{ id: string; name: string; input: any }> = [];

      for (const block of resData.content || []) {
        if (block.type === 'text') {
          textContent += block.text;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input,
          });
        }
      }

      const promptTokens = resData.usage?.input_tokens || 0;
      const completionTokens = resData.usage?.output_tokens || 0;

      return {
        content: textContent,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        model: resData.model || this.defaultModel,
        provider: 'anthropic',
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    } catch (err: any) {
      console.error('AnthropicAIGateway exception:', err);
      return {
        content: "Désolé, je rencontre une petite difficulté technique. Un conseiller commercial va prendre le relais.",
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        model: this.defaultModel,
        provider: 'anthropic-error',
      };
    }
  }
}
