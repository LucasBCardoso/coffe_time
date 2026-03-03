const meals = [
    { id: 'schedule-coffem', name: 'Contagem para CAFÉ DA MANHÃ', hour: 9, minute: 30 },
    { id: 'schedule-lunch', name: 'Contagem para ALMOÇO', hour: 12, minute: 0 },
    { id: 'schedule-coffeA', name: 'Contagem para CAFÉ DA TARDE', hour: 15, minute: 0 }
];

const mealNameEl = document.getElementById('meal-name');
const timeLeftEl = document.getElementById('time-left');
const msLeftEl = document.getElementById('ms-left');
const autoModeInfoEl = document.getElementById('auto-mode-info');
const resetAutoBtn = document.getElementById('reset-auto');

let currentActiveMealId = null;
let lastCheeredDateMs = null;
let selectedMealId = null; // Guarda o ID clicado pelo usuário

function triggerConfetti() {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#00d2ff', '#3a7bd5', '#00ff88', '#ffffff']
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#00d2ff', '#3a7bd5', '#00ff88', '#ffffff']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

// Configura o clique nos cartões
document.querySelectorAll('.schedule-item').forEach(item => {
    item.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        selectedMealId = id; // Substitui o comportamento automático

        // Remove active class from all styles reset
        document.querySelectorAll('.schedule-item').forEach(el => {
            el.classList.remove('selected-override');
        });

        // Adiciona classe visual forçada
        e.currentTarget.classList.add('selected-override');

        // Exibe botão de voltar
        autoModeInfoEl.classList.remove('hidden');
    });
});

resetAutoBtn.addEventListener('click', () => {
    selectedMealId = null;
    document.querySelectorAll('.schedule-item').forEach(el => {
        el.classList.remove('selected-override');
    });
    autoModeInfoEl.classList.add('hidden');
});

function updateTimer() {
    const nowMs = Date.now();

    // YYYY-MM-DD em BRT/America_Sao_Paulo
    const svFormatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric', month: '2-digit', day: '2-digit'
    });

    const brtDateString = svFormatter.format(new Date());
    const tomorrowDateString = svFormatter.format(new Date(Date.now() + 86400000));

    let targetMeal = null;
    let targetTimeMs = null;

    if (selectedMealId) {
        // Usuário escolheu manualmente ver o tempo até X refeição
        targetMeal = meals.find(m => m.id === selectedMealId);
        const hh = String(targetMeal.hour).padStart(2, '0');
        const mm = String(targetMeal.minute).padStart(2, '0');

        let candidateTimeMs = new Date(`${brtDateString}T${hh}:${mm}:00-03:00`).getTime();

        // Se a refeição escolhida já passou e não está na "margem do minuto comemorativo",
        // joga automaticamente o alvo para a de amanhã!
        if (candidateTimeMs + 60000 <= nowMs) {
            candidateTimeMs = new Date(`${tomorrowDateString}T${hh}:${mm}:00-03:00`).getTime();
        }
        targetTimeMs = candidateTimeMs;
    } else {
        // Modo automático: vasculha de forma sequencial
        for (const meal of meals) {
            const hh = String(meal.hour).padStart(2, '0');
            const mm = String(meal.minute).padStart(2, '0');

            const candidateTimeMs = new Date(`${brtDateString}T${hh}:${mm}:00-03:00`).getTime();

            // Segura em 00:00:00 por 1 minuto (60000ms) pra garantir a comemoração
            if (candidateTimeMs + 60000 > nowMs) {
                targetMeal = meal;
                targetTimeMs = candidateTimeMs;
                break;
            }
        }

        // Se todas as refeições do dia já passaram, pega o café da manhã de amanhã
        if (!targetMeal) {
            targetMeal = meals[0];
            const hh = String(targetMeal.hour).padStart(2, '0');
            const mm = String(targetMeal.minute).padStart(2, '0');
            targetTimeMs = new Date(`${tomorrowDateString}T${hh}:${mm}:00-03:00`).getTime();
        }
    }

    let diffMs = targetTimeMs - nowMs;

    // Disparo automático quando tempo atinge 0
    if (diffMs <= 0) {
        diffMs = 0; // Trava o mostrador em 0
        if (lastCheeredDateMs !== targetTimeMs) {
            triggerConfetti();
            lastCheeredDateMs = targetTimeMs;
        }
    }

    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    const ms = diffMs % 1000;

    const strH = String(hours).padStart(2, '0');
    const strM = String(minutes).padStart(2, '0');
    const strS = String(seconds).padStart(2, '0');
    const strMs = String(ms).padStart(3, '0');

    // Atualiza o DOM
    if (mealNameEl.textContent !== targetMeal.name) {
        mealNameEl.textContent = targetMeal.name;
    }
    timeLeftEl.textContent = `${strH}:${strM}:${strS}`;
    msLeftEl.textContent = `.${strMs}`;

    // Adiciona "active" a refeição atual se estiver no modo automático
    if (!selectedMealId) {
        if (currentActiveMealId !== targetMeal.id) {
            meals.forEach(m => {
                const el = document.getElementById(m.id);
                if (el) el.classList.remove('active');
            });
            const targetEl = document.getElementById(targetMeal.id);
            if (targetEl) targetEl.classList.add('active');

            currentActiveMealId = targetMeal.id;
        }
    } else {
        // Se está no modo selecionado, limpa o state de active "móvel"
        meals.forEach(m => {
            const el = document.getElementById(m.id);
            if (el) el.classList.remove('active');
        });
        currentActiveMealId = null;
    }

    requestAnimationFrame(updateTimer);
}

// Inicializa
requestAnimationFrame(updateTimer);

// Botão comemorativo ativado manualmente
document.getElementById('cheer-btn').addEventListener('click', triggerConfetti);
