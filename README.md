# Sistema de Gestão de Pousada (MVP)

Monorepo completo contendo **Mapa Operacional de Quartos em Tempo Real**, **Notificações Assíncronas de WhatsApp** e **Relatório Gerencial de Vacância e Faturamento**, projetado com foco **Mobile-First (PWA)** para operação por smartphones na rede local ou em produção.

---

## 1. Estrutura do Projeto

- `compose.yml` — Banco **PostgreSQL 16** configurado para **Podman rootless no Fedora Linux** (`docker.io/library/postgres:16` + volume nomeado `pousada_pgdata` compatível com SELinux).
- `backend/` — **Java 21 + Spring Boot 3.4**, Spring Data JPA, Spring Security (JWT Stateless), Bean Validation e Flyway.
- `frontend/` — **React + TypeScript + Vite + Tailwind CSS + PWA**, com `server.host = true` para acesso via Wi-Fi no celular.

---

## 2. Credenciais de Teste (Seed Inicial do Flyway)

A migração inicial (`V1__init_schema_and_seed.sql`) cria automaticamente os **Quartos `01` a `05`** (`DISPONIVEL`, `ativo = true`, `data_criacao = 2026-01-01`) e os seguintes usuários:

| Nome | Login | Senha | Perfil | Permissões Principais |
| :--- | :--- | :--- | :--- | :--- |
| Gerente Geral | `gerente` | `gerente123` | `GERENTE` | Acesso total: Mapa, `+ Quarto` / Edição de quartos, Estorno de check-in e aba **Relatórios** |
| Atendente Turno Manhã | `atendente1` | `atendente123` | `ATENDENTE` | Mapa de quartos, Check-in, Reserva, Check-out, Limpeza, Manutenção e Observações |
| Atendente Turno Tarde | `atendente2` | `atendente123` | `ATENDENTE` | Mapa de quartos, Check-in, Reserva, Check-out, Limpeza, Manutenção e Observações |
| Atendente Turno Noite | `atendente3` | `atendente123` | `ATENDENTE` | Mapa de quartos, Check-in, Reserva, Check-out, Limpeza, Manutenção e Observações |

---

## 3. Como Executar no Fedora Linux (Podman)

### Passo 1 — Subir o PostgreSQL 16 com Podman

Na raiz do projeto:

```bash
podman compose up -d
```

Verifique se o container está saudável na porta `5432`:

```bash
podman ps
```

> **Nota sobre arquitetura**: O projeto **não** inclui `spring-boot-docker-compose`. O backend conecta-se diretamente via JDBC padrão (`jdbc:postgresql://localhost:5432/pousada_db`).

### Passo 2 — Executar o Backend (Porta `8080`)

```bash
JAVA_HOME=/usr/lib/jvm/java-21-temurin-jdk mvn -f backend/pom.xml spring-boot:run
```

> Em instalações padrão onde `JAVA_HOME` já aponta para um JDK 21 completo, basta rodar `mvn -f backend/pom.xml spring-boot:run`. Na primeira subida, o **Flyway** aplica automaticamente `V1__init_schema_and_seed.sql`.

Para rodar a suíte de testes automatizados do backend:

```bash
mvn -f backend/pom.xml test
```

### Passo 3 — Executar o Frontend PWA (Porta `5173`)

Em outro terminal:

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Acesse no computador: `http://localhost:5173`

Para validar o build de produção do frontend:

```bash
npm --prefix frontend run build
```

---

## 4. Testando pelo Celular via Wi-Fi (Rede Local)

1. Descubra o IP da sua máquina na rede Wi-Fi:
   ```bash
   ip -4 addr show | grep inet
   ```
2. Caso o **firewalld** do Fedora Workstation esteja ativo na interface Wi-Fi, libere temporariamente as portas `5173` e `8080`:
   ```bash
   sudo firewall-cmd --add-port=5173/tcp --add-port=8080/tcp
   ```
3. No navegador do celular conectado ao mesmo Wi-Fi, abra:
   ```text
   http://SEU_IP_LOCAL:5173
   ```
   - O frontend detecta automaticamente o `hostname` acessado e consome `http://SEU_IP_LOCAL:8080/api`.
   - O perfil `dev` do backend já libera CORS automaticamente para faixas privadas da LAN (`192.168.*.*`, `10.*.*.*`, `172.*.*.*`).

---

## 5. Principais Endpoints da API

| Método | Rota | Perfil | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Público | Autentica usuário e retorna token JWT stateless |
| `GET` | `/api/auth/me` | Autenticado | Retorna dados do usuário autenticado |
| `GET` | `/api/quartos` | `ATENDENTE`, `GERENTE` | Lista quartos em tempo real com resumo da hospedagem/reserva atual |
| `POST` | `/api/quartos` | `GERENTE` | Cadastra novo quarto além dos 5 iniciais |
| `PUT` | `/api/quartos/{id}` | `GERENTE` | Atualiza dados cadastrais / ativa ou desativa quarto |
| `PATCH` | `/api/quartos/{id}/status` | `ATENDENTE`, `GERENTE` | Altera status de limpeza/reserva/manutenção (`observacaoAtual` obrigatória para `EM_MANUTENCAO`) |
| `PATCH` | `/api/quartos/{id}/observacao` | `ATENDENTE`, `GERENTE` | Edita observação rápida do quarto |
| `POST` | `/api/hospedagens/checkin` | `ATENDENTE`, `GERENTE` | Registra check-in (`dataCheckoutPrevista = dataCheckin + quantidadeDiarias`) |
| `POST` | `/api/hospedagens/reserva` | `ATENDENTE`, `GERENTE` | Registra reserva agendada (`RESERVADA`) |
| `POST` | `/api/quartos/{quartoId}/checkout` | `ATENDENTE`, `GERENTE` | Realiza check-out e envia quarto para `AGUARDANDO_LIMPEZA` |
| `POST` | `/api/hospedagens/{id}/estornar` | `GERENTE` | Estorna check-in lançado por engano e restaura quarto para `DISPONIVEL` |
| `GET` | `/api/relatorios/vacancia` | `GERENTE` | Calcula vacância, ocupação deduplicada por dia, faturamento proporcional (`Recebido` vs. `A Receber`), diária média e disponibilidade diária |
| `GET` | `/api/auditoria` | `GERENTE` | Consulta histórico recente de operações |

---

## 6. Variáveis de Ambiente para Produção (`SPRING_PROFILES_ACTIVE=prod`)

- `DB_URL`, `DB_USER`, `DB_PASSWORD` — Conexão JDBC PostgreSQL.
- `JWT_SECRET` — Chave secreta (mínimo 256 bits / Base64) para assinatura dos tokens JWT.
- `CORS_ALLOWED_ORIGIN_PATTERNS` — Domínio(s) permitido(s) do frontend em produção.
- `WHATSAPP_WEBHOOK_URL`, `WHATSAPP_API_TOKEN`, `WHATSAPP_DESTINO_GRUPO` — Endpoint HTTP POST (Webhook / Evolution API) acionado de forma assíncrona (`@Async`).
