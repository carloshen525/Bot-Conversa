"use client";

import React, { useEffect, useState } from "react";
import { Users, Tag, Phone, Search, Sparkles, Binary, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { formatDate, formatRelativeTime } from "@/modules/shared/utils";

interface Contact {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  variables: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadContacts() {
      try {
        const res = await fetch("/api/contacts");
        const json = await res.json();
        if (json.success) {
          setContacts(json.data || []);
        }
      } catch (err) {
        console.error("Contacts load error", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadContacts();
  }, []);

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Contatos</h1>
            <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 text-[10px] font-semibold">
              V1 Placeholder
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Contatos capturados automaticamente pelas automações do WhatsApp e suas tags/variáveis associadas.
          </p>
        </div>
      </div>

      {/* CRM Preview Banner */}
      <Card className="bg-gradient-to-r from-indigo-950/30 to-[#12141c] border-indigo-500/20">
        <CardContent className="flex items-center gap-3 py-4">
          <Sparkles className="h-5 w-5 text-indigo-400 shrink-0" />
          <p className="text-xs text-slate-300">
            <strong>Módulo de CRM & Atendimento Humano (Futuro):</strong> A arquitetura de banco de dados
            está pronta com tabelas <code className="text-indigo-300">contacts</code>, <code className="text-indigo-300">tags</code> e <code className="text-indigo-300">contact_tags</code>. O módulo completo com chat ao vivo será acoplado nas próximas versões.
          </p>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, telefone ou tag..."
          className="w-full rounded-lg bg-[#12141c] border border-border/70 pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <Loading text="Carregando contatos..." />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 bg-[#11131a]/50 p-12 text-center text-xs text-muted-foreground">
          Nenhum contato encontrado. Quando uma mensagem chegar via Evolution API, o contato será registrado aqui automaticamente.
        </div>
      ) : (
        <div className="rounded-xl border border-border/70 bg-[#11131a] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141722] border-b border-border/80 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Nome</th>
                  <th className="px-5 py-3.5">Telefone</th>
                  <th className="px-5 py-3.5">Tags Atribuídas</th>
                  <th className="px-5 py-3.5">Variáveis Salvas</th>
                  <th className="px-5 py-3.5">Última Interação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-slate-300">
                {filtered.map((contact) => (
                  <tr key={contact.id} className="hover:bg-[#151822]/60 transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-slate-300">
                          {contact.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span>{contact.name}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-[11px] text-muted-foreground">
                      {contact.phone}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.length === 0 ? (
                          <span className="text-[11px] text-muted-foreground italic">Sem tags</span>
                        ) : (
                          contact.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 text-[10px] text-purple-300 font-medium"
                            >
                              <Tag className="h-2.5 w-2.5" />
                              {tag}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-[11px]">
                      {Object.keys(contact.variables).length === 0 ? (
                        <span className="text-muted-foreground italic">Nenhuma</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(contact.variables).map(([k, v]) => (
                            <span
                              key={k}
                              className="rounded bg-cyan-500/10 border border-cyan-500/25 px-1.5 py-0.5 text-[10px] text-cyan-300"
                            >
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-muted-foreground text-[11px]">
                      {formatRelativeTime(contact.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
