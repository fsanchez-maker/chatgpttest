const STORAGE_KEY = 'dynamicPrizeWheelConfig';
const defaultSettings = {
  title: 'Gira y descubre tu premio',
  backgroundColor: '#111827',
  titleColor: '#ffffff',
  prizeTextColor: '#ffffff',
};
const defaultColors = ['#ff6b6b', '#ffd166', '#06d6a0', '#118ab2', '#7353ba', '#f15bb5', '#00bbf9', '#f77f00', '#80ed99', '#b5179e', '#4cc9f0', '#ffb703'];
const defaultIcon = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M32 4l8.7 17.6L60 24.4 46 38l3.3 19.2L32 48.1 14.7 57.2 18 38 4 24.4l19.3-2.8z"/></svg>';
let config = loadConfig();
let prizes = config.prizes;
let currentRotation = 0;

const editor = document.querySelector('#prize-editor');
const preview = document.querySelector('#wheel-preview');
const countInput = document.querySelector('#prize-count');
const label = document.querySelector('#segment-count-label');
const playWheel = document.querySelector('#play-wheel');
const spinButton = document.querySelector('#spin-button');
const winnerDialog = document.querySelector('#winner-dialog');
const winnerName = document.querySelector('#winner-name');
const gameTitleInput = document.querySelector('#game-title-input');
const backgroundColorInput = document.querySelector('#background-color-input');
const titleColorInput = document.querySelector('#title-color-input');
const prizeTextColorInput = document.querySelector('#prize-text-color-input');
const playTitle = document.querySelector('#play-title');

if (editor && preview && countInput) {
  document.querySelector('#apply-count').addEventListener('click', () => setPrizeCount(Number(countInput.value)));
  document.querySelector('#download-svg').addEventListener('click', downloadSvg);
  bindSettingsControls();
  setPrizeCount(prizes.length || 8);
}


if (playWheel && spinButton) {
  applyPlaySettings();
  renderPlayWheel();
  spinButton.addEventListener('click', spinWheel);
  document.querySelector('#close-dialog').addEventListener('click', () => winnerDialog.close());
}

function loadConfig() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(stored) && stored.length) return { prizes: stored, settings: { ...defaultSettings } };
    if (stored?.prizes?.length) return {
      prizes: stored.prizes,
      settings: { ...defaultSettings, ...(stored.settings || {}) },
    };
  } catch (error) {
    console.warn('No se pudo leer la configuración guardada.', error);
  }
  return { prizes: createDefaultPrizes(8), settings: { ...defaultSettings } };
}

function saveConfig() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function bindSettingsControls() {
  const controls = [
    [gameTitleInput, 'title'],
    [backgroundColorInput, 'backgroundColor'],
    [titleColorInput, 'titleColor'],
    [prizeTextColorInput, 'prizeTextColor'],
  ];

  controls.forEach(([input, key]) => {
    input.value = config.settings[key];
    input.addEventListener('input', () => {
      config.settings[key] = input.value;
      saveConfig();
      renderWheel();
    });
  });
}

function applyPlaySettings() {
  document.body.style.background = config.settings.backgroundColor;
  if (playTitle) {
    playTitle.textContent = config.settings.title;
    playTitle.style.color = config.settings.titleColor;
  }
}

function createDefaultPrizes(count) {
  return Array.from({ length: count }, (_, index) => ({
    name: `Premio ${index + 1}`,
    color: defaultColors[index % defaultColors.length],
    icon: defaultIcon,
  }));
}

function setPrizeCount(count) {
  const safeCount = Math.min(24, Math.max(1, Number.isFinite(count) ? Math.round(count) : 8));
  countInput.value = safeCount;
  prizes = Array.from({ length: safeCount }, (_, index) => prizes[index] || createDefaultPrizes(safeCount)[index]);
  config.prizes = prizes;
  saveConfig();
  renderEditor();
  renderWheel();
}

function renderEditor() {
  editor.innerHTML = '';
  prizes.forEach((prize, index) => {
    const card = document.createElement('article');
    card.className = 'prize-card';
    card.innerHTML = `
      <h3><span>Rebanada ${index + 1}</span><span style="color:${prize.color}">●</span></h3>
      <div class="prize-grid">
        <label class="field"><span>Nombre del premio</span><input data-index="${index}" data-field="name" value="${escapeAttr(prize.name)}" /></label>
        <label class="field"><span>Color</span><input type="color" data-index="${index}" data-field="color" value="${prize.color}" /></label>
      </div>
      <label class="field"><span>Icono SVG pegado</span><textarea data-index="${index}" data-field="icon">${escapeHtml(prize.icon)}</textarea></label>
      <label class="field file-field"><span>Cargar icono .svg</span><input type="file" accept=".svg,image/svg+xml" data-index="${index}" data-field="file" /></label>
    `;
    editor.appendChild(card);
  });

  editor.querySelectorAll('input[data-field], textarea[data-field]').forEach(input => {
    input.addEventListener('input', handlePrizeInput);
    input.addEventListener('change', handlePrizeInput);
  });
}

function handlePrizeInput(event) {
  const index = Number(event.target.dataset.index);
  const field = event.target.dataset.field;
  if (field === 'file') {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      prizes[index].icon = String(reader.result || '');
      config.prizes = prizes;
      saveConfig();
      renderEditor();
      renderWheel();
    };
    reader.readAsText(file);
    return;
  }
  prizes[index][field] = event.target.value;
  config.prizes = prizes;
  saveConfig();
  renderWheel();
}

function renderWheel() {
  label.textContent = `${prizes.length} premio${prizes.length === 1 ? '' : 's'}`;
  preview.innerHTML = buildWheelSvg({ includePointer: true });
}


function renderPlayWheel() {
  playWheel.innerHTML = buildWheelSvg({ includePointer: false });
}

function spinWheel() {
  spinButton.disabled = true;
  const winnerIndex = Math.floor(Math.random() * prizes.length);
  const step = 360 / prizes.length;
  const winnerMidAngle = -90 + winnerIndex * step + step / 2;
  const extraTurns = 5 + Math.floor(Math.random() * 3);
  const finalRotation = currentRotation + extraTurns * 360 + (270 - winnerMidAngle) - (currentRotation % 360);
  currentRotation = finalRotation;
  playWheel.style.transform = `rotate(${currentRotation}deg)`;

  window.setTimeout(() => {
    winnerName.textContent = prizes[winnerIndex].name;
    winnerDialog.showModal();
    spinButton.disabled = false;
  }, 4300);
}

function buildWheelSvg({ includePointer = true } = {}) {
  const size = 900;
  const center = size / 2;
  const radius = 410;
  const step = 360 / prizes.length;
  const segments = prizes.map((prize, index) => {
    const start = -90 + index * step;
    const end = start + step;
    const mid = start + step / 2;
    const textRadius = radius * 0.62;
    const textPoint = polar(center, center, textRadius, mid);
    const iconPoint = polar(center, center, radius * 0.38, mid);
    const availableTextWidth = Math.max(74, 2 * textRadius * Math.sin((step * Math.PI / 180) / 2) - 56);
    return `
      <path d="${describeArc(center, center, radius, start, end)}" fill="${prize.color}" stroke="#ffffff" stroke-width="5"/>
      <g transform="translate(${iconPoint.x - 32} ${iconPoint.y - 32})" color="#ffffff">${sanitizeSvg(prize.icon)}</g>
      ${buildPrizeText(prize.name, textPoint, mid, availableTextWidth)}`;
  }).join('');
  const pointer = includePointer ? '<path d="M450 18 L485 88 L415 88 Z" fill="#152033" stroke="#ffffff" stroke-width="6"/>' : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900" role="img" aria-label="Rueda de premios">
    <rect width="900" height="900" fill="none"/>
    <circle cx="450" cy="450" r="430" fill="#152033"/>
    ${segments}
    <circle cx="450" cy="450" r="82" fill="#ffffff" stroke="#152033" stroke-width="8"/>
    <circle cx="450" cy="450" r="48" fill="#6d5dfc"/>
    ${pointer}
  </svg>`;
}


function buildPrizeText(name, point, angle, maxWidth) {
  const baseFontSize = 28;
  const minFontSize = 13;
  const lines = wrapPrizeName(name, maxWidth, baseFontSize);
  const longestLine = lines.reduce((longest, line) => Math.max(longest, estimateTextWidth(line, baseFontSize)), 0);
  const fontSize = Math.max(minFontSize, Math.min(baseFontSize, Math.floor(baseFontSize * maxWidth / Math.max(longestLine, 1))));
  const lineHeight = Math.round(fontSize * 1.08);
  const startDy = lines.length === 1 ? 0 : -lineHeight / 2;

  const tspans = lines.map((line, index) => {
    const dy = index === 0 ? startDy : lineHeight;
    const textWidth = Math.min(maxWidth, estimateTextWidth(line, fontSize));
    return `<tspan x="${point.x}" dy="${dy}" textLength="${textWidth}" lengthAdjust="spacingAndGlyphs">${escapeHtml(line)}</tspan>`;
  }).join('');

  return `<text x="${point.x}" y="${point.y}" text-anchor="middle" dominant-baseline="middle" fill="${config.settings.prizeTextColor}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700" transform="rotate(${angle + 90} ${point.x} ${point.y})">${tspans}</text>`;
}

function wrapPrizeName(name, maxWidth, fontSize) {
  const normalized = String(name || '').replace(/\s+/g, ' ').trim() || 'Premio';
  const words = normalized.split(' ');
  const lines = [''];

  words.forEach(word => {
    const current = lines[lines.length - 1];
    const candidate = current ? `${current} ${word}` : word;
    if (lines.length === 1 && current && estimateTextWidth(candidate, fontSize) > maxWidth) {
      lines.push(word);
      return;
    }
    lines[lines.length - 1] = candidate;
  });

  if (lines.length === 1 && estimateTextWidth(lines[0], fontSize) > maxWidth * 1.8) {
    const midpoint = Math.ceil(lines[0].length / 2);
    return [lines[0].slice(0, midpoint), lines[0].slice(midpoint)].map(line => line.trim()).filter(Boolean);
  }

  return lines.slice(0, 2).map(line => line.trim()).filter(Boolean);
}

function estimateTextWidth(text, fontSize) {
  return String(text).length * fontSize * 0.58;
}

function polar(cx, cy, r, angle) {
  const rad = angle * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polar(cx, cy, r, endAngle);
  const end = polar(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${end.x} ${end.y} A ${r} ${r} 0 ${largeArc} 1 ${start.x} ${start.y} Z`;
}

function sanitizeSvg(svg) {
  const cleaned = String(svg || defaultIcon).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  return cleaned.replace(/<svg\b([^>]*)>/i, '<svg$1 width="64" height="64">');
}
function escapeHtml(value) { return String(value).replace(/[&<>"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char])); }
function escapeAttr(value) { return escapeHtml(value).replace(/'/g, '&#39;'); }

function downloadSvg() {
  const blob = new Blob([buildWheelSvg({ includePointer: true })], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'rueda-premios.svg';
  link.click();
  URL.revokeObjectURL(url);
}
