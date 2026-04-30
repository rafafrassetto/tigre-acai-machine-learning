# Sistema Inteligente de Gestão de Estoque (Tigre Açaí)

<img width="2560" height="1040" alt="image" src="https://github.com/user-attachments/assets/055121db-50ad-4d42-b668-e4cf73926b16" />

## 1. Introdução
Este projeto consiste no desenvolvimento de uma aplicação web automatizada para a gestão e controle de estoque, desenvolvida com o ecossistema Next.js. O principal diferencial acadêmico e tecnológico da plataforma é a integração de um Agente de Inteligência Artificial Generativa (LLM), utilizando a API da Groq (Modelo Llama 3.3 70B). Este agente atua como um assistente autônomo capaz de realizar consultas estruturadas, analisar métricas e propor mutações de estado (inserções e exclusões) por meio de interações em linguagem natural.

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
- **Inteligência Artificial:** SDK `groq-sdk` (Llama 3.3 70B)
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
   GROK_APO=gsk_...
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## 6. Referências Bibliográficas e Tecnológicas

As seguintes documentações, artigos e bibliografias fundamentaram o desenvolvimento da arquitetura e a integração da Inteligência Artificial neste projeto:

1. **BROWN, Tom et al.** *Language Models are Few-Shot Learners.* In: Advances in Neural Information Processing Systems (NeurIPS), 2020. Disponível em: [https://arxiv.org/abs/2005.14165](https://arxiv.org/abs/2005.14165). *(Base teórica para as técnicas de Prompt Engineering aplicadas).*
2. **GROQ CLOUD.** *Groq API Documentation: Chat Completions & Model Quotas.* Groq Inc., 2024. Disponível em: [https://console.groq.com/docs](https://console.groq.com/docs). *(Diretrizes oficiais para integração do modelo Llama 3.3 e definição de comportamento da IA).*
3. **NEXT.JS.** *Next.js Documentation: App Router & Route Handlers.* Vercel, 2024. Disponível em: [https://nextjs.org/docs](https://nextjs.org/docs). *(Fundamentação técnica para a construção da API Server-side e hidratação do cliente).*
4. **MONGODB.** *MongoDB Node.js Driver Documentation.* MongoDB Inc., 2024. Disponível em: [https://www.mongodb.com/docs/drivers/node/current/](https://www.mongodb.com/docs/drivers/node/current/). *(Boas práticas para transações e modelagem de dados NoSQL).*
5. **OWASP.** *OWASP Top 10 for Large Language Model Applications.* Open Worldwide Application Security Project, 2023. Disponível em: [https://owasp.org/www-project-top-10-for-large-language-model-applications/](https://owasp.org/www-project-top-10-for-large-language-model-applications/). *(Padrões de segurança adotados contra Prompt Injection e vazamento de System Prompts).*
