/**
 * WILLShop OS — WhatsApp & CRM Repository Interfaces
 * Pure Domain Layer — ZERO external dependencies.
 */

import {
  WhatsAppNumber,
  Conversation,
  Message,
  Lead,
  Tag,
  CustomerNote,
  HumanHandoff,
} from '../entities/WhatsAppCRMEntities';

export interface IWhatsAppNumberRepository {
  createNumber(number: Omit<WhatsAppNumber, 'id' | 'createdAt' | 'updatedAt'>): Promise<WhatsAppNumber>;
  findByPhone(phoneNumber: string, orgId: string): Promise<WhatsAppNumber | null>;
  findByProviderId(providerId: string): Promise<WhatsAppNumber | null>;
}

export interface IConversationRepository {
  createConversation(conv: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Conversation>;
  findById(id: string, orgId: string): Promise<Conversation | null>;
  findByCustomer(customerId: string, orgId: string): Promise<Conversation | null>;
  listByOrg(orgId: string, limit?: number): Promise<Conversation[]>;
  updateStatus(id: string, orgId: string, status: Conversation['status']): Promise<void>;
  assignUser(id: string, orgId: string, userId: string | null): Promise<void>;
}

export interface IMessageRepository {
  saveMessage(msg: Omit<Message, 'id' | 'createdAt'>): Promise<Message>;
  findByExternalId(externalId: string, orgId: string): Promise<Message | null>;
  listByConversation(conversationId: string, orgId: string, limit?: number): Promise<Message[]>;
}

export interface ILeadRepository {
  createLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead>;
  findById(id: string, orgId: string): Promise<Lead | null>;
  findByCustomer(customerId: string, orgId: string): Promise<Lead | null>;
  updateStatus(id: string, orgId: string, status: Lead['status'], score?: number): Promise<void>;
  listByOrg(orgId: string): Promise<Lead[]>;
}

export interface ITagRepository {
  createTag(tag: Omit<Tag, 'id' | 'createdAt'>): Promise<Tag>;
  listTags(orgId: string): Promise<Tag[]>;
  addTagToCustomer(customerId: string, tagId: string): Promise<void>;
  getCustomerTags(customerId: string): Promise<Tag[]>;
}

export interface ICustomerNoteRepository {
  addNote(note: Omit<CustomerNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerNote>;
  listNotes(customerId: string, orgId: string): Promise<CustomerNote[]>;
}

export interface IHumanHandoffRepository {
  requestHandoff(handoff: Omit<HumanHandoff, 'id' | 'requestedAt'>): Promise<HumanHandoff>;
  listPendingByOrg(orgId: string): Promise<HumanHandoff[]>;
  resolveHandoff(id: string, orgId: string, resolvedBy: string): Promise<void>;
}
