# Bot Conversa Platform - V1

Uma plataforma web moderna, modular e altamente escalável para criação visual de chatbots com WhatsApp, inspirada no BotConversa, construída sobre Next.js (App Router), TypeScript, TailwindCSS, React Flow, Supabase e Evolution API.

---

## 🚀 Stack Tecnológica

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript (Strict Mode)
- **Estilização:** TailwindCSS (Tema escuro inspirado em Notion & Linear)
- **Editor Visual:** React Flow (@xyflow/react v12)
- **Gerenciamento de Estado de API:** TanStack React Query v5
- **Formulários & Validação:** React Hook Form & Zod
- **Banco de Dados:** Supabase (PostgreSQL com SQL Schema completo + Camada com Fallback Local Resiliente)
- **Integração WhatsApp:** Evolution API (Módulo isolado)
- **Ícones:** Lucide React

---

## 🎯 Arquitetura & Diretrizes de Design

A plataforma foi projetada seguindo **Clean Architecture**, **SOLID** e separação estrita de responsabilidades:

```
src/
├── app/                      # Interface & Rotas Next.js App Router
│   ├── page.tsx              # Dashboard com métricas e logs em tempo real
│   ├── chatbots/             # Listagem de Chatbots (Criar, Editar, Duplicar, Excluir, Publicar)
│   │   └── [id]/page.tsx     # Editor Visual de Fluxos (React Flow infinito)
│   ├── contacts/page.tsx     # Gestão de contatos capturados, tags e variáveis
│   ├── settings/page.tsx     # Configurações Evolution API, Webhooks e Supabase
│   └── api/                  # Endpoints REST e Webhook Receiver
├── components/               # Componentes UI reutilizáveis
│   ├── ui/                   # Button, Input, Textarea, Select, Modal, Drawer, Dialog, Toast, Card, Dropdown, Loading, Empty State
│   └── layout/               # Sidebar fixa moderna e navegação
└── modules/                  # Módulos de Domínio e Regras de Negócio
    ├── chatbots/             # Definição dos blocos, tipos, validação Zod e serviço
    │   └── editor/           # Canvas, Barra de Ferramentas, Paleta de Blocos, Painel de Propriedades, Simulador
    ├── flow-engine/          # MOTOR DE EXECUÇÃO 100% INDEPENDENTE DO REACT
    │   ├── FlowEngine.ts     # Interpretador de grafos, transições e guardrails
    │   ├── variable-parser.ts# Interpolação de variáveis: {{nome}}, {{telefone}}, etc.
    │   ├── condition-evaluator.ts # Avaliação de condições e ramificações
    │   └── node-executors/   # Executores específicos para cada tipo de bloco
    ├── evolution/            # Módulo isolado de comunicação com Evolution API
    │   ├── client.ts         # Envio de texto, mídia, consulta de perfis e status
    │   └── webhook-handler.ts# Recepção de eventos messages.upsert e disparo do motor
    ├── database/             # Repositórios e persistência de dados
    └── shared/               # Utilitários, geradores de ID e constantes
```

---

## 🔒 Versionamento Imutável (Draft vs. Published Snapshot)

O sistema implementa uma garantia rígida de estabilidade operacional:

1. **Rascunho (`chatbot_drafts`):**
   - O usuário edita o fluxo livremente no editor visual sem impactar nenhuma conversa em andamento.
2. **Publicação (`chatbot_versions`):**
   - Ao clicar em **Publicar**, é gerado um snapshot JSON imutável numerado sequencialmente (`v1`, `v2`, `v3`...).
   - Apenas snapshots publicados são executados em conversas reais.
3. **Conversas em Andamento (`conversation_state`):**
   - Cada conversa armazena o `chatbot_version_id` com o qual foi iniciada. Mesmo que uma nova versão seja publicada, a conversa continuará executando rigorosamente o fluxo snapshot com o qual começou.
   - Novas conversas utilizam a versão publicada mais recente.

---

## 🧩 Blocos Disponíveis no Editor

| Bloco | Tipo | Funcionalidades |
|---|---|---|
| **Início** | `startNode` | Gatilhos: Nova conversa, Palavra-chave, Webhook ou Manual *(restrito a 1 por fluxo)* |
| **Mensagem** | `messageNode` | Texto, Imagem, Vídeo, Áudio, Documento (PDF), variáveis `{{nome}}` com preview em tempo real e delay de digitação |
| **Espera** | `waitNode` | Esperar resposta do usuário ou intervalo programado (minutos, horas, dias) |
| **Condição** | `conditionNode` | Contém, igual, inicia com, termina com, variável igual, tag existe/não existe. **Cada saída possui uma conexão independente** no canvas |
| **Adicionar Tag** | `addTagNode` | Atribui etiquetas ao contato |
| **Remover Tag** | `removeTagNode` | Remove etiquetas do contato |
| **Variável** | `variableNode` | Salva variáveis personalizadas a partir de texto fixo, última resposta, nome ou telefone |
| **Webhook** | `webhookNode` | Execução HTTP (GET/POST) com cabeçalhos, corpo JSON e armazenamento da resposta em variável |
| **Fim** | `endNode` | Finaliza a execução do fluxo com motivo registrado |

---

## 🗄️ Estrutura do Banco de Dados (Supabase / PostgreSQL)

O script SQL de criação de tabelas e índices está localizado em `supabase/schema.sql`:

1. `chatbots`: Metadados e ponteiro da versão publicada atual
2. `chatbot_drafts`: JSON do fluxo em edição
3. `chatbot_versions`: Snapshots publicados imutáveis numerados
4. `contacts`: Telefones, nomes e metadados dos contatos
5. `tags`: Etiquetas globais
6. `contact_tags`: Relacionamento n:n entre contatos e tags
7. `conversation_state`: Estado de execução (nó atual, variáveis salvas, horário para retomar)
8. `executions`: Histórico de execuções disparadas
9. `variables`: Definições de variáveis do chatbot
10. `logs`: Auditoria de passos, avisos e erros do motor

---

## ⚡ Como Rodar o Projeto

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie `.env.example` para `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Rodar em Modo de Desenvolvimento
```bash
npm run dev
```
Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### 4. Compilar para Produção
```bash
npm run build
npm start
```

---

## 📲 Integração com a Evolution API

1. Configure no painel da sua Evolution API o webhook para apontar para:
   ```
   http://seu-dominio.com/api/webhooks/evolution
   ```
2. Habilite os eventos `messages.upsert`.
3. Ao receber uma mensagem:
   - O webhook handler extrai o remetente e o texto.
   - Localiza ou cria o contato.
   - Retoma a conversa no nó salvo ou dispara um novo fluxo baseado nas palavras-chave configuradas.
   - Envia as respostas e mídias de volta via Evolution API.
