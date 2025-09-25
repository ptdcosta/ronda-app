const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzMzxicSiA6h6vO6N-2b58klstgzhUA8Ca0GmOya6fJE_HaAkLqZSqtHTuCTre_cgUXLw/exec";
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
const addRuaModal = document.getElementById('addRuaModal');
const newRuaInput = document.getElementById('newRuaInput');
const modalAddBtn = document.getElementById('modalAddBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const hiddenIframe = document.getElementById('hidden_iframe');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const fields = ['utentes', 'kit', 'sopa', 'cafe', 'roupa'];
let sessionEntries = {};

document.addEventListener('DOMContentLoaded', () => {
    form.action = SCRIPT_URL;
    loadInitialData();
    setupCounters();
    setupFAB();
    setupModal();
    dbLink.href = SHEET_URL;
});

form.addEventListener('submit', handleFormSubmit);
ruaSelect.addEventListener('change', displayDataForSelectedStreet);
newRoundBtn.addEventListener('click', startNewRound);
generateReportBtn.addEventListener('click', generateReport);

// **UPDATED**: Added redirect: "follow" to the fetch call
function loadInitialData() {
    ruaSelect.innerHTML = '<option>A carregar...</option>';
    fetch(SCRIPT_URL, { redirect: "follow" }) // <-- FINAL FIX IS HERE
        .then(res => res.json())
        .then(data => {
            if (data.ruas) { populateRuaDropdown(data.ruas); }
            if (data.totals) { displayTotals(data.totals); }
            if (data.entries) {
                sessionEntries = data.entries;
                displayDataForSelectedStreet();
            }
            if (data.totalStops !== undefined && data.completedStops !== undefined) {
                updateProgressBar(data.completedStops, data.totalStops);
            }
        })
        .catch(error => console.error("Error loading initial data:", error));
}

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

function handleFormSubmit(e) {
    e.preventDefault();
    const submitButton = e.target.querySelector('.btn-submit');
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="material-symbols-outlined">sync</span> Submitting...';
    localStorage.setItem('lastSelectedRua', ruaSelect.value);
    hiddenIframe.onload = () => { location.reload(); };
    form.submit();
}

// ... (The rest of your functions are correct and do not need to be changed)
function generateReport() { /* ... */ }
function setupFAB() { /* ... */ }
function setupModal() { /* ... */ }
function displayDataForSelectedStreet() { /* ... */ }
function displayTotals(totals) { /* ... */ }
function populateRuaDropdown(ruas) { /* ... */ }
function setupCounters() { /* ... */ }
function addNewRua() { /* ... */ }
function startNewRound() { /* ... */ }