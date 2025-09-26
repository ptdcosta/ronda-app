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
    
    // Create a temporary form to submit the data.
    const tempForm = document.createElement('form');
    tempForm.method = 'post';
    tempForm.action = SCRIPT_URL;
    tempForm.target = 'hidden_iframe';
    
    // Add all the data fields to the form
    const currentEntry = sessionEntries[ruaSelect.value] || {};
    const payload = {
        SubmissionID: currentEntry.submissionId || '',
        Timestamp: '', // This will be handled by the script
        Rua: ruaSelect.value,
        Utentes: document.getElementById('utentes').value,
        Kit: document.getElementById('kit').value,
        Sopa: document.getElementById('sopa').value,
        Cafe: document.getElementById('cafe').value,
        Roupa: document.getElementById('roupa').value
    };

    for (const key in payload) {
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = key;
        hiddenInput.value = payload[key];
        tempForm.appendChild(hiddenInput);
    }

    document.body.appendChild(tempForm);
    tempForm.submit();
    
    setTimeout(() => {
        document.body.removeChild(tempForm);
        alert('Registo guardado com sucesso!');
        localStorage.setItem('lastSelectedRua', ruaSelect.value);
        location.reload();
    }, 1500);
}

/**
 * Helper function to send an action to the backend using the reliable form method.
 * @param {string} actionName The name of the action.
 * @param {string} confirmMsg The confirmation message.
 * @param {string} successMsg The success message.
 * @param {boolean} requiresReload Whether the page should reload after the action.
 */
function sendActionViaForm(actionName, confirmMsg, successMsg, requiresReload = false) {
    if (confirmMsg && !confirm(confirmMsg)) { return; }

    const tempForm = document.createElement('form');
    tempForm.method = 'post';
    tempForm.action = SCRIPT_URL;
    tempForm.target = 'hidden_iframe';
    
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'action';
    hiddenInput.value = actionName;
    tempForm.appendChild(hiddenInput);
    
    document.body.appendChild(tempForm);
    tempForm.submit();
    
    setTimeout(() => {
        document.body.removeChild(tempForm);
        alert(successMsg);
        if (requiresReload) {
            if (actionName === 'startNewRound') {
                localStorage.removeItem('lastSelectedRua');
            }
            location.reload();
        }
    }, 1500);
}


function generateReport() {
    sendActionViaForm('generateReport', 'Tem a certeza que quer gerar o relatório visível?', 'Relatório gerado com sucesso na sua Google Sheet!');
}

function emailReport() {
    sendActionViaForm('emailReport', 'Tem a certeza que quer enviar o relatório por email?', 'A enviar o email... Por favor aguarde.');
}

function startNewRound() {
    sendActionViaForm('startNewRound', 'Tem a certeza que quer arquivar os dados e começar uma nova ronda?', 'Nova ronda iniciada! A página vai recarregar.', true);
}

function addNewRua() {
    const newRua = newRuaInput.value.trim();
    if (!newRua) return;

    const tempForm = document.createElement('form');
    tempForm.method = 'post';
    tempForm.action = SCRIPT_URL;
    tempForm.target = 'hidden_iframe';
    
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'newRua';
    hiddenInput.value = newRua;
    tempForm.appendChild(hiddenInput);
    
    document.body.appendChild(tempForm);
    tempForm.submit();

    setTimeout(() => {
        document.body.removeChild(tempForm);
        const newOption = document.createElement('option');
        newOption.value = newRua;
        newOption.textContent = newRua;
        ruaSelect.appendChild(newOption);
        ruaSelect.value = newRua;
        newRuaInput.value = '';
        alert('Nova paragem adicionada com sucesso!');
    }, 1000);
    
    addRuaModal.style.display = 'none';
}

// --- UI & Helper Functions ---
function updateProgressBar(completed, total) { /* ... */ }
function setupFAB() { /* ... */ }
function setupModal() { /* ... */ }
function displayDataForSelectedStreet() { /* ... */ }
function displayTotals(totals) { /* ... */ }
function populateRuaDropdown(ruas) { /* ... */ }
function setupCounters() { /* ... */ }