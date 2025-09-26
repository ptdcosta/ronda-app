const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx2uxQLP6u-Z078F2aSIcW6qqBjJY--XD5Jx3_B6iVg-eV1ky6cCeArOAaKo4v1_DuhKw/exec";
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
const hiddenIframe = document.getElementById('hidden_iframe');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const fields = ['utentes', 'kit', 'sopa', 'cafe', 'roupa'];
let sessionEntries = {};

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    form.action = SCRIPT_URL;
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
        ruaSelect.innerHTML = '<option>Erro ao carregar</option>';
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
 * Handles the main form submission using the reliable iframe method.
 */
function handleFormSubmit(e) {
    e.preventDefault();
    const submitButton = e.target.querySelector('.btn-submit');
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="material-symbols-outlined">sync</span> Guardando...';
    
    // Add the SubmissionID as a hidden input before submitting
    const currentEntry = sessionEntries[ruaSelect.value] || {};
    const submissionIdInput = document.createElement('input');
    submissionIdInput.type = 'hidden';
    submissionIdInput.name = 'SubmissionID';
    submissionIdInput.value = currentEntry.submissionId || '';
    form.appendChild(submissionIdInput);

    localStorage.setItem('lastSelectedRua', ruaSelect.value);
    hiddenIframe.onload = () => {
        alert('Registo guardado com sucesso!');
        location.reload();
    };
    form.submit();
    form.removeChild(submissionIdInput); // Clean up
}

/**
 * Helper function to send an action to the backend using the reliable form method.
 * @param {string} actionName The name of the action.
 * @param {object} payload An optional data payload.
 * @param {string} confirmMsg The confirmation message.
 * @param {string} successMsg The success message.
 * @param {boolean} requiresReload Whether the page should reload after the action.
 */
function sendActionViaForm(actionName, payload = {}, confirmMsg, successMsg, requiresReload = false) {
    if (confirmMsg && !confirm(confirmMsg)) { return; }

    const tempForm = document.createElement('form');
    tempForm.method = 'post';
    tempForm.action = SCRIPT_URL;
    tempForm.target = 'hidden_iframe';
    
    const actionInput = document.createElement('input');
    actionInput.type = 'hidden';
    actionInput.name = 'action';
    actionInput.value = actionName;
    tempForm.appendChild(actionInput);

    for (const key in payload) {
        const payloadInput = document.createElement('input');
        payloadInput.type = 'hidden';
        payloadInput.name = key;
        payloadInput.value = payload[key];
        tempForm.appendChild(payloadInput);
    }
    
    document.body.appendChild(tempForm);
    tempForm.submit();
    
    setTimeout(() => {
        document.body.removeChild(tempForm);
        if (successMsg) { alert(successMsg); }
        if (requiresReload) {
            if (actionName === 'startNewRound') {
                localStorage.removeItem('lastSelectedRua');
            }
            location.reload();
        }
    }, 1500);
}

function generateReport() {
    sendActionViaForm('generateReport', {}, 'Tem a certeza que quer gerar o relatório visível?', 'Relatório gerado com sucesso!');
}

function emailReport() {
    sendActionViaForm('emailReport', {}, 'Tem a certeza que quer enviar o relatório por email?', 'A enviar o email...');
}

function startNewRound() {
    sendActionViaForm('startNewRound', {}, 'Tem a certeza que quer arquivar e começar uma nova ronda?', 'Nova ronda iniciada! A página vai recarregar.', true);
}

function addNewRua() {
    const newRua = newRuaInput.value.trim();
    if (!newRua) return;
    
    sendActionViaForm('addNewRua', { newRua: newRua }, null, 'Nova paragem adicionada com sucesso!');

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
        ruaSelect.innerHTML = '<option>Adicione uma paragem</option>';
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