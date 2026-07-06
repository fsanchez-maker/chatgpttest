const defaultColors = ['#ff6b6b', '#ffd166', '#06d6a0', '#118ab2', '#7353ba', '#f15bb5', '#00bbf9', '#f77f00', '#80ed99', '#b5179e', '#4cc9f0', '#ffb703'];
const defaultIcon = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M32 4l8.7 17.6L60 24.4 46 38l3.3 19.2L32 48.1 14.7 57.2 18 38 4 24.4l19.3-2.8z"/></svg>';
let prizes = [];

const editor = document.querySelector('#prize-editor');
const preview = document.querySelector('#wheel-preview');
const countInput = document.querySelector('#prize-count');
const label = document.querySelector('#segment-count-label');

document.querySelector('#apply-count').addEventListener('click', () => setPrizeCount(Number(countInput.value)));
document.querySelector('#download-svg').addEventListener('click', downloadSvg);

function setPrizeCount(count) {
  const safeCount = Math.min(24, Math.max(1, Number.isFinite(count) ? Math.round(count) : 8));
  countInput.value = safeCount;
  prizes = Array.from({ length: safeCount }, (_, index) => prizes[index] || {
    name: `Premio ${index + 1}`,
    color: defaultColors[index % defaultColors.length],
    icon: defaultIcon,
  });
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
      renderEditor();
      renderWheel();
    };
    reader.readAsText(file);
    return;
  }
  prizes[index][field] = event.target.value;
  renderWheel();
}

function renderWheel() {
  label.textContent = `${prizes.length} premio${prizes.length === 1 ? '' : 's'}`;
  preview.innerHTML = buildWheelSvg();
}

function buildWheelSvg() {
  const size = 900;
  const center = size / 2;
  const radius = 410;
  const step = 360 / prizes.length;
  const segments = prizes.map((prize, index) => {
    const start = -90 + index * step;
    const end = start + step;
    const mid = start + step / 2;
    const textPoint = polar(center, center, radius * 0.62, mid);
    const iconPoint = polar(center, center, radius * 0.38, mid);
    return `
      <path d="${describeArc(center, center, radius, start, end)}" fill="${prize.color}" stroke="#ffffff" stroke-width="5"/>
      <g transform="translate(${iconPoint.x - 32} ${iconPoint.y - 32})" color="#ffffff">${sanitizeSvg(prize.icon)}</g>
      <text x="${textPoint.x}" y="${textPoint.y}" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="28" font-weight="700" transform="rotate(${mid + 90} ${textPoint.x} ${textPoint.y})">${escapeHtml(prize.name)}</text>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900" role="img" aria-label="Rueda de premios">
    <rect width="900" height="900" fill="none"/>
    <circle cx="450" cy="450" r="430" fill="#152033"/>
    ${segments}
    <circle cx="450" cy="450" r="82" fill="#ffffff" stroke="#152033" stroke-width="8"/>
    <circle cx="450" cy="450" r="48" fill="#6d5dfc"/>
    <path d="M450 18 L485 88 L415 88 Z" fill="#152033" stroke="#ffffff" stroke-width="6"/>
  </svg>`;
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
  const blob = new Blob([buildWheelSvg()], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'rueda-premios.svg';
  link.click();
  URL.revokeObjectURL(url);
}

setPrizeCount(8);
