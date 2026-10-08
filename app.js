const DEFAULTS = {
  initialBankroll: 100,
  initialStake: 5,
  payout: 85,
  sorosLevels: 5,
  bankroll: 100,
  sorosLevel: 1,
  currentStake: 5,
  totalWins: 0,
  totalLosses: 0,
  totalOps: 0,
  sessionPnl: 0,
  winStreak: 0,
  lossStreak: 0,
  bestWinStreak: 0,
  bestLossStreak: 0,
  history: [],
  locked: false,
  lastCyclePnl: 0
};

const KEY = "gale_manager_v2";

const $ = (id) => document.getElementById(id);
const money = (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    const merged = saved ? { ...DEFAULTS, ...saved } : { ...DEFAULTS };
    merged.sorosLevels = 5;
    merged.sorosLevel = Math.min(5, Math.max(1, Number(merged.sorosLevel) || 1));
    merged.currentStake = Number(merged.currentStake) > 0 ? Number(merged.currentStake) : merged.initialStake;
    return merged;
  } catch {
    return { ...DEFAULTS };
  }
}

let state = loadState();

function saveState() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function num(id) {
  return Math.max(0, Number($(id).value) || 0);
}

function configFromInputs() {
  state.initialBankroll = num("initialBankroll");
  state.initialStake = num("initialStake");
  state.payout = Math.min(99.99, Math.max(1, num("payout")));
  state.sorosLevels = 5;
}

function hydrateInputs() {
  $("initialBankroll").value = state.initialBankroll.toFixed(2);
  $("initialStake").value = state.initialStake.toFixed(2);
  $("payout").value = state.payout.toFixed(2);
  $("sorosLevels").value = "5";
}

function payoutDecimal() {
  return state.payout / 100;
}

function currentStake() {
  return state.currentStake > 0 ? state.currentStake : state.initialStake;
}

function expectedProfit(stake = currentStake()) {
  return stake * payoutDecimal();
}

function nextAfterWin(stake = currentStake()) {
  return stake + expectedProfit(stake);
}

function riskLevel() {
  const lossPct = state.initialBankroll
    ? Math.abs(Math.min(0, state.sessionPnl)) / state.initialBankroll
    : 0;
  if (state.locked || lossPct >= 0.20) return "danger";
  if (state.sorosLevel >= 4 || lossPct >= 0.10) return "warn";
  return "safe";
}

function setRiskPill() {
  const pill = $("riskPill");
  const label = $("riskLabel");
  const level = riskLevel();
  pill.classList.remove("warn", "danger");
  if (level === "danger") {
    pill.classList.add("danger");
    label.textContent = "Risco alto / bloqueado";
  } else if (level === "warn") {
    pill.classList.add("warn");
    label.textContent = "Atenção";
  } else {
    label.textContent = "Risco baixo";
  }
}

function canOperate() {
  if (state.locked || state.bankroll <= 0) return false;
  return currentStake() <= state.bankroll;
}

function render() {
  configFromInputs();

  const stake = currentStake();
  const profit = expectedProfit(stake);
  const afterWin = nextAfterWin(stake);

  $("bankrollValue").textContent = money(state.bankroll);
  const diff = state.bankroll - state.initialBankroll;
  $("bankrollDelta").textContent = `Variação: ${diff >= 0 ? "+" : ""}${money(diff)}`;

  $("cycleValue").textContent = money(state.lastCyclePnl);
  $("cycleValue").className = "stat-value " +
    (state.lastCyclePnl > 0 ? "win-text" : state.lastCyclePnl < 0 ? "loss-text" : "");
  $("cycleStatus").textContent = state.sorosLevel === 1
    ? "Pronto para iniciar o Soros"
    : `Soros em andamento • nível ${state.sorosLevel}/5`;

  const total = state.totalWins + state.totalLosses;
  const rate = total ? (state.totalWins / total) * 100 : 0;
  $("winRateValue").textContent = `${rate.toFixed(1).replace(".", ",")}%`;
  $("winLossCount").textContent = `${state.totalWins} WIN • ${state.totalLosses} LOSS`;

  $("streakValue").textContent = state.winStreak;
  $("streakText").textContent = state.winStreak
    ? "WIN consecutivos"
    : "Sem sequência de WINs";

  $("nextStakeValue").textContent = money(stake);
  $("nextStakeHelper").textContent = `Soros ${state.sorosLevel}/5 • ${state.sorosLevel === 1 ? "entrada inicial" : "capital + lucro acumulado"}`;
  $("nextLevel").textContent = `${state.sorosLevel}/5`;
  $("targetProfit").textContent = money(profit);
  $("afterWinValue").textContent = state.sorosLevel < 5 ? money(afterWin) : "Reinicia em R$ 5,00";
  $("cycleBadge").textContent = `SOROS ${state.sorosLevel}/5`;

  $("totalOps").textContent = state.totalOps;
  $("sessionPnl").textContent = `${state.sessionPnl >= 0 ? "+" : ""}${money(state.sessionPnl)}`;
  $("sessionPnl").className = state.sessionPnl < 0 ? "loss-text" : "win-text";
  $("bestWinStreak").textContent = `${state.bestWinStreak} WIN`;
  $("bestLossStreak").textContent = `${state.bestLossStreak} LOSS`;

  renderCycle();
  renderHistory();
  renderSorosProjection();
  setRiskPill();

  const available = canOperate();
  $("winBtn").disabled = !available;
  $("lossBtn").disabled = !available;

  if (state.locked) {
    $("riskMessage").textContent = "Sessão bloqueada. Reinicie a sessão ou ajuste a gestão de risco.";
  } else if (stake > state.bankroll) {
    $("riskMessage").textContent = `Banca insuficiente para a próxima entrada de ${money(stake)}. Não opere.`;
  } else if (state.sorosLevel === 5) {
    $("riskMessage").textContent = `Último nível do Soros. WIN encerra o ciclo e reinicia no nível 1. LOSS reinicia imediatamente no nível 1.`;
  } else {
    $("riskMessage").textContent = `WIN: próxima entrada será ${money(afterWin)}. LOSS: reinicia o Soros em ${money(state.initialStake)}.`;
  }

  saveState();
}

function renderSorosProjection() {
  const list = $("sorosProjection");
  let stake = state.initialStake;
  let html = "";

  for (let level = 1; level <= 5; level++) {
    const profit = expectedProfit(stake);
    const next = stake + profit;
    const active = level === state.sorosLevel ? " active" : "";
    const nextLabel = level < 5 ? money(next) : "Reinicia";

    html += `
      <div class="soros-row${active}">
        <div><span class="small">Nível</span><strong>${level}/5</strong></div>
        <div><span class="small">Entrada</span><strong>${money(stake)}</strong></div>
        <div><span class="small">Lucro 85%</span><strong class="win-text">${money(profit)}</strong></div>
        <div><span class="small">Após WIN</span><strong>${nextLabel}</strong></div>
      </div>
    `;
    stake = next;
  }

  list.innerHTML = html;
}

function renderCycle() {
  const list = $("cycleList");
  if (!state.history.length) {
    list.innerHTML = `<div class="cycle-empty">Nenhuma operação registrada. O Soros começa no nível 1.</div>`;
    return;
  }

  const lastCycle = state.history[state.history.length - 1].cycle;
  const cycle = state.history.filter(x => x.cycle === lastCycle);

  list.innerHTML = cycle.map(item => `
    <div class="cycle-row">
      <div><span class="small">Soros</span><strong>${item.level}</strong></div>
      <div><span class="small">Entrada</span><strong>${money(item.stake)}</strong></div>
      <div><span class="small">Resultado</span><strong class="${item.result === "WIN" ? "win-text" : "loss-text"}">${item.result}</strong></div>
    </div>
  `).join("");
}

function renderHistory() {
  const body = $("historyBody");
  if (!state.history.length) {
    body.innerHTML = `<tr><td colspan="5" style="color:#90a1ba;padding:18px 8px;">Nenhuma operação registrada.</td></tr>`;
    return;
  }

  body.innerHTML = [...state.history].slice(-40).reverse().map(item => `
    <tr>
      <td>${item.time}</td>
      <td>${item.level}</td>
      <td>${money(item.stake)}</td>
      <td class="${item.result === "WIN" ? "win-text" : "loss-text"}">${item.result}</td>
      <td class="${item.pnl >= 0 ? "win-text" : "loss-text"}">${item.pnl >= 0 ? "+" : ""}${money(item.pnl)}</td>
    </tr>
  `).join("");
}

function recordWin() {
  if (!canOperate()) return;

  const stake = currentStake();
  const profit = expectedProfit(stake);
  const next = nextAfterWin(stake);
  const cycleId = state.history.length
    ? state.history[state.history.length - 1].cycle
    : Date.now();

  state.bankroll += profit;
  state.sessionPnl += profit;
  state.totalWins++;
  state.totalOps++;
  state.winStreak++;
  state.lossStreak = 0;
  state.bestWinStreak = Math.max(state.bestWinStreak, state.winStreak);
  state.lastCyclePnl = profit;

  state.history.push({
    time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    level: `${state.sorosLevel}/5`,
    stake,
    result: "WIN",
    pnl: profit,
    cycle: cycleId
  });

  if (state.sorosLevel >= 5) {
    state.sorosLevel = 1;
    state.currentStake = state.initialStake;
    state.lastCyclePnl = state.sessionPnl;
  } else {
    state.sorosLevel += 1;
    state.currentStake = next;
  }

  render();
}

function recordLoss() {
  if (!canOperate()) return;

  const stake = currentStake();
  const cycleId = state.history.length
    ? state.history[state.history.length - 1].cycle
    : Date.now();

  state.bankroll -= stake;
  state.sessionPnl -= stake;
  state.totalLosses++;
  state.totalOps++;
  state.lossStreak++;
  state.winStreak = 0;
  state.bestLossStreak = Math.max(state.bestLossStreak, state.lossStreak);
  state.lastCyclePnl = -stake;

  state.history.push({
    time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    level: `${state.sorosLevel}/5`,
    stake,
    result: "LOSS",
    pnl: -stake,
    cycle: cycleId
  });

  state.sorosLevel = 1;
  state.currentStake = state.initialStake;

  if (state.bankroll <= 0) {
    state.locked = true;
  }

  render();
}

function resetAll() {
  const ok = confirm("Reiniciar a sessão apagará os resultados atuais e voltará para a banca configurada. Deseja continuar?");
  if (!ok) return;

  state = { ...DEFAULTS, history: [], currentStake: state.initialStake || 5 };
  state.bankroll = state.initialBankroll || 100;
  hydrateInputs();
  render();
}

$("winBtn").addEventListener("click", recordWin);
$("lossBtn").addEventListener("click", recordLoss);
$("resetBtn").addEventListener("click", resetAll);

$("clearHistoryBtn").addEventListener("click", () => {
  if (!confirm("Limpar todo o histórico da sessão?")) return;
  state.history = [];
  state.lastCyclePnl = 0;
  render();
});

$("closeStopModal").addEventListener("click", () => $("stopModal").classList.add("hidden"));

document.querySelectorAll("input, select").forEach(el => {
  el.addEventListener("change", () => {
    const oldInitialStake = state.initialStake;
    const oldInitialBankroll = state.initialBankroll;

    configFromInputs();

    if (state.totalOps === 0) {
      state.bankroll = state.initialBankroll;
      state.currentStake = state.initialStake;
      state.sorosLevel = 1;
    } else if (oldInitialStake !== state.initialStake) {
      // A nova entrada inicial passa a valer no próximo reset do ciclo.
      state.currentStake = state.sorosLevel === 1 ? state.initialStake : state.currentStake;
    }

    if (oldInitialBankroll !== state.initialBankroll && state.totalOps === 0) {
      state.bankroll = state.initialBankroll;
    }

    render();
  });
});

hydrateInputs();
render();
