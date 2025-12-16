# Party Joy Hub 🎉

**Party Joy Hub** é a plataforma definitiva para interação em grupo, projetada para transformar qualquer reunião, festa ou evento corporativo em uma experiência inesquecível. Com foco em engajamento em tempo real, nossa aplicação permite que administradores criem e gerenciem jogos interativos onde os participantes usam seus próprios smartphones como controles.

## 🚀 Funcionalidades Principais

### 1. Modos de Jogo
*   **🧠 Quiz Interativo**: Teste o conhecimento da galera! Crie perguntas de múltipla escolha com temporizadores. Pontuação automática e ranking em tempo real.
*   **🗳️ Votação / Enquete**: Descubra a opinião do grupo. Ideal para "Quem é mais provável de...", eleições rápidas ou feedbacks instantâneos.

### 2. Experiência do Usuário (Player)
*   **Acesso Simplificado**: Entrada via QR Code ou Link direto, sem necessidade de baixar apps.
*   **Avatares Divertidos**: Identificação visual automática e amigável.
*   **Interface Responsiva**: Design otimizado para qualquer dispositivo móvel.

### 3. Painel do Administrador
*   **Criação Intuitiva**: Ferramentas fáceis para criar e editar perguntas.
*   **Gerenciamento Total**: Controle o fluxo do jogo (Lobby -> Pergunta -> Resultados -> Ranking).
*   **Dashboard Ao Vivo**: Visualize quem votou, estatísticas e o pódio final em uma tela projetável.
*   **Segurança**: Área administrativa protegida por login.

## 🛠️ Tecnologias Utilizadas

O **Party Joy Hub** é construído com uma stack moderna e robusta para garantir performance em tempo real:

*   **Frontend**: [React](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **UI/UX**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn/ui](https://ui.shadcn.com/)
*   **Backend**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
*   **Real-time**: [Socket.io](https://socket.io/) para comunicação bidirecional instantânea.
*   **Banco de Dados**: [MySQL](https://www.mysql.com/) para persistência de jogos, jogadores e histórico.
*   **Gerenciamento de Estado**: [Zustand](https://github.com/pmndrs/zustand).

## 📦 Instalação e Configuração

### Pré-requisitos
*   Node.js (v18+)
*   MySQL Server (local ou remoto)

### Passos
1.  **Clone o repositório**
    ```bash
    git clone https://github.com/seu-usuario/party-joy-hub.git
    cd party-joy-hub
    ```

2.  **Instale as dependências**
    ```bash
    npm install
    ```

3.  **Configure o Ambiente**
    Crie um arquivo `.env` na raiz com as credenciais do seu banco de dados:
    ```env
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=sua_senha
    DB_NAME=party_joy_hub
    JWT_SECRET=sua_chave_secreta_super_segura
    ```

4.  **Inicie o Servidor Backend**
    ```bash
    npm run start:server
    ```
    *O servidor irá criar automaticamente as tabelas necessárias no banco de dados na primeira execução.*

5.  **Inicie o Frontend (Desenvolvimento)**
    ```bash
    npm run dev
    ```

## 🔮 O Futuro do Party Joy Hub

Estamos apenas começando! Nossa visão para o futuro inclui transformar o **Party Joy Hub** em um serviço SaaS (Software as a Service) completo, oferecendo:

*   **Planos Premium**: Recursos exclusivos para eventos de grande porte.
*   **Personalização de Marca**: White-label para empresas usarem sua própria identidade visual.
*   **Biblioteca de Jogos**: Packs de perguntas prontos para diversos temas (Cinema, Esportes, Cultura Pop).
*   **Modo Torneio**: Campeonatos multi-rodadas com persistência de pontuação a longo prazo.

---

Desenvolvido por @leocostarj22 @leocostadeveloper
www.leocostadeveloper.com
