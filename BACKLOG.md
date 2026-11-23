# Backlog — Pousada Gestão

> Atualizado em: 2026-11-22  
> Monorepo: `backend/` (Java 21 / Spring Boot 3.4 / PostgreSQL 16 / Flyway) + `frontend/` (React 18 / TypeScript / Vite / Tailwind)

---

## Prioridade Alta

### ✅ Item 6 — Mensagem pronta para WhatsApp (cópia manual no frontend)
**Status:** Implementado (2026-11-23)

**Problema:** As notificações de WhatsApp já são formatadas no backend (check-in, check-out, reserva, cancelamento, estorno, manutenção, quarto disponível), mas só eram enviadas via webhook ou logadas no console. O operador no celular não tinha como copiar a mensagem para colar manualmente no WhatsApp da equipe.

**Solução implementada:**
- `FormatadorComprovanteWhatsApp` agora é o único ponto de formatação de texto.
- `HospedagemResponse` e `QuartoMapaDTO` recebem campo opcional `mensagemWhatsapp: String` retornado diretamente pelos services nas operações relevantes (check-in, checkout, estorno, reserva, cancelamento, alteração de status de quarto).
- Frontend: novo componente `WhatsAppMsgModal` (bottom sheet responsivo) com `<textarea>` editável, botão **"Copiar Mensagem"** (muda para "Copiado! ✓" por 2s), botão "Fechar" e suporte a `navigator.clipboard` com fallback `execCommand`.
- Ícone 💬 na `TopBar` permite reabrir a **última mensagem gerada** na sessão, caso o operador feche antes de colar.
- O campo `mensagemWhatsapp` é ignorado pelo frontend em operações que não o retornam (nulo/ausente).

**Critério de aceite:**
- [x] Após check-in, check-out, estorno, cancelamento e mudança de status de quarto, o modal abre automaticamente com a mensagem formatada.
- [x] O operador pode editar o texto antes de copiar.
- [x] "Copiar Mensagem" usa `navigator.clipboard`; fallback em mobile.
- [x] O ícone 💬 na TopBar reabre a última mensagem da sessão.
- [x] Sem quebra de testes existentes; build TypeScript limpo.

---

### ✅ Item 1 — Card do quarto exibindo a reserva mais próxima
**Status:** Implementado (2026-11-22)

**Problema:** Quando há múltiplas reservas para o mesmo quarto, o card pode exibir uma reserva futura distante em vez da mais próxima.

**Correção aplicada:**
- `QuartoService.buscarProximaReserva`: filtra apenas `dataCheckin.isAfter(hoje)` (reservas estritamente futuras) em vez de `dataCheckoutPrevista.isAfter(hoje)` para garantir ordenação ascendente por data de chegada.
- Na listagem do mapa, o mesmo critério foi alinhado para o bloco `else` (sem hospedagem ativa).

**Critério de aceite:**
- [x] Dado quarto com 3 reservas futuras, o card exibe sempre a de `dataCheckin` mais próxima.
- [x] Reservas cujo `dataCheckin` já passou (mas `dataCheckoutPrevista` ainda não) não aparecem como "próxima reserva".

---

### ✅ Item 2 — Reserva futura mesmo com quarto ocupado hoje
**Status:** Implementado (2026-11-22)

**Problema:** O botão "Reservar" só aparecia em quartos `DISPONIVEL`, impossibilitando agendar estadias futuras em quartos atualmente ocupados ou em limpeza.

**Correção aplicada:**
- Adicionado botão **"+ Nova Reserva"** global no topo da aba Mapa (visível a todos os perfis).
- `ReservaModal` agora aceita `quarto` opcional: quando aberto globalmente, exibe `<select>` de todos os quartos ativos para o usuário escolher.
- Backend `HospedagemService.registrarReserva`: bloqueio de status físico (`!= DISPONIVEL`) só se aplica para reservas de **hoje** (`dataCheckin <= hoje`) — reservas futuras são permitidas independentemente do status atual do quarto (a validação de conflito de datas já cobre sobreposições).

**Critério de aceite:**
- [x] Quarto `OCUPADO` hoje pode receber reserva futura sem erro de status.
- [x] Conflito de datas continua bloqueando reservas sobrepostas.
- [x] Usuário pode iniciar reserva pela barra superior sem precisar tocar num card específico.

---

## Prioridade Média

### ✅ Item 3 — Renovação de diária e edição pós-check-in / pós-check-out
**Status:** Implementado (2026-11-23)

**Problema:** Operações cotidianas exigem prorrogar estadias de hóspedes em quartos ativos (renovação de diárias com acréscimo financeiro) e corrigir dados cadastrais/valores pós-checkin ou pós-checkout com controle de perfil e auditoria.

**Solução implementada:**
- Endpoint `PATCH /api/hospedagens/{id}/renovar`:
  - Prorroga `quantidadeDiarias` e estende `dataCheckoutPrevista`.
  - Valida sobreposição com reservas futuras cadastradas no mesmo quarto, bloqueando com mensagem clara caso o quarto já esteja reservado para outro hóspede.
  - Recalcula `valorTotal`, aceita pagamento parcial ou total imediato (`valorPagoAgora`), ajusta saldo a receber.
  - Registra histórico de auditoria `RENOVACAO_DIARIA`.
  - Gera comprovante formatado de WhatsApp para a equipe (`🔁 *DIÁRIA RENOVADA*`).
- Endpoint `PUT /api/hospedagens/{id}`:
  - Permite corrigir nome do hóspede, quantidade de pessoas, valor total e valor pago no check-in com preenchimento obrigatório de `motivo`.
  - Hospedagens com status `FINALIZADA` têm edição restrita exclusivamente ao perfil `GERENTE`.
  - Hospedagens `CANCELADA` ou `ESTORNADA` são bloqueadas para edição.
  - Registra histórico de auditoria `EDICAO_HOSPEDAGEM` com os valores anteriores e os novos valores alterados.
- Frontend:
  - Botão **"Renovar"** no card do quarto ocupado com modal responsivo (`RenovarDiariaModal`), cálculo automático da nova data de checkout e do acréscimo financeiro sugerido pela diária do quarto.
  - Botão de edição rápida (ícone lápis) no card de hospedagem do quarto, abrindo `EditarHospedagemModal` com validação de permissão.
  - A renovação abre automaticamente o modal de WhatsApp com a mensagem pronta para envio.

**Critério de aceite:**
- [x] Renovação recalcula `dataCheckoutPrevista` e bloqueia se houver reserva conflitante.
- [x] Histórico registra responsável, data/hora e detalhes da alteração.
- [x] Apenas `GERENTE` pode editar hospedagens com status `FINALIZADA`.
- [x] Mensagem de WhatsApp gerada para a equipe pronta para cópia.
- [x] Suíte de testes unitários e de integração validando todos os cenários.

---

### ✅ Item 4 — Histórico de hospedagens
**Status:** Concluído (2026-11-23)

**Escopo:**
- Endpoint `GET /api/hospedagens?status=&quartoId=&nomeHospede=&dataInicio=&dataFim=&page=&size=` retornando `Page<HospedagemResponse>` (paginado).
- Status filtráveis: `ATIVA`, `FINALIZADA`, `ESTORNADA`, `RESERVADA`, `CANCELADA`.
- Frontend: nova aba "Histórico" na navegação inferior (visível a todos; filtro avançado por quarto para `GERENTE`).

**Critério de aceite:**
- [x] Listagem paginada com filtros combinados (status múltiplo/chips, nome do hóspede, intervalo de datas e quarto).
- [x] Ordem padrão: `dataCheckin DESC, id DESC`.
- [x] Retorno inclui `numeroQuarto`, `nomeHospede`, datas, valores e status.
- [x] Exportação de histórico para **Planilha CSV (Excel / Sheets)** via endpoint `GET /api/hospedagens/exportar/csv` com formatação brasileira e UTF-8 BOM.
- [x] Exportação de **Relatório PDF / Impressão** responsivo com resumo financeiro, filtros aplicados e formatação para folha A4.
- [x] Suíte de testes de integração com cobertura completa de paginação, filtros, ordenação e exportação CSV.

---

### 🔲 Item 5 — Alteração de nome e senha de usuários
**Status:** Pendente

**Escopo:**
- Endpoint `PUT /api/usuarios/meu-perfil` (autenticado): altera `nome` e/ou `senha` do próprio usuário (exige `senhaAtual` para confirmar; nova senha mínimo 8 caracteres; salva com `BCryptPasswordEncoder`).
- Endpoint `GET /api/usuarios` + `PUT /api/usuarios/{id}` exclusivos para `GERENTE`: listar e editar dados de qualquer usuário (sem exigir senha atual; pode ativar/inativar).
- Frontend: tela/modal "Meu Perfil" acessível pelo menu; para `GERENTE`, lista de usuários com ação de editar.
- Sem migration de schema (colunas já existem: `nome`, `senha_hash`, `ativo`, `perfil`).

**Critério de aceite:**
- Senha antiga incorreta retorna 400 com mensagem clara.
- Nova senha é salva em BCrypt antes de persistir.
- `GERENTE` pode redefinir senha de qualquer usuário sem informar a senha antiga.

---

## Prioridade Baixa / Futuro

- **Notificações push (PWA)**: alertas de check-in pendente e quarto pronto.
- **Multi-tenancy**: suporte a mais de uma pousada no mesmo sistema.
- **Relatório de ocupação mensal em PDF**: exportação do relatório de vacância.
- **App nativo (React Native / Capacitor)**: empacotamento como app móvel para distribuição nas lojas.
