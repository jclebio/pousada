# Especificação Consolidada do Sistema de Gestão de Pousada

## 1. Arquitetura, Stack e Ambiente Local
- Monorepo contendo `backend/`, `frontend/` e `compose.yml` na raiz (PostgreSQL 16).
- Backend: Java 21, Spring Boot 3.4, Spring Data JPA, Spring Security (JWT stateless), Bean Validation, Flyway.
- Frontend: React (Vite), Tailwind CSS, foco total em Mobile-First (PWA) com botões amplos para toque.
- Em ambiente `dev`, configurar `server.address: 0.0.0.0` no Spring Boot, `server.host = true` no Vite e liberar CORS para origens da rede local (LAN), permitindo testar direto pelo celular no mesmo Wi-Fi.

## 2. Perfis e Permissões
- GERENTE: Acesso total. Cadastra/edita/desativa quartos, gerencia usuários, estorna check-in feito por engano, vê auditoria e acessa o painel de Vacância e Faturamento.
- ATENDENTE: Visualiza mapa de quartos, faz check-in, check-out, cria/cancela reservas futuras, altera status de limpeza/manutenção e edita observações rápidas do quarto.

## 3. Quartos e Ciclo de Vida (Enum Fixo)
Entidade `Quarto` deve conter `numero`, `descricao`, `ativo` (Boolean), `dataCriacao` (LocalDate, padrão hoje) e `observacaoAtual` (String).
Status físicos permitidos em `StatusQuarto`:
- `DISPONIVEL` (Verde): Quarto pronto hoje; aceita check-in direto ou reserva.
- `RESERVADO` (Azul): Bloqueado para chegada confirmada hoje.
- `OCUPADO` (Vermelho): Hóspede hospedado no quarto; bloqueia novo check-in imediato.
- `AGUARDANDO_LIMPEZA` (Âmbar): Gerado automaticamente no check-out; bloqueia check-in.
- `EM_LIMPEZA` (Roxo): Limpeza em andamento; bloqueia check-in.
- `EM_MANUTENCAO` (Cinza): Bloqueado para reparo com texto obrigatório no campo `observacaoAtual`.

## 4. Regras de Check-in, Reservas Futuras, Conflitos e Financeiro
Entidade `Hospedagem` deve conter:
- `quarto` (FK), `usuarioRegistro` (FK), `usuarioEstorno` (FK opcional), `nomeHospede` (String), `quantidadePessoas` (Integer >= 1).
- `dataCheckin` (LocalDate, padrão hoje) e `quantidadeDiarias` (Integer >= 1).
- `dataCheckoutPrevista` (LocalDate): calculada obrigatoriamente como `dataCheckin.plusDays(quantidadeDiarias)`.
- `dataCheckoutReal` (LocalDateTime, preenchido no check-out) e `statusHospedagem` (`RESERVADA`, `ATIVA`, `FINALIZADA`, `ESTORNADA`, `CANCELADA`).
- Campos financeiros (`BigDecimal`, escala 2): `valorTotal`, `valorAntecipado` (sinal pago antes, padrão `0.00` no check-in direto), `valorPagoCheckin` e `valorPagoCheckout`.
- No check-in direto, se `valorTotal` não for enviado separadamente, assumir `valorTotal = valorPagoCheckin`.

Regras críticas de Reservas Futuras e Conflito de Datas:
- **Não bloqueio antecipado**: Criar uma reserva futura (`statusHospedagem = RESERVADA` com `dataCheckin > hoje`) NÃO altera o status físico atual do quarto para `RESERVADO` hoje — o quarto permanece `DISPONIVEL` no mapa para hospedagens avulsas que terminem antes da data da reserva. O status físico do quarto só muda para `RESERVADO` no dia da chegada (`dataCheckin == hoje`).
- **Prevenção de sobreposição (Overbooking)**: Ao criar reserva (`RESERVADA`) ou check-in direto (`ATIVA`), validar no banco que não existe outra hospedagem válida (`ATIVA` ou `RESERVADA`) no mesmo quarto onde `novaDataCheckin < existente.dataCheckoutPrevista` e `novaDataCheckoutPrevista > existente.dataCheckin`. Retornar erro HTTP 400 claro em caso de conflito.
- **Informações no Card do Mapa**: O endpoint `GET /api/quartos` deve incluir `proximaReserva` (data e hóspede da próxima hospedagem `RESERVADA` do quarto, se houver) para exibição discreta no card mesmo quando o quarto estiver `DISPONIVEL`.

## 5. Interface do Mapa Operacional e Filtro "Reservados" (Frontend)
- Barra superior de filtros no Mapa com contadores em tempo real: `Todos`, `Disponível`, `Ocupado`, `Limpeza`, `Manutenção` e `Reservados`.
- **Comportamento do chip "Reservados"**:
  - O badge numérico deve contar o total de reservas futuras ativas (`statusHospedagem = RESERVADA`) cadastradas no sistema, e não apenas quartos com status físico `RESERVADO` hoje.
  - Ao tocar em `Reservados`, exibir uma lista cronológica (ordenada por `dataCheckin`) das reservas agendadas com quarto, hóspede, datas, valor total, sinal pago, saldo restante e ações de **Confirmar Check-in** e **Cancelar Reserva**.
  - Ao tocar em `Todos` ou qualquer outro status físico, exibir sempre a grade de cards dos quartos (garantindo fallback seguro com optional chaining para não quebrar a renderização se listas auxiliares estiverem vazias).
- Botão `+ Quarto` e edição de quartos visíveis no Mapa exclusivamente para `GERENTE`.

## 6. Notificações Assíncronas de WhatsApp
- Interface `NotificacaoWhatsAppService` executada via `@Async` após o commit da transação.
- Em `dev`: formatar comprovantes (Check-in, Nova Reserva com sinal/saldo, Check-out/Pedido de Limpeza, Quarto Disponível, Manutenção) e registrar no log do console.
- Em `prod`: disparar `POST` HTTP configurável via variáveis de ambiente (`WHATSAPP_WEBHOOK_URL`, `WHATSAPP_API_TOKEN`).
- Transição `AGUARDANDO_LIMPEZA` -> `EM_LIMPEZA` NÃO dispara mensagem no WhatsApp.

## 7. Relatório de Vacância e Faturamento (Exclusivo GERENTE)
Endpoint `GET /api/relatorios/vacancia?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD`:
- Cada data `d` no intervalo inclusivo `[dataInicio, dataFim]` representa 1 pernoite.
- Capacidade do dia `d`: soma dos quartos ativos onde `dataCriacao <= d`.
- Hospedagens válidas para ocupação e faturamento: apenas status em (`ATIVA`, `FINALIZADA`, `RESERVADA`). Ignorar `ESTORNADA` e `CANCELADA`.
- Para `FINALIZADA` com `dataCheckoutReal`, `dataSaidaConsiderada` é `max(dataCheckin.plusDays(1), dataCheckoutReal.toLocalDate())`; para `ATIVA` ou `RESERVADA`, usar `dataCheckoutPrevista`.
- Quarto ocupado na noite `d`: existe hospedagem válida onde `dataCheckin <= d` e `d < dataSaidaConsiderada` (contando cada quarto no máximo 1 vez por noite `d`).
- Cálculo financeiro proporcional ao período (`BigDecimal`, `HALF_UP`): para cada hospedagem válida com `noitesNoPeriodo > 0`, definir `noitesTotais = max(1, dias entre dataCheckin e dataSaidaConsiderada)`. Calcular `faturamentoProporcional = valorTotal * noitesNoPeriodo / noitesTotais` e `recebidoProporcional = min(valorTotal, valorAntecipado + valorPagoCheckin + valorPagoCheckout) * noitesNoPeriodo / noitesTotais`.
- Retornar: `totalDiariasDisponiveis`, `totalDiariasOcupadas`, `totalDiariasVagas`, `taxaVacanciaPercentual`, `taxaOcupacaoPercentual`, `faturamentoTotalPeriodo`, `valorRecebidoPeriodo`, `valorAReceberPeriodo`, `diariaMedia`, `vacanciaPorQuarto` e `disponibilidadeDiaria`.

## 8. Diretrizes de Containers (Fedora Linux + Podman)
- O ambiente utiliza Podman rootless (`podman compose`), sem Docker Engine instalado.
- No arquivo `compose.yml` da raiz, declarar sempre o registro completo `image: docker.io/library/postgres:16` para evitar prompts interativos no terminal.
- Persistir os dados do PostgreSQL usando volume nomeado (compatível com SELinux no Fedora).
- Não incluir `spring-boot-docker-compose` no Maven; conectar via JDBC padrão na porta 5432 após subir o container com `podman compose up -d`.
