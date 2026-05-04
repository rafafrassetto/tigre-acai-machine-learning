# Sistema Inteligente de Gestão de Estoque (Tigre Açaí)

<img width="2560" height="1040" alt="image" src="https://github.com/user-attachments/assets/055121db-50ad-4d42-b668-e4cf73926b16" />

## 1. Introdução
Este projeto é uma aplicação web avançada para gestão de estoque da açaiteria Tigre Açaí. O diferencial do sistema é o **Tigre AI**, um núcleo de inteligência híbrido que utiliza modelos de última geração (**Google Gemini 1.5 Flash** e **Groq/Llama 3.3**) para processar comandos em linguagem natural, analisar dados de estoque e automatizar processos logísticos.

## 2. Arquitetura do Sistema e Otimização (RAG)
Para garantir alta performance e baixo custo operacional, o sistema utiliza uma arquitetura de **Retrieval-Augmented Generation (RAG) Simples**:
- **Filtragem de Contexto:** O backend não envia o banco de dados inteiro para a IA. Ele filtra apenas os produtos e movimentações relevantes para a pergunta do usuário, reduzindo o uso de tokens de 50k para menos de 5k por requisição.
- **Orquestração Híbrida:** O sistema prioriza o Gemini 1.5 Flash por seu contexto massivo, com fallback automático para o Groq (Llama 3.3 70B) em caso de falhas ou limites de cota.
- **Frontend Reativo:** Desenvolvido em React/Next.js com TailwindCSS, oferecendo uma experiência de chat fluida com visualização de métricas em tempo real.

## 3. Agente Autônomo e Segurança
O Tigre AI opera sob o conceito de *Human-in-the-loop*:
- **Ações Pendentes:** A IA propõe inserções ou exclusões, mas o sistema exige que o usuário confirme a ação através de botões na interface antes de alterar o MongoDB.
- **Memória de Longo Prazo:** Fatos importantes ("O fornecedor X só entrega às quartas") são aprendidos pela IA e persistidos em uma coleção de memória para consultas futuras.

## 4. Tecnologias Utilizadas
- **IA:** Google Generative AI (Gemini 1.5 Flash), Groq SDK (Llama 3.3 70B)
- **Framework:** Next.js 15 (App Router), TypeScript
- **Banco de Dados:** MongoDB Atlas
- **Integrações:** Google Sheets API (Histórico Externo), Google Drive API (Backup de Chats)

## 5. Configuração e Execução
1. Clone o repositório.
2. Instale as dependências: `npm install --legacy-peer-deps`.
3. Configure o arquivo `.env.local` com as chaves:
   ```env
   MONGODB_URI=mongodb+srv://...
   GEMINI_API_KEY=...
   GROK_APO=gsk_...
   GOOGLE_CLIENT_EMAIL=...
   GOOGLE_PRIVATE_KEY=...
   ```
4. Execute localmente: `npm run dev`.

## 6. Referências
O projeto aplica conceitos de *Prompt Engineering* e arquiteturas modernas de LLMs documentadas pela Google AI, Meta e Vercel.
