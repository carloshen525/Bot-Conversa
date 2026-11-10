import fs from "fs";
import path from "path";
import { Contact, ContactsFilter } from "./types";
import { generateId } from "../shared/utils";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "contacts-db.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadPersistedData(): Contact[] | null {
  try {
    ensureDataDir();
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("[ContactsRepository] Erro ao carregar contacts-db.json:", err);
  }
  return null;
}

function savePersistedData(contacts: Map<string, Contact>) {
  try {
    ensureDataDir();
    const payload = Array.from(contacts.values());
    fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), "utf-8");
  } catch (err) {
    console.error("[ContactsRepository] Erro ao salvar contacts-db.json:", err);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __BOT_CONVERSA_CONTACTS_MODULE__: Map<string, Contact> | undefined;
}

if (!global.__BOT_CONVERSA_CONTACTS_MODULE__) {
  global.__BOT_CONVERSA_CONTACTS_MODULE__ = new Map();

  const persisted = loadPersistedData();
  if (persisted && persisted.length > 0) {
    persisted.forEach((c) => {
      global.__BOT_CONVERSA_CONTACTS_MODULE__!.set(c.phone, c);
    });
  } else {
    // Demo seed contacts
    const demo: Contact[] = [
      {
        id: "cont_carlos",
        name: "Carlos Henrique",
        phone: "553598754516",
        profile_pic_url: "https://pps.whatsapp.net/v/t61.24694-24/598884049_1331122458826793_3929887848371704087_n.jpg",
        last_message: "Posso enviar o arquivo e a chave PIX?",
        last_message_at: new Date().toISOString(),
        last_message_from_me: true,
        instance_name: "Carlos1",
        tags: ["Cliente Ativo", "Interesse_Silabas"],
        variables: { interesse: "Jogo da Memória" },
        status: "active",
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    demo.forEach((c) => global.__BOT_CONVERSA_CONTACTS_MODULE__!.set(c.phone, c));
    savePersistedData(global.__BOT_CONVERSA_CONTACTS_MODULE__);
  }
}

export class ContactsRepository {
  private get store() {
    return global.__BOT_CONVERSA_CONTACTS_MODULE__!;
  }

  public async list(filter?: ContactsFilter): Promise<Contact[]> {
    let list = Array.from(this.store.values());

    if (filter) {
      if (filter.search) {
        const s = filter.search.toLowerCase().trim();
        list = list.filter(
          (c) =>
            c.name.toLowerCase().includes(s) ||
            c.phone.includes(s) ||
            (c.last_message && c.last_message.toLowerCase().includes(s)) ||
            c.tags.some((t) => t.toLowerCase().includes(s))
        );
      }

      if (filter.tag) {
        list = list.filter((c) => c.tags.includes(filter.tag!));
      }

      if (filter.status) {
        list = list.filter((c) => c.status === filter.status);
      }

      if (filter.hasActiveFlow !== undefined) {
        list = list.filter((c) => (Boolean(c.active_flow) === filter.hasActiveFlow));
      }

      if (filter.chatbotId) {
        list = list.filter((c) => c.active_flow?.chatbot_id === filter.chatbotId);
      }
    }

    return list.sort((a, b) => {
      const timeA = new Date(a.last_message_at || a.updated_at).getTime();
      const timeB = new Date(b.last_message_at || b.updated_at).getTime();
      return timeB - timeA;
    });
  }

  public async findById(id: string): Promise<Contact | null> {
    for (const c of Array.from(this.store.values())) {
      if (c.id === id) return c;
    }
    return null;
  }

  public async findByPhone(phone: string): Promise<Contact | null> {
    const clean = phone.replace(/\D/g, "");
    return this.store.get(clean) || null;
  }

  public async upsert(data: Partial<Contact> & { phone: string }): Promise<Contact> {
    const cleanPhone = data.phone.replace(/\D/g, "");
    const existing = this.store.get(cleanPhone);
    const now = new Date().toISOString();

    if (existing) {
      const updated: Contact = {
        ...existing,
        ...data,
        name: data.name || existing.name,
        profile_pic_url: data.profile_pic_url || existing.profile_pic_url,
        tags: Array.from(new Set([...(existing.tags || []), ...(data.tags || [])])),
        variables: { ...(existing.variables || {}), ...(data.variables || {}) },
        updated_at: now,
      };

      this.store.set(cleanPhone, updated);
      savePersistedData(this.store);
      return updated;
    }

    const newContact: Contact = {
      id: data.id || generateId("cont"),
      name: data.name || `Contato ${cleanPhone.slice(-4)}`,
      phone: cleanPhone,
      profile_pic_url: data.profile_pic_url,
      last_message: data.last_message,
      last_message_at: data.last_message_at || now,
      last_message_from_me: data.last_message_from_me,
      instance_name: data.instance_name || "Carlos1",
      tags: data.tags || [],
      variables: data.variables || {},
      active_flow: data.active_flow,
      status: data.status || "idle",
      created_at: now,
      updated_at: now,
    };

    this.store.set(cleanPhone, newContact);
    savePersistedData(this.store);
    return newContact;
  }

  public async updateTags(id: string, tags: string[]): Promise<Contact | null> {
    const contact = await this.findById(id);
    if (!contact) return null;

    contact.tags = Array.from(new Set(tags));
    contact.updated_at = new Date().toISOString();
    this.store.set(contact.phone, contact);
    savePersistedData(this.store);
    return contact;
  }

  public async updateVariables(id: string, variables: Record<string, string>): Promise<Contact | null> {
    const contact = await this.findById(id);
    if (!contact) return null;

    contact.variables = { ...contact.variables, ...variables };
    contact.updated_at = new Date().toISOString();
    this.store.set(contact.phone, contact);
    savePersistedData(this.store);
    return contact;
  }

  public async updateActiveFlow(id: string, activeFlow: Contact["active_flow"]): Promise<Contact | null> {
    const contact = await this.findById(id);
    if (!contact) return null;

    contact.active_flow = activeFlow;
    contact.status = activeFlow ? (activeFlow.status === "waiting_input" ? "waiting" : "active") : "idle";
    contact.updated_at = new Date().toISOString();
    this.store.set(contact.phone, contact);
    savePersistedData(this.store);
    return contact;
  }

  public async delete(id: string): Promise<boolean> {
    const contact = await this.findById(id);
    if (!contact) return false;

    this.store.delete(contact.phone);
    savePersistedData(this.store);
    return true;
  }

  public purgeInvalidLids(): number {
    let purged = 0;
    for (const [phone] of Array.from(this.store.entries())) {
      // Discard WhatsApp internal LIDs (typically 14-16 digits not starting with standard phone formats)
      const isLid = phone.length > 13 || (!phone.startsWith("55") && phone.length > 11);
      if (isLid) {
        this.store.delete(phone);
        purged++;
      }
    }
    if (purged > 0) {
      savePersistedData(this.store);
    }
    return purged;
  }
}

export const contactsRepository = new ContactsRepository();
