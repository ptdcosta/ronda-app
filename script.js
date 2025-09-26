const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwo9m9vJ5TOnDJdUMCn4KefqLuHSQ6XeTxoO7iuH2UIpIPQ0OPQtF80H_87qScFKMkDlQ/exec";
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1yAm_nYTCJ9urDiPv4kp965jwaxV_TSZw1ZyTBkQXsVY/edit?gid=1545989912#gid=1545989912";


// --- DOM Elements ---
const form = document.getElementById('entryForm');
const ruaSelect = document.getElementById('ruaSelect');
const dbLink = document.getElementById('dbLink');
const fabContainer = document.querySelector('.fab-container');
const fabMain = document.querySelector('.fab-main');
const addRuaBtn = document.getElementById('addRuaBtn');
const newRoundBtn = document.getElementById('newRoundBtn');
const generateReportBtn = document.getElementById('generateReportBtn');
const emailReportBtn = document.getElementById('emailReportBtn');
const addRuaModal = document.getElementById('addRuaModal');
const newRuaInput = document.getElementById('newRuaInput');
const modalAddBtn = document.getElementById('modalAddBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const fields = ['utentes', 'kit', 'sopa', 'cafe', 'roupa'];
let sessionEntries = {};

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    loadInitialData();
    setupCounters();
    setupFAB();
    setupModal();
    dbLink.href = SHEET_URL;
});

// --- Event Listeners ---
form.addEventListener('submit', handleFormSubmit);
ruaSelect.addEventListener('change', displayDataForSelectedStreet);
newRoundBtn.addEventListener('click', startNewRound);
generateReportBtn.addEventListener('click', generateReport);
emailReportBtn.addEventListener('click', emailReport);

/**
 * This is the callback function that receives data from the Google Script.
 * @param {object} data The data object returned from the script.
 */
function handleDataResponse(data) {
    if (data.error) {
        console.error("Error from Google Script:", data.error);
        return;
    }
    if (data.ruas) { populateRuaDropdown(data.ruas); }
    if (data.totals) { displayTotals(data.totals); }
    if (data.entries) {
        sessionEntries = data.entries;
        displayDataForSelectedStreet();
    }
    if (data.totalStops !== undefined && data.completedStops !== undefined) {
        updateProgressBar(data.completedStops, data.totalStops);
    }
}

/**
 * Loads the initial data from the Google Script using the JSONP method.
 */
function loadInitialData() {
    ruaSelect.innerHTML = '<option>A carregar...</option>';
    const oldScript = document.getElementById('jsonp_script');
    if (oldScript) {
        oldScript.remove();
    }
    const script = document.createElement('script');
    script.id = 'jsonp_script';
    script.src = `${SCRIPT_URL}?callback=handleDataResponse`; 
    document.head.appendChild(script);
}

/**
 * Handles the main form submission for creating or updating an entry.
 */
function handleFormSubmit(e) {
    e.preventDefault();
    const submitButton = e.target.querySelector('.btn-submit');
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="material-symbols-outlined">sync</span> Guardando...';

    const selectedRua = ruaSelect.value;
    const currentEntry = sessionEntries[selectedRua] || {};
    
    const payload = {
        submissionId: currentEntry.submissionId || null,
        Rua: selectedRua,
        Utentes: document.getElementById('utentes').value,
        Kit: document.getElementById('kit').value,
        Sopa: document.getElementById('sopa').value,
        Cafe: document.getElementById('cafe').value,
        Roupa: document.getElementById('roupa').value
    };

    if (payload.submissionId) {
        payload.SubmissionID = payload.submissionId;
    }

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveEntry', payload: payload })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'created' || data.status === 'updated') {
            alert('Registo guardado com sucesso!');
            localStorage.setItem('lastSelectedRua', selectedRua);
            location.reload(); 
        } else {
            throw new Error(data.message || 'Ocorreu um erro desconhecido.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Falha ao guardar os dados. Por favor, tente novamente.');
        submitButton.disabled = false;
        submitButton.innerHTML = '<span class="material-symbols-outlined">send</span> Submeter Registo';
    });
}

/**
 * Sends an action to the backend with a simple payload.
 * @param {string} action The name of the action to perform.
 * @param {object} payload An optional data payload.
 * @param {string} confirmMsg A message to show in a confirmation dialog.
 * @param {string} successMsg A message to show on success.
 */
function sendAction(action, payload = {}, confirmMsg, successMsg) {
    if (confirmMsg && !confirm(confirmMsg)) { return; }

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action, payload: payload })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            alert(successMsg);
            if (action === 'startNewRound') {
                localStorage.removeItem('lastSelectedRua');
                location.reload();
            }
        } else {
            throw new Error(data.message || 'An unknown error occurred.');
        }
    })
    .catch(error => {
        alert(`Error: ${error.message}`);
    });
}

function generateReport() {
    sendAction('generateReport', {}, 'Tem a certeza que quer gerar o relatório visível?', 'Relatório gerado com sucesso na sua Google Sheet!');
}

function emailReport() {
    sendAction('emailReport', {}, 'Tem a certeza que quer enviar o relatório por email?', 'A enviar o email... Por favor aguarde.');
}

function startNewRound() {
    sendAction('startNewRound', {}, 'Tem a certeza que quer arquivar os dados e começar uma nova ronda?', 'Nova ronda iniciada! A página vai recarregar.');
}

function addNewRua() {
    const newRua = newRuaInput.value.trim();
    if (!newRua) return;

    sendAction('addNewRua', { newRua: newRua }, null, 'Nova paragem adicionada com sucesso!');

    const newOption = document.createElement('option');
    newOption.value = newRua;
    newOption.textContent = newRua;
    ruaSelect.appendChild(newOption);
    ruaSelect.value = newRua;
    newRuaInput.value = '';
    addRuaModal.style.display = 'none';
}

// --- UI & Helper Functions ---
function updateProgressBar(completed, total) {
    if (total === 0) {
        progressText.textContent = "Adicione paragens em Sheet2";
        progressBar.style.width = '0%';
        return;
    }
    const percentage = Math.round((completed / total) * 100);
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${completed} / ${total} Paragens Concluídas (${percentage}%)`;
}

function setupFAB() {
    fabMain.addEventListener('click', () => { fabContainer.classList.toggle('active'); });
}

function setupModal() {
    addRuaBtn.addEventListener('click', () => { addRuaModal.style.display = 'flex'; });
    modalCancelBtn.addEventListener('click', () => { addRuaModal.style.display = 'none'; });
    modalAddBtn.addEventListener('click', addNewRua);
}

function displayDataForSelectedStreet() {
    const selectedRua = ruaSelect.value;
    const entry = sessionEntries[selectedRua];
    if (entry) {
        fields.forEach(field => { document.getElementById(field).value = entry[field] || 0; });
    } else {
        fields.forEach(field => { document.getElementById(field).value = 0; });
    }
}

function displayTotals(totals) {
    document.getElementById('totalUtentes').textContent = totals.utentes || 0;
    document.getElementById('totalKit').textContent = totals.kit || 0;
    document.getElementById('totalSopa').textContent = totals.sopa || 0;
    document.getElementById('totalCafe').textContent = totals.cafe || 0;
    document.getElementById('totalRoupa').textContent = totals.roupa || 0;
}

function populateRuaDropdown(ruas) {
    if (ruas.length > 0) {
        ruaSelect.innerHTML = ruas.map(rua => `<option value="${rua}">${rua}</option>`).join('');
        const lastSelectedRua = localStorage.getItem('lastSelectedRua');
        if (lastSelectedRua && ruas.includes(lastSelectedRua)) {
            ruaSelect.value = lastSelectedRua;
        }
    } else {
        ruaSelect.innerHTML = '<option>Add a stop</option>';
    }
}

function setupCounters() {
    document.querySelectorAll('.btn-plus, .btn-minus').forEach(button => {
        button.addEventListener('click', (e) => {
            const field = e.target.dataset.field;
            const input = document.getElementById(field);
            let value = parseInt(input.value, 10);
            value += e.target.classList.contains('btn-plus') ? 1 : -1;
            input.value = Math.max(0, value);
        });
    });
}