/**
 * WILLShop OS — Mock AI Gateway Implementation
 * Infrastructure Layer.
 * Provider-agnostic placeholder implementation for Build 01.
 */

import { IAIGateway, AIModelRequest, AIModelResponse } from '../../domain/interfaces/IAIGateway';

export class MockAIGateway implements IAIGateway {
  async generateCompletion(request: AIModelRequest): Promise<AIModelResponse> {
    const promptLength = request.messages.reduce((acc, m) => acc + m.content.length, 0);
    const mockContent = `[WILLShop AI Gateway Mock Response for Agent '${request.agentName}'] Ready for Build 09 integration.`;

    return {
      content: mockContent,
      promptTokens: Math.ceil(promptLength / 4),
      completionTokens: Math.ceil(mockContent.length / 4),
      totalTokens: Math.ceil(promptLength / 4) + Math.ceil(mockContent.length / 4),
      model: 'willshop-gateway-v1-mock',
      provider: 'mock-provider',
    };
  }
}
