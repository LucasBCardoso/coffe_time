const events = [
  {
    id: "schedule-coffem",
    name: "Contagem para CAFÉ DA MANHÃ",
    hour: 9,
    minute: 30,
    emoji: "☕",
    buttonText: "🎉 Comemorar!",
    buttonType: "celebrate",
    particleType: "confetti",
  },
  {
    id: "schedule-lunch",
    name: "Contagem para ALMOÇO",
    hour: 12,
    minute: 0,
    emoji: "🍽️",
    buttonText: "🎉 Comemorar!",
    buttonType: "celebrate",
    particleType: "confetti",
  },
  {
    id: "schedule-coffeA",
    name: "Contagem para CAFÉ DA TARDE",
    hour: 15,
    minute: 0,
    emoji: "☕",
    buttonText: "🎉 Comemorar!",
    buttonType: "celebrate",
    particleType: "confetti",
  },
  {
    id: "schedule-home",
    name: "Contagem para IR PARA CASA",
    hour: 17,
    minute: 18,
    emoji: "🏠",
    buttonText: "😭 Chorar!",
    buttonType: "cry",
    particleType: "droplets",
  },
];

const mealNameEl = document.getElementById("meal-name");
const timeLeftEl = document.getElementById("time-left");
const msLeftEl = document.getElementById("ms-left");
const autoModeInfoEl = document.getElementById("auto-mode-info");
const resetAutoBtn = document.getElementById("reset-auto");
const cheerBtn = document.getElementById("cheer-btn");

let currentActiveMealId = null;
let lastCheeredDateMs = null;
let selectedMealId = null; // Guarda o ID clicado pelo usuário
let currentParticleType = "confetti"; // Rastreia o tipo de partícula

function triggerConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#00d2ff", "#3a7bd5", "#00ff88", "#ffffff"],
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#00d2ff", "#3a7bd5", "#00ff88", "#ffffff"],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

function triggerDroplets() {
  const canvas = document.getElementById("confetti");
  const ctx = canvas.getContext("2d");
  const duration = 3000;
  const end = Date.now() + duration;
  const droplets = [];

  // Cria gotas d'água
  for (let i = 0; i < 50; i++) {
    droplets.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 4 + 2,
      speedY: Math.random() * 3 + 2,
      speedX: (Math.random() - 0.5) * 1,
      opacity: 1,
    });
  }

  (function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    droplets.forEach((drop, index) => {
      drop.y += drop.speedY;
      drop.x += drop.speedX;
      drop.opacity -= 0.003;

      ctx.globalAlpha = drop.opacity;
      ctx.fillStyle = "#3a9eff";
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, drop.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  })();
}

function triggerParticles(particleType = "confetti") {
  if (particleType === "droplets") {
    triggerDroplets();
  } else {
    triggerConfetti();
  }
}

// Configura o clique nos cartões
document.querySelectorAll(".schedule-item").forEach((item) => {
  item.addEventListener("click", (e) => {
    const id = e.currentTarget.dataset.id;
    const selectedEvent = events.find((ev) => ev.id === id);
    selectedMealId = id; // Substitui o comportamento automático

    // Atualiza o tipo de partícula baseado no evento selecionado
    if (selectedEvent) {
      currentParticleType = selectedEvent.particleType;
      cheerBtn.textContent = selectedEvent.buttonText;
      cheerBtn.className = `cheer-button ${selectedEvent.buttonType}-button`;
    }

    // Remove active class from all styles reset
    document.querySelectorAll(".schedule-item").forEach((el) => {
      el.classList.remove("selected-override");
    });

    // Adiciona classe visual forçada
    e.currentTarget.classList.add("selected-override");

    // Exibe botão de voltar
    autoModeInfoEl.classList.remove("hidden");
  });
});

resetAutoBtn.addEventListener("click", () => {
  selectedMealId = null;
  document.querySelectorAll(".schedule-item").forEach((el) => {
    el.classList.remove("selected-override");
  });
  autoModeInfoEl.classList.add("hidden");
  // Reseta para o botão padrão
  currentParticleType = "confetti";
  cheerBtn.textContent = "🎉 Comemorar!";
  cheerBtn.className = "cheer-button celebrate-button";
});

function updateTimer() {
  const nowMs = Date.now();

  // YYYY-MM-DD em BRT/America_Sao_Paulo
  const svFormatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const brtDateString = svFormatter.format(new Date());
  const tomorrowDateString = svFormatter.format(
    new Date(Date.now() + 86400000),
  );

  let targetMeal = null;
  let targetTimeMs = null;

  if (selectedMealId) {
    // Usuário escolheu manualmente ver o tempo até X refeição
    targetMeal = events.find((m) => m.id === selectedMealId);
    const hh = String(targetMeal.hour).padStart(2, "0");
    const mm = String(targetMeal.minute).padStart(2, "0");

    let candidateTimeMs = new Date(
      `${brtDateString}T${hh}:${mm}:00-03:00`,
    ).getTime();

    // Se a refeição escolhida já passou e não está na "margem do minuto comemorativo",
    // joga automaticamente o alvo para a de amanhã!
    if (candidateTimeMs + 60000 <= nowMs) {
      candidateTimeMs = new Date(
        `${tomorrowDateString}T${hh}:${mm}:00-03:00`,
      ).getTime();
    }
    targetTimeMs = candidateTimeMs;
  } else {
    // Modo automático: vasculha de forma sequencial
    for (const meal of events) {
      const hh = String(meal.hour).padStart(2, "0");
      const mm = String(meal.minute).padStart(2, "0");

      const candidateTimeMs = new Date(
        `${brtDateString}T${hh}:${mm}:00-03:00`,
      ).getTime();

      // Segura em 00:00:00 por 1 minuto (60000ms) pra garantir a comemoração
      if (candidateTimeMs + 60000 > nowMs) {
        targetMeal = meal;
        targetTimeMs = candidateTimeMs;
        break;
      }
    }

    // Se todas as refeições do dia já passaram, pega o café da manhã de amanhã
    if (!targetMeal) {
      targetMeal = events[0];
      const hh = String(targetMeal.hour).padStart(2, "0");
      const mm = String(targetMeal.minute).padStart(2, "0");
      targetTimeMs = new Date(
        `${tomorrowDateString}T${hh}:${mm}:00-03:00`,
      ).getTime();
    }
  }

  let diffMs = targetTimeMs - nowMs;

  // Disparo automático quando tempo atinge 0
  if (diffMs <= 0) {
    diffMs = 0; // Trava o mostrador em 0
    if (lastCheeredDateMs !== targetTimeMs) {
      triggerParticles(targetMeal.particleType);
      lastCheeredDateMs = targetTimeMs;
    }
  }

  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  const ms = diffMs % 1000;

  const strH = String(hours).padStart(2, "0");
  const strM = String(minutes).padStart(2, "0");
  const strS = String(seconds).padStart(2, "0");
  const strMs = String(ms).padStart(3, "0");

  // Atualiza o DOM
  if (mealNameEl.textContent !== targetMeal.name) {
    mealNameEl.textContent = targetMeal.name;
  }
  timeLeftEl.textContent = `${strH}:${strM}:${strS}`;
  msLeftEl.textContent = `.${strMs}`;

  // Adiciona "active" a refeição atual se estiver no modo automático
  if (!selectedMealId) {
    if (currentActiveMealId !== targetMeal.id) {
      events.forEach((m) => {
        const el = document.getElementById(m.id);
        if (el) el.classList.remove("active");
      });
      const targetEl = document.getElementById(targetMeal.id);
      if (targetEl) targetEl.classList.add("active");

      currentActiveMealId = targetMeal.id;
    }
  } else {
    // Se está no modo selecionado, limpa o state de active "móvel"
    events.forEach((m) => {
      const el = document.getElementById(m.id);
      if (el) el.classList.remove("active");
    });
    currentActiveMealId = null;
  }

  requestAnimationFrame(updateTimer);
}

// Inicializa
requestAnimationFrame(updateTimer);

// Botão comemorativo/específico ativado manualmente
cheerBtn.addEventListener("click", () => triggerParticles(currentParticleType));
