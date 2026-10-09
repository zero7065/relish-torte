import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '..', 'client', 'public', 'images');
fs.mkdirSync(out, { recursive: true });

const OUTLINE = '#4A2C2126';

function base(w, h, c1, c2, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.6">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
${inner}
</svg>
`;
}

function sparkles(points) {
  return points
    .map(
      ([x, y, s]) =>
        `<path transform="translate(${x},${y}) scale(${s})" d="M0 -14 Q2.5 -2.5 14 0 Q2.5 2.5 0 14 Q-2.5 2.5 -14 0 Q-2.5 -2.5 0 -14 Z" fill="#ffffff" opacity="0.85"/>`
    )
    .join('\n  ');
}

function cupcake(cx, cy, s) {
  return `<g transform="translate(${cx},${cy}) scale(${s})">
    <ellipse cx="0" cy="128" rx="92" ry="16" fill="#00000022"/>
    <path d="M-75 -12 L75 -12 L56 105 Q0 122 -56 105 Z" fill="#ffffff" stroke="${OUTLINE}" stroke-width="4"/>
    <path d="M-42 -8 L-33 110 M0 -8 L0 114 M42 -8 L33 110" stroke="#0000001c" stroke-width="7" stroke-linecap="round"/>
    <path d="M-82 -14 C-78 -80 78 -80 82 -14 Z" fill="#ffffff" stroke="${OUTLINE}" stroke-width="4"/>
    <circle cx="-46" cy="-48" r="31" fill="#ffffff"/>
    <circle cx="46" cy="-48" r="31" fill="#ffffff"/>
    <circle cx="0" cy="-82" r="35" fill="#ffffff"/>
    <circle cx="0" cy="-126" r="17" fill="#C2705A"/>
    <circle cx="-5" cy="-131" r="5" fill="#ffffff" opacity="0.7"/>
  </g>`;
}

function cake(cx, cy, s) {
  return `<g transform="translate(${cx},${cy}) scale(${s})">
    <ellipse cx="0" cy="150" rx="190" ry="24" fill="#00000022"/>
    <rect x="-155" y="25" width="310" height="125" rx="18" fill="#ffffff" stroke="${OUTLINE}" stroke-width="4"/>
    <path d="M-155 62 h310" stroke="#00000014" stroke-width="6"/>
    <rect x="-105" y="-70" width="210" height="95" rx="15" fill="#ffffff" stroke="${OUTLINE}" stroke-width="4"/>
    <path d="M-105 -32 h210" stroke="#00000014" stroke-width="6"/>
    <path d="M-44 -70 v-66 M0 -70 v-76 M44 -70 v-66" stroke="#4A2C21" stroke-width="9" stroke-linecap="round"/>
    <g fill="#ffffff" stroke="${OUTLINE}" stroke-width="3">
      <circle cx="-84" cy="-70" r="24"/><circle cx="-42" cy="-70" r="24"/>
      <circle cx="0" cy="-70" r="24"/><circle cx="42" cy="-70" r="24"/><circle cx="84" cy="-70" r="24"/>
    </g>
    <g fill="#C9A227">
      <ellipse cx="-44" cy="-152" rx="9" ry="15"/>
      <ellipse cx="0" cy="-166" rx="10" ry="17"/>
      <ellipse cx="44" cy="-152" rx="9" ry="15"/>
    </g>
    <g fill="#ffffff" opacity="0.75">
      <ellipse cx="-46" cy="-156" rx="3" ry="6"/>
      <ellipse cx="-2" cy="-171" rx="3" ry="6"/>
      <ellipse cx="42" cy="-156" rx="3" ry="6"/>
    </g>
    <circle cx="-70" cy="95" r="8" fill="#00000015"/><circle cx="30" cy="88" r="8" fill="#00000015"/><circle cx="90" cy="110" r="8" fill="#00000015"/>
  </g>`;
}

function loaf(cx, cy, s) {
  return `<g transform="translate(${cx},${cy}) scale(${s})">
    <ellipse cx="0" cy="145" rx="175" ry="22" fill="#00000022"/>
    <path d="M-145 135 L-145 -8 Q-145 -85 -72 -85 L72 -85 Q145 -85 145 -8 L145 135 Z" fill="#ffffff" stroke="${OUTLINE}" stroke-width="4"/>
    <path d="M-118 -20 Q0 -66 118 -20" stroke="#00000020" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M-62 -78 L-62 135 M48 -78 L48 135" stroke="#00000018" stroke-width="7"/>
    <g fill="#4A2C21" opacity="0.55">
      <circle cx="-95" cy="55" r="11"/><circle cx="-20" cy="25" r="11"/><circle cx="90" cy="70" r="11"/><circle cx="15" cy="95" r="9"/>
    </g>
  </g>`;
}

function samosa(cx, cy, s) {
  return `<g transform="translate(${cx},${cy}) scale(${s})">
    <ellipse cx="0" cy="118" rx="140" ry="20" fill="#00000022"/>
    <path d="M0 -115 L128 100 L-128 100 Z" fill="#ffffff" stroke="#ffffff" stroke-width="30" stroke-linejoin="round"/>
    <path d="M0 -115 L128 100 L-128 100 Z" fill="#ffffff" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M0 -85 L0 100" stroke="#00000020" stroke-width="7" stroke-linecap="round"/>
    <path d="M0 -85 L86 70" stroke="#00000016" stroke-width="6" stroke-linecap="round"/>
    <g fill="#4A2C21" opacity="0.5">
      <circle cx="-40" cy="45" r="7"/><circle cx="35" cy="60" r="7"/><circle cx="-5" cy="5" r="6"/>
    </g>
  </g>`;
}

function meatPie(cx, cy, s) {
  const crimp = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return `<circle cx="${(Math.cos(a) * 118).toFixed(1)}" cy="${(Math.sin(a) * 118).toFixed(1)}" r="17"/>`;
  }).join('');
  return `<g transform="translate(${cx},${cy}) scale(${s})">
    <ellipse cx="0" cy="132" rx="150" ry="20" fill="#00000022"/>
    <g fill="#ffffff">${crimp}</g>
    <circle cx="0" cy="0" r="116" fill="#ffffff" stroke="${OUTLINE}" stroke-width="4"/>
    <circle cx="0" cy="0" r="92" fill="none" stroke="#00000016" stroke-width="5"/>
    <path d="M-42 -14 L42 -14 M-30 26 L30 26" stroke="#00000022" stroke-width="8" stroke-linecap="round"/>
    <circle cx="0" cy="0" r="132" fill="none" stroke="${OUTLINE}" stroke-width="4"/>
  </g>`;
}

function sausageRoll(cx, cy, s) {
  return `<g transform="translate(${cx},${cy}) rotate(-18) scale(${s})">
    <ellipse cx="0" cy="72" rx="150" ry="18" fill="#00000022"/>
    <rect x="-150" y="-58" width="300" height="116" rx="58" fill="#ffffff" stroke="${OUTLINE}" stroke-width="4"/>
    <path d="M-95 -56 L-55 56 M-32 -56 L8 56 M31 -56 L71 56 M94 -56 L134 56" stroke="#0000001c" stroke-width="15" stroke-linecap="round"/>
  </g>`;
}

function doughnut(cx, cy, s) {
  const sprinkleColors = ['#C2705A', '#4A2C21', '#C9A227', '#8A4B6A'];
  const sprinkles = [
    [-72, -58, 32], [-30, -88, -15], [46, -78, 20], [84, -34, 60],
    [78, 42, -40], [30, 86, 15], [-42, 82, -25], [-86, 36, 55],
    [0, -46, 0], [-58, 12, 75], [58, 8, -70],
  ]
    .map(
      ([x, y, r], i) =>
        `<path d="M-9 0 H9" stroke="${sprinkleColors[i % sprinkleColors.length]}" stroke-width="7" stroke-linecap="round" transform="translate(${x},${y}) rotate(${r})"/>`
    )
    .join('');
  return `<g transform="translate(${cx},${cy}) scale(${s})">
    <ellipse cx="0" cy="132" rx="135" ry="20" fill="#00000022"/>
    <path fill-rule="evenodd" d="M0 -128 A128 128 0 1 0 0 128 A128 128 0 1 0 0 -128 Z M0 -48 A48 48 0 1 1 0 48 A48 48 0 1 1 0 -48 Z" fill="#ffffff" stroke="${OUTLINE}" stroke-width="4"/>
    <circle cx="0" cy="0" r="88" fill="none" stroke="#00000014" stroke-width="6"/>
    ${sprinkles}
  </g>`;
}

function confetti(count, w, h) {
  const colors = ['#C2705A', '#E8B4B8', '#C9A227', '#4A2C21'];
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = (i * 137 + 53) % w;
    const y = (i * 89 + 31) % h;
    const c = colors[i % colors.length];
    const r = (i * 47) % 180;
    if (i % 3 === 0) {
      out += `<circle cx="${x}" cy="${y}" r="${6 + (i % 5)}" fill="${c}" opacity="0.35"/>`;
    } else {
      out += `<rect x="-9" y="-4" width="18" height="8" rx="4" fill="${c}" opacity="0.35" transform="translate(${x},${y}) rotate(${r})"/>`;
    }
  }
  return out;
}

const files = {
  'cupcake-6.svg': base(800, 600, '#FBE9EC', '#F3C9CF', `  ${sparkles([[120, 130, 1], [680, 170, 0.8], [180, 470, 0.7], [640, 460, 1]])}
  ${cupcake(320, 310, 0.85)}${cupcake(510, 340, 0.7)}`),
  'cupcake-12.svg': base(800, 600, '#F8E0E4', '#EEB6BF', `  ${sparkles([[110, 150, 0.9], [700, 130, 1], [140, 480, 0.8], [660, 470, 0.9]])}
  ${cupcake(230, 350, 0.6)}${cupcake(400, 320, 0.66)}${cupcake(570, 350, 0.6)}`),
  'cake-chocolate.svg': base(800, 600, '#8C6251', '#4A2C21', `  ${sparkles([[130, 140, 1], [670, 160, 0.8], [170, 460, 0.7], [650, 450, 1]])}
  ${cake(400, 305, 0.92)}`),
  'cake-vanilla.svg': base(800, 600, '#F6E7C9', '#E9C97A', `  ${sparkles([[130, 140, 1], [670, 160, 0.8], [170, 460, 0.7], [650, 450, 1]])}
  ${cake(400, 305, 0.92)}`),
  'cake-red-velvet.svg': base(800, 600, '#B3453F', '#7A2420', `  ${sparkles([[130, 140, 1], [670, 160, 0.8], [170, 460, 0.7], [650, 450, 1]])}
  ${cake(400, 305, 0.92)}`),
  'cake-carrot.svg': base(800, 600, '#F2C58B', '#D98E4B', `  ${sparkles([[130, 140, 1], [670, 160, 0.8], [170, 460, 0.7], [650, 450, 1]])}
  ${cake(400, 305, 0.92)}`),
  'cake-coconut.svg': base(800, 600, '#F5F1E8', '#DCD2BE', `  ${sparkles([[130, 140, 1], [670, 160, 0.8], [170, 460, 0.7], [650, 450, 1]])}
  ${cake(400, 305, 0.92)}`),
  'cake-fruit.svg': base(800, 600, '#C08A5A', '#8A5A38', `  ${sparkles([[130, 140, 1], [670, 160, 0.8], [170, 460, 0.7], [650, 450, 1]])}
  ${cake(400, 305, 0.92)}`),
  'cake-banana.svg': base(800, 600, '#EBD3A1', '#CBA45E', `  ${sparkles([[130, 140, 1], [670, 160, 0.8], [170, 460, 0.7], [650, 450, 1]])}
  ${loaf(400, 300, 0.95)}`),
  'cake-custom.svg': base(800, 600, '#E8D3CB', '#C2705A', `  ${sparkles([[130, 140, 1], [670, 160, 0.8], [170, 460, 0.7], [650, 450, 1]])}
  ${cake(400, 305, 0.92)}`),
  'samosa.svg': base(800, 600, '#F5D9A0', '#E0A84E', `  ${sparkles([[130, 140, 0.9], [670, 160, 0.8], [170, 460, 0.7], [650, 450, 0.9]])}
  ${samosa(400, 300, 0.95)}`),
  'meat-pie.svg': base(800, 600, '#EFC58C', '#D08B3C', `  ${sparkles([[130, 140, 0.9], [670, 160, 0.8], [170, 460, 0.7], [650, 450, 0.9]])}
  ${meatPie(400, 300, 0.95)}`),
  'sausage-roll.svg': base(800, 600, '#F0CD9C', '#D79B55', `  ${sparkles([[130, 140, 0.9], [670, 160, 0.8], [170, 460, 0.7], [650, 450, 0.9]])}
  ${sausageRoll(400, 300, 0.95)}`),
  'doughnut.svg': base(800, 600, '#F6D7E4', '#DE9CB8', `  ${sparkles([[130, 140, 0.9], [670, 160, 0.8], [170, 460, 0.7], [650, 450, 0.9]])}
  ${doughnut(400, 300, 0.95)}`),
  'hero.svg': base(
    1600,
    900,
    '#FAF1E6',
    '#EED9C6',
    `  ${confetti(46, 1600, 900)}
  ${sparkles([[260, 200, 1.4], [1380, 240, 1.2], [320, 700, 1], [1240, 720, 1.3], [700, 160, 0.9]])}
  ${cake(1080, 520, 1.55)}
  ${cupcake(360, 640, 1.15)}
  ${cupcake(620, 720, 0.85)}`
  ),
  'favicon.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#C2705A"/>
  <g transform="translate(32,36) scale(0.2)">
    <path d="M-75 -12 L75 -12 L56 105 Q0 122 -56 105 Z" fill="#ffffff"/>
    <path d="M-82 -14 C-78 -80 78 -80 82 -14 Z" fill="#ffffff"/>
    <circle cx="-46" cy="-48" r="31" fill="#ffffff"/><circle cx="46" cy="-48" r="31" fill="#ffffff"/>
    <circle cx="0" cy="-82" r="35" fill="#ffffff"/>
    <circle cx="0" cy="-126" r="17" fill="#4A2C21"/>
  </g>
</svg>
`,
};

for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(out, name), content);
}
console.log(`Generated ${Object.keys(files).length} images in client/public/images`);
