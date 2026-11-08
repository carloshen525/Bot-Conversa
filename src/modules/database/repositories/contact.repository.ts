import { ContactData } from "../../flow-engine/types";
import { generateId } from "../../shared/utils";

export interface ContactRecord {
  id: string;
  name: string;
  phone: string;
  profile_pic_url?: string;
  metadata: Record<string, unknown>;
  tags: string[];
  variables: Record<string, string>;
  created_at: string;
  updated_at: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __BOT_CONVERSA_CONTACTS__: Map<string, ContactRecord> | undefined;
}

if (!global.__BOT_CONVERSA_CONTACTS__) {
  global.__BOT_CONVERSA_CONTACTS__ = new Map();

  // Demo contacts
  const c1: ContactRecord = {
    id: "cont_1",
    name: "Mariana Silva",
    phone: "5511988887777",
    tags: ["Cliente VIP", "Interesse_Consultoria"],
    variables: { saldo: "250.00", cidade: "São Paulo" },
    metadata: {},
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  };

  const c2: ContactRecord = {
    id: "cont_2",
    name: "Rodrigo Almeida",
    phone: "5521977776666",
    tags: ["Lead Novo"],
    variables: { cidade: "Rio de Janeiro" },
    metadata: {},
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  };

  global.__BOT_CONVERSA_CONTACTS__.set(c1.phone, c1);
  global.__BOT_CONVERSA_CONTACTS__.set(c2.phone, c2);
}

export class ContactRepository {
  private get store() {
    return global.__BOT_CONVERSA_CONTACTS__!;
  }

  public async listAll(): Promise<ContactRecord[]> {
    return Array.from(this.store.values()).sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  public async findByPhone(phone: string): Promise<ContactRecord | null> {
    const clean = phone.replace(/\D/g, "");
    return this.store.get(clean) || null;
  }

  public async findById(id: string): Promise<ContactRecord | null> {
    for (const c of Array.from(this.store.values())) {
      if (c.id === id) return c;
    }
    return null;
  }

  public async getOrCreate(phone: string, name?: string): Promise<ContactRecord> {
    const clean = phone.replace(/\D/g, "");
    let existing = this.store.get(clean);

    if (!existing) {
      const now = new Date().toISOString();
      existing = {
        id: generateId("cont"),
        name: name || `WhatsApp ${clean.slice(-4)}`,
        phone: clean,
        metadata: {},
        tags: [],
        variables: {},
        created_at: now,
        updated_at: now,
      };
      this.store.set(clean, existing);
    } else if (name && existing.name.startsWith("WhatsApp ")) {
      existing.name = name;
      existing.updated_at = new Date().toISOString();
      this.store.set(clean, existing);
    }

    return existing;
  }

  public async updateTags(contactId: string, tags: string[]): Promise<void> {
    const contact = await this.findById(contactId);
    if (contact) {
      contact.tags = tags;
      contact.updated_at = new Date().toISOString();
      this.store.set(contact.phone, contact);
    }
  }

  public async updateVariables(
    contactId: string,
    variables: Record<string, string>
  ): Promise<void> {
    const contact = await this.findById(contactId);
    if (contact) {
      contact.variables = { ...contact.variables, ...variables };
      contact.updated_at = new Date().toISOString();
      this.store.set(contact.phone, contact);
    }
  }
}

export const contactRepository = new ContactRepository();
