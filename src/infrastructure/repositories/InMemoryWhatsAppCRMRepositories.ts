/**
 * WILLShop OS — In-Memory WhatsApp & CRM Repositories for Unit Testing
 * Infrastructure Layer.
 */

import {
  IWhatsAppNumberRepository,
  IConversationRepository,
  IMessageRepository,
  ILeadRepository,
  ITagRepository,
  ICustomerNoteRepository,
  IHumanHandoffRepository,
} from '../../domain/interfaces/IWhatsAppCRMRepositories';

import {
  WhatsAppNumber,
  Conversation,
  Message,
  Lead,
  Tag,
  CustomerNote,
  HumanHandoff,
} from '../../domain/entities/WhatsAppCRMEntities';

export class InMemoryWhatsAppNumberRepository implements IWhatsAppNumberRepository {
  private numbers: Map<string, WhatsAppNumber> = new Map();

  async createNumber(dto: Omit<WhatsAppNumber, 'id' | 'createdAt' | 'updatedAt'>): Promise<WhatsAppNumber> {
    const num: WhatsAppNumber = {
      ...dto,
      id: `num-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.numbers.set(num.id, num);
    return num;
  }

  async findByPhone(phoneNumber: string, orgId: string): Promise<WhatsAppNumber | null> {
    for (const num of this.numbers.values()) {
      if (num.phoneNumber === phoneNumber && num.organizationId === orgId) return num;
    }
    return null;
  }

  async findByProviderId(providerId: string): Promise<WhatsAppNumber | null> {
    for (const num of this.numbers.values()) {
      if (num.providerPhoneNumberId === providerId) return num;
    }
    return null;
  }
}

export class InMemoryConversationRepository implements IConversationRepository {
  private conversations: Map<string, Conversation> = new Map();

  async createConversation(dto: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Conversation> {
    const conv: Conversation = {
      ...dto,
      id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.conversations.set(conv.id, conv);
    return conv;
  }

  async findById(id: string, orgId: string): Promise<Conversation | null> {
    const conv = this.conversations.get(id);
    if (conv && conv.organizationId === orgId) return conv;
    return null;
  }

  async findByCustomer(customerId: string, orgId: string): Promise<Conversation | null> {
    for (const conv of this.conversations.values()) {
      if (conv.customerId === customerId && conv.organizationId === orgId) return conv;
    }
    return null;
  }

  async listByOrg(orgId: string, limit = 50): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter((c) => c.organizationId === orgId)
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
      .slice(0, limit);
  }

  async updateStatus(id: string, orgId: string, status: Conversation['status']): Promise<void> {
    const conv = await this.findById(id, orgId);
    if (conv) {
      conv.status = status;
      conv.updatedAt = new Date();
      this.conversations.set(id, conv);
    }
  }

  async assignUser(id: string, orgId: string, userId: string | null): Promise<void> {
    const conv = await this.findById(id, orgId);
    if (conv) {
      conv.assignedUserId = userId;
      conv.updatedAt = new Date();
      this.conversations.set(id, conv);
    }
  }
}

export class InMemoryMessageRepository implements IMessageRepository {
  private messages: Message[] = [];

  async saveMessage(dto: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    // Idempotency check: duplicate external_message_id within organization
    if (dto.externalMessageId) {
      const existing = this.messages.find(
        (m) => m.externalMessageId === dto.externalMessageId && m.organizationId === dto.organizationId
      );
      if (existing) return existing;
    }

    const msg: Message = {
      ...dto,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
    };
    this.messages.push(msg);
    return msg;
  }

  async findByExternalId(externalId: string, orgId: string): Promise<Message | null> {
    return this.messages.find((m) => m.externalMessageId === externalId && m.organizationId === orgId) || null;
  }

  async listByConversation(conversationId: string, orgId: string, limit = 50): Promise<Message[]> {
    return this.messages
      .filter((m) => m.conversationId === conversationId && m.organizationId === orgId)
      .slice(-limit);
  }
}

export class InMemoryLeadRepository implements ILeadRepository {
  private leads: Map<string, Lead> = new Map();

  async createLead(dto: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    const lead: Lead = {
      ...dto,
      id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.leads.set(lead.id, lead);
    return lead;
  }

  async findById(id: string, orgId: string): Promise<Lead | null> {
    const lead = this.leads.get(id);
    if (lead && lead.organizationId === orgId) return lead;
    return null;
  }

  async findByCustomer(customerId: string, orgId: string): Promise<Lead | null> {
    for (const lead of this.leads.values()) {
      if (lead.customerId === customerId && lead.organizationId === orgId) return lead;
    }
    return null;
  }

  async updateStatus(id: string, orgId: string, status: Lead['status'], score?: number): Promise<void> {
    const lead = await this.findById(id, orgId);
    if (lead) {
      lead.status = status;
      if (score !== undefined) lead.score = score;
      lead.updatedAt = new Date();
      this.leads.set(id, lead);
    }
  }

  async listByOrg(orgId: string): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter((l) => l.organizationId === orgId);
  }
}

export class InMemoryTagRepository implements ITagRepository {
  private tags: Map<string, Tag> = new Map();
  private customerTags: Map<string, Set<string>> = new Map();

  async createTag(dto: Omit<Tag, 'id' | 'createdAt'>): Promise<Tag> {
    const tag: Tag = {
      ...dto,
      id: `tag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
    };
    this.tags.set(tag.id, tag);
    return tag;
  }

  async listTags(orgId: string): Promise<Tag[]> {
    return Array.from(this.tags.values()).filter((t) => t.organizationId === orgId);
  }

  async addTagToCustomer(customerId: string, tagId: string): Promise<void> {
    const existing = this.customerTags.get(customerId) || new Set();
    existing.add(tagId);
    this.customerTags.set(customerId, existing);
  }

  async getCustomerTags(customerId: string): Promise<Tag[]> {
    const tagIds = this.customerTags.get(customerId) || new Set();
    return Array.from(tagIds)
      .map((id) => this.tags.get(id))
      .filter((t): t is Tag => t !== undefined);
  }
}

export class InMemoryCustomerNoteRepository implements ICustomerNoteRepository {
  private notes: CustomerNote[] = [];

  async addNote(dto: Omit<CustomerNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerNote> {
    const note: CustomerNote = {
      ...dto,
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.notes.push(note);
    return note;
  }

  async listNotes(customerId: string, orgId: string): Promise<CustomerNote[]> {
    return this.notes.filter((n) => n.customerId === customerId && n.organizationId === orgId);
  }
}

export class InMemoryHumanHandoffRepository implements IHumanHandoffRepository {
  private handoffs: HumanHandoff[] = [];

  async requestHandoff(dto: Omit<HumanHandoff, 'id' | 'requestedAt'>): Promise<HumanHandoff> {
    const handoff: HumanHandoff = {
      ...dto,
      id: `handoff-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      requestedAt: new Date(),
    };
    this.handoffs.push(handoff);
    return handoff;
  }

  async listPendingByOrg(orgId: string): Promise<HumanHandoff[]> {
    return this.handoffs.filter((h) => h.organizationId === orgId && h.status === 'PENDING');
  }

  async resolveHandoff(id: string, orgId: string, resolvedBy: string): Promise<void> {
    const handoff = this.handoffs.find((h) => h.id === id && h.organizationId === orgId);
    if (handoff) {
      handoff.status = 'RESOLVED';
      handoff.assignedTo = resolvedBy;
      handoff.resolvedAt = new Date();
    }
  }
}
