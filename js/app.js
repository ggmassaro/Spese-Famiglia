// Logica applicativa - Spese Famiglia

const loginScreen = document.getElementById("login-screen");
const appContainer = document.getElementById("app-container");
const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");
const loginButton = document.getElementById("login-button");
const loginError = document.getElementById("login-error");
const logoutButton = document.getElementById("logout-button");
const userEmailLabel = document.getElementById("user-email");

function showApp(email) {
  loginScreen.classList.add("d-none");
  appContainer.classList.remove("d-none");
  userEmailLabel.textContent = email || "";
  caricaDatiInserimentoSpesa();
}

function showLogin() {
  appContainer.classList.add("d-none");
  loginScreen.classList.remove("d-none");
  loginError.classList.add("d-none");
  loginError.textContent = "";
  loginPasswordInput.value = "";
}

async function checkSession() {
  const { data } = await db.auth.getSession();
  if (data.session) {
    showApp(data.session.user.email);
  } else {
    showLogin();
  }
}

async function handleLogin() {
  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value;

  const { data, error } = await db.auth.signInWithPassword({ email, password });

  if (error) {
    loginError.textContent = "Email o password non corretti";
    loginError.classList.remove("d-none");
    return;
  }

  showApp(data.user.email);
}

async function handleLogout() {
  await db.auth.signOut();
  showLogin();
}

loginButton.addEventListener("click", handleLogin);
logoutButton.addEventListener("click", handleLogout);

checkSession();

// ---------------------------------------------------------------------------
// Sezione "Inserisci Spesa"
// ---------------------------------------------------------------------------

const NUOVA_VOCE_VALORE = "__nuova_voce__";
const NUOVA_VOCE_TESTO = "+ Aggiungi nuova voce...";
const NUOVO_GRUPPO_VALORE = "__nuovo_gruppo__";
const NUOVO_GRUPPO_TESTO = "+ Aggiungi nuovo gruppo...";

const spesaForm = document.getElementById("spesa-form");
const spesaDataInput = document.getElementById("spesa-data");
const spesaImportoInput = document.getElementById("spesa-importo");
const spesaVoceSelect = document.getElementById("spesa-voce");
const spesaGruppoSelect = document.getElementById("spesa-gruppo");
const spesaMetodoSelect = document.getElementById("spesa-metodo");
const spesaNotaInput = document.getElementById("spesa-nota");
const spesaFeedback = document.getElementById("spesa-feedback");
const spesaSubmitButton = document.getElementById("spesa-submit-button");
const annullaModificaButton = document.getElementById("annulla-modifica-button");
const speseTableBody = document.getElementById("spese-table-body");

let vociSpesaCache = [];
let gruppiSpesaCache = [];
let speseCache = [];
let ultimoValoreVoce = "";
let ultimoValoreGruppo = "";
let editingSpesaId = null;

function dataOdiernaISO() {
  const oggi = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${oggi.getFullYear()}-${pad(oggi.getMonth() + 1)}-${pad(oggi.getDate())}`;
}

function formatDataIt(dataISO) {
  const [anno, mese, giorno] = dataISO.split("-");
  return `${giorno}/${mese}/${anno}`;
}

function formatImporto(valore) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(valore);
}

function escapeHtml(testo) {
  const div = document.createElement("div");
  div.textContent = testo ?? "";
  return div.innerHTML;
}

function mostraFeedbackSpesa(messaggio, tipo) {
  spesaFeedback.textContent = messaggio;
  spesaFeedback.className = `alert alert-${tipo} mt-3`;
}

function nascondiFeedbackSpesa() {
  spesaFeedback.classList.add("d-none");
}

function renderVoceOptions(selezionata) {
  spesaVoceSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.disabled = true;
  placeholder.textContent = "-- Seleziona voce --";
  spesaVoceSelect.appendChild(placeholder);

  vociSpesaCache.forEach((voce) => {
    const opt = document.createElement("option");
    opt.value = voce.nome;
    opt.textContent = voce.nome;
    spesaVoceSelect.appendChild(opt);
  });

  const nuova = document.createElement("option");
  nuova.value = NUOVA_VOCE_VALORE;
  nuova.textContent = NUOVA_VOCE_TESTO;
  spesaVoceSelect.appendChild(nuova);

  spesaVoceSelect.value = selezionata || "";
  ultimoValoreVoce = spesaVoceSelect.value;
}

function renderGruppoOptions(selezionata) {
  spesaGruppoSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.disabled = true;
  placeholder.textContent = "-- Seleziona gruppo --";
  spesaGruppoSelect.appendChild(placeholder);

  gruppiSpesaCache.forEach((gruppo) => {
    const opt = document.createElement("option");
    opt.value = gruppo.nome;
    opt.textContent = gruppo.nome;
    spesaGruppoSelect.appendChild(opt);
  });

  const nuovo = document.createElement("option");
  nuovo.value = NUOVO_GRUPPO_VALORE;
  nuovo.textContent = NUOVO_GRUPPO_TESTO;
  spesaGruppoSelect.appendChild(nuovo);

  spesaGruppoSelect.value = selezionata || "";
  ultimoValoreGruppo = spesaGruppoSelect.value;
}

async function caricaVociSpesa(selezionata) {
  const { data, error } = await db.from("voci_spesa").select("*").order("nome");
  if (!error) {
    vociSpesaCache = data || [];
  }
  renderVoceOptions(selezionata);
}

async function caricaGruppiSpesa(selezionata) {
  const { data, error } = await db.from("gruppi_spesa").select("*").order("nome");
  if (!error) {
    gruppiSpesaCache = data || [];
  }
  renderGruppoOptions(selezionata);
}

async function gestisciNuovaVoce() {
  const nome = window.prompt("Nome nuova voce di spesa:");
  if (!nome || !nome.trim()) {
    spesaVoceSelect.value = ultimoValoreVoce;
    return;
  }

  const { error } = await db.from("voci_spesa").insert({ nome: nome.trim() });
  if (error) {
    mostraFeedbackSpesa("Errore nella creazione della voce: " + error.message, "danger");
    spesaVoceSelect.value = ultimoValoreVoce;
    return;
  }

  await caricaVociSpesa(nome.trim());
}

async function gestisciNuovoGruppo() {
  const nome = window.prompt("Nome nuovo gruppo di spesa:");
  if (!nome || !nome.trim()) {
    spesaGruppoSelect.value = ultimoValoreGruppo;
    return;
  }

  const { error } = await db.from("gruppi_spesa").insert({ nome: nome.trim() });
  if (error) {
    mostraFeedbackSpesa("Errore nella creazione del gruppo: " + error.message, "danger");
    spesaGruppoSelect.value = ultimoValoreGruppo;
    return;
  }

  await caricaGruppiSpesa(nome.trim());
}

spesaVoceSelect.addEventListener("change", () => {
  if (spesaVoceSelect.value === NUOVA_VOCE_VALORE) {
    gestisciNuovaVoce();
  } else {
    ultimoValoreVoce = spesaVoceSelect.value;
  }
});

spesaGruppoSelect.addEventListener("change", () => {
  if (spesaGruppoSelect.value === NUOVO_GRUPPO_VALORE) {
    gestisciNuovoGruppo();
  } else {
    ultimoValoreGruppo = spesaGruppoSelect.value;
  }
});

function renderSpeseTable() {
  speseTableBody.innerHTML = speseCache
    .map(
      (spesa) => `
        <tr>
          <td>${formatDataIt(spesa.data)}</td>
          <td>${formatImporto(spesa.importo)}</td>
          <td>${escapeHtml(spesa.voce_spesa)}</td>
          <td>${escapeHtml(spesa.gruppo_spesa)}</td>
          <td>${escapeHtml(spesa.metodo_pagamento)}</td>
          <td>${escapeHtml(spesa.nota)}</td>
          <td class="text-nowrap">
            <button type="button" class="btn btn-sm btn-outline-primary btn-modifica-spesa" data-id="${spesa.id}">Modifica</button>
            <button type="button" class="btn btn-sm btn-outline-danger btn-elimina-spesa" data-id="${spesa.id}">Elimina</button>
          </td>
        </tr>
      `
    )
    .join("");
}

async function caricaSpeseRecenti() {
  const { data, error } = await db
    .from("spese")
    .select("*")
    .order("data", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  if (!error) {
    speseCache = data || [];
    renderSpeseTable();
  }
}

function resetSpesaForm() {
  const metodoAttuale = spesaMetodoSelect.value;

  spesaDataInput.value = dataOdiernaISO();
  spesaImportoInput.value = "";
  renderVoceOptions("");
  renderGruppoOptions("");
  spesaMetodoSelect.value = metodoAttuale;
  spesaNotaInput.value = "";

  editingSpesaId = null;
  annullaModificaButton.classList.add("d-none");
  spesaSubmitButton.textContent = "Salva spesa";
}

function iniziaModificaSpesa(id) {
  const spesa = speseCache.find((s) => String(s.id) === String(id));
  if (!spesa) return;

  editingSpesaId = spesa.id;
  spesaDataInput.value = spesa.data;
  spesaImportoInput.value = spesa.importo;
  renderVoceOptions(spesa.voce_spesa);
  renderGruppoOptions(spesa.gruppo_spesa);
  spesaMetodoSelect.value = spesa.metodo_pagamento;
  spesaNotaInput.value = spesa.nota || "";

  annullaModificaButton.classList.remove("d-none");
  spesaSubmitButton.textContent = "Aggiorna spesa";
  nascondiFeedbackSpesa();
}

async function eliminaSpesa(id) {
  const confermato = window.confirm("Eliminare questa spesa?");
  if (!confermato) return;

  const { error } = await db.from("spese").delete().eq("id", id);
  if (error) {
    mostraFeedbackSpesa("Errore durante l'eliminazione: " + error.message, "danger");
    return;
  }

  if (String(editingSpesaId) === String(id)) {
    resetSpesaForm();
  }

  await caricaSpeseRecenti();
}

speseTableBody.addEventListener("click", (event) => {
  const bottoneModifica = event.target.closest(".btn-modifica-spesa");
  if (bottoneModifica) {
    iniziaModificaSpesa(bottoneModifica.dataset.id);
    return;
  }

  const bottoneElimina = event.target.closest(".btn-elimina-spesa");
  if (bottoneElimina) {
    eliminaSpesa(bottoneElimina.dataset.id);
  }
});

annullaModificaButton.addEventListener("click", () => {
  resetSpesaForm();
  nascondiFeedbackSpesa();
});

spesaForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  nascondiFeedbackSpesa();

  if (!spesaForm.checkValidity()) {
    spesaForm.reportValidity();
    return;
  }

  const payload = {
    data: spesaDataInput.value,
    importo: parseFloat(spesaImportoInput.value),
    voce_spesa: spesaVoceSelect.value,
    gruppo_spesa: spesaGruppoSelect.value,
    metodo_pagamento: spesaMetodoSelect.value,
    nota: spesaNotaInput.value.trim() || null,
  };

  const { error } = editingSpesaId
    ? await db.from("spese").update(payload).eq("id", editingSpesaId)
    : await db.from("spese").insert(payload);

  if (error) {
    mostraFeedbackSpesa("Errore durante il salvataggio: " + error.message, "danger");
    return;
  }

  mostraFeedbackSpesa("Spesa salvata correttamente", "success");
  resetSpesaForm();
  await caricaSpeseRecenti();
});

async function caricaDatiInserimentoSpesa() {
  spesaDataInput.value = spesaDataInput.value || dataOdiernaISO();
  await Promise.all([caricaVociSpesa(), caricaGruppiSpesa(), caricaSpeseRecenti()]);
}

// ---------------------------------------------------------------------------
// Sezione "Dashboard"
// ---------------------------------------------------------------------------

const dashboardTabButton = document.getElementById("dashboard-tab");
const dashboardMeseFiltro = document.getElementById("dashboard-mese-filtro");
const dashboardTotaleMeseEl = document.getElementById("dashboard-totale-mese");
const dashboardExportCsvButton = document.getElementById("dashboard-export-csv-button");

let tutteLeSpeseCache = [];
const chartInstances = {};

const NOMI_MESI_IT = [
  "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
  "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
];

function meseCorrenteISO() {
  const oggi = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${oggi.getFullYear()}-${pad(oggi.getMonth() + 1)}`;
}

function formatMeseLabel(meseISO) {
  const [anno, mese] = meseISO.split("-");
  return `${NOMI_MESI_IT[parseInt(mese, 10) - 1]} ${anno}`;
}

function aggregaImportiPerChiave(spese, chiave) {
  return spese.reduce((aggregato, spesa) => {
    const chiaveValore = spesa[chiave];
    aggregato[chiaveValore] = (aggregato[chiaveValore] || 0) + Number(spesa.importo);
    return aggregato;
  }, {});
}

function disegnaGrafico(canvasId, config) {
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }
  const canvas = document.getElementById(canvasId);
  chartInstances[canvasId] = new Chart(canvas, config);
}

function filtraSpesePerMese(mese) {
  return tutteLeSpeseCache.filter((spesa) => spesa.data.slice(0, 7) === mese);
}

function aggiornaDashboardMese() {
  const mese = dashboardMeseFiltro.value;
  if (!mese) return;

  const speseMese = filtraSpesePerMese(mese);
  const totale = speseMese.reduce((somma, spesa) => somma + Number(spesa.importo), 0);
  dashboardTotaleMeseEl.textContent = formatImporto(totale);

  const aggregatoVoce = aggregaImportiPerChiave(speseMese, "voce_spesa");
  const aggregatoGruppo = aggregaImportiPerChiave(speseMese, "gruppo_spesa");

  disegnaGrafico("dashboard-chart-voce", {
    type: "pie",
    data: {
      labels: Object.keys(aggregatoVoce),
      datasets: [{ data: Object.values(aggregatoVoce) }],
    },
    options: { plugins: { legend: { position: "bottom" } } },
  });

  disegnaGrafico("dashboard-chart-gruppo", {
    type: "pie",
    data: {
      labels: Object.keys(aggregatoGruppo),
      datasets: [{ data: Object.values(aggregatoGruppo) }],
    },
    options: { plugins: { legend: { position: "bottom" } } },
  });
}

function aggiornaGraficoTrend() {
  const aggregatoMensile = {};
  tutteLeSpeseCache.forEach((spesa) => {
    const chiaveMese = spesa.data.slice(0, 7);
    aggregatoMensile[chiaveMese] = (aggregatoMensile[chiaveMese] || 0) + Number(spesa.importo);
  });

  const mesiOrdinati = Object.keys(aggregatoMensile).sort();

  disegnaGrafico("dashboard-chart-trend", {
    type: "bar",
    data: {
      labels: mesiOrdinati.map(formatMeseLabel),
      datasets: [{ label: "Totale speso", data: mesiOrdinati.map((m) => aggregatoMensile[m]) }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

async function caricaDashboard() {
  const { data, error } = await db.from("spese").select("*");
  if (!error) {
    tutteLeSpeseCache = data || [];
  }
  aggiornaDashboardMese();
  aggiornaGraficoTrend();
}

function escapeCsvCampo(valore) {
  const testo = String(valore ?? "");
  if (/[",;\n]/.test(testo)) {
    return '"' + testo.replace(/"/g, '""') + '"';
  }
  return testo;
}

function creaRigaCsv(campi) {
  return campi.map(escapeCsvCampo).join(",");
}

function esportaCsvMeseSelezionato() {
  const mese = dashboardMeseFiltro.value;
  const speseMese = filtraSpesePerMese(mese).sort((a, b) => a.data.localeCompare(b.data));

  const intestazione = ["Data", "Importo", "Voce spesa", "Gruppo spesa", "Metodo pagamento", "Nota"];
  const righe = speseMese.map((spesa) =>
    creaRigaCsv([
      formatDataIt(spesa.data),
      spesa.importo,
      spesa.voce_spesa,
      spesa.gruppo_spesa,
      spesa.metodo_pagamento,
      spesa.nota || "",
    ])
  );

  const contenutoCsv = [creaRigaCsv(intestazione), ...righe].join("\n");
  const blob = new Blob(["﻿" + contenutoCsv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `spese_${mese}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

dashboardMeseFiltro.value = meseCorrenteISO();
dashboardMeseFiltro.addEventListener("change", aggiornaDashboardMese);
dashboardExportCsvButton.addEventListener("click", esportaCsvMeseSelezionato);
dashboardTabButton.addEventListener("shown.bs.tab", caricaDashboard);
