/**
 * WILLShop OS — WhatsApp & CRM Pure Domain Entities
 * Pure Domain Layer — ZERO external dependencies.
 */

export interface WhatsAppNumber {
  id: string;
  organizationId: string;
  phoneNumber: string;
  displayName: string;
  provider: string;
  providerPhoneNumberId: string;
  providerBusinessAccountId?: string | null;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type ConversationStatus = 'OPEN' | 'PENDING' | 'WAITING_CUSTOMER' | 'WAITING_AGENT' | 'CLOSED' | 'ARCHIVED';

export interface Conversation {
  id: string;
  organizationId: string;
  customerId?: string | null;
  whatsappNumberId?: string | null;
  externalConversationId?: string | null;
  status: ConversationStatus;
  channel: string;
  assignedUserId?: string | null;
  assignedAgent: string;
  lastMessageAt: Date;
  unreadCount: number;
  priority: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type MessageSenderType = 'CUSTOMER' | 'AI' | 'HUMAN' | 'SYSTEM';
export type MessageType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'LOCATION' | 'CONTACT' | 'TEMPLATE' | 'INTERACTIVE' | 'UNKNOWN';

export interface Message {
  id: string;
  organizationId: string;
  conversationId: string;
  customerId?: string | null;
  direction: MessageDirection;
  senderType: MessageSenderType;
  senderId?: string | null;
  messageType: MessageType;
  content?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  externalMessageId?: string | null;
  replyToMessageId?: string | null;
  status: string;
  errorCode?: string | null;
  metadata: Record<string, unknown>;
  sentAt: Date;
  deliveredAt?: Date | null;
  readAt?: Date | null;
  createdAt: Date;
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'NEGOTIATION' | 'WON' | 'LOST';

export interface Lead {
  id: string;
  organizationId: string;
  customerId: string;
  conversationId?: string | null;
  source: string;
  status: LeadStatus;
  score: number;
  assignedTo?: string | null;
  estimatedValue?: number | null;
  productInterest?: string | null;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  organizationId: string;
  name: string;
  color: string;
  category: string;
  createdAt: Date;
}

export interface CustomerNote {
  id: string;
  organizationId: string;
  customerId: string;
  authorId?: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export type HandoffStatus = 'PENDING' | 'ASSIGNED' | 'RESOLVED';

export interface HumanHandoff {
  id: string;
  organizationId: string;
  conversationId: string;
  requestedBy: string;
  assignedTo?: string | null;
  reason: string;
  status: HandoffStatus;
  requestedAt: Date;
  resolvedAt?: Date | null;
}
