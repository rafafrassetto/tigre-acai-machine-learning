# Sistema Inteligente de Gestão de Estoque (Tigre Açaí)

## 1. Introdução
Este projeto consiste no desenvolvimento de uma aplicação web automatizada para a gestão e controle de estoque, desenvolvida com o ecossistema Next.js. O principal diferencial acadêmico e tecnológico da plataforma é a integração de um Agente de Inteligência Artificial Generativa (LLM), utilizando a API do Google Gemini. Este agente atua como um assistente autônomo capaz de realizar consultas estruturadas, analisar métricas e propor mutações de estado (inserções e exclusões) por meio de interações em linguagem natural.

## 2. Arquitetura do Sistema
A arquitetura foi projetada utilizando o padrão cliente-servidor (Frontend/Backend) com persistência em nuvem:
- **Frontend (Client-side):** Desenvolvido em React (TypeScript) com estilização via TailwindCSS. Implementa sincronização reativa de estado para refletir imediatamente as alterações de dados na interface gráfica (SPA).
- **Backend (Server-side):** Rotas de API no Next.js (App Router) responsáveis pela comunicação segura com o banco de dados e pela orquestração das requisições ao modelo de IA.
- **Persistência de Dados:** Banco de dados NoSQL MongoDB (hospedado no Atlas), estruturado para acomodar as coleções independentes de `produtos`, `fornecedores` e `movimentacoes`.

## 3. Agente Autônomo e Segurança (Human-in-the-loop)
O assistente virtual foi implementado aplicando técnicas rigorosas de Engenharia de Prompt (*Prompt Engineering*) para mitigar riscos de *hallucination* (geração de dados irreais) e *prompt injection*:
- **Sanitização de Contexto:** O banco de dados passa por um pipeline de limpeza no backend antes de ser enviado à IA, limitando caracteres e registros para não exceder o limite de *tokens* do modelo.
- **Delegação de Execução:** A arquitetura de segurança impede que a IA altere o banco de dados diretamente. Ao receber uma intenção de inserção ou remoção, a IA gera um *payload* JSON abstrato. O frontend processa este *payload* e exige confirmação explícita do usuário humano através de uma interface de botões antes de consolidar a transação na base de dados.

## 4. Tecnologias Utilizadas
- **Ecossistema Core:** TypeScript, Next.js, React
- **Inteligência Artificial:** SDK `@google/generative-ai` (Gemini Flash)
- **Persistência:** MongoDB (Node Driver)
- **Interface e Componentização:** TailwindCSS, Lucide Icons

## 5. Configuração e Execução
1. Clone o repositório localmente:
   ```bash
   git clone https://github.com/rafafrassetto/tigre-acai-machine-learning.git
   ```
2. Instale as dependências (resolvendo conflitos legados, se necessário):
   ```bash
   npm install --legacy-peer-deps
   ```
3. Configure as variáveis de ambiente na raiz do projeto (`.env.local`):
   ```env
   MONGODB_URI=mongodb+srv://...
   GEMINI_API_KEY=AIzaSy...
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
