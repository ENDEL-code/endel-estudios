/* ═══════════════════════════════════════════════════════
   ENDEL Estudios — main.js
   Tickets via Formspree (sin configuracion extra)
   Solo crea cuenta en formspree.io y reemplaza el FORM_ID
═══════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────────────
   FORMSPREE CONFIG
   1. Ve a https://formspree.io y crea cuenta gratis
   2. New Form -> pon tu email copiloto237@gmail.com
   3. Copia el ID que aparece (ej: xbjvkpqz)
   4. Reemplaza TU_FORM_ID abajo
────────────────────────────────────────────────────── */
const FORMSPREE_ID = 'xykobqvy';

/* ──────────────────────────────────────────────────────
   LOADER
────────────────────────────────────────────────────── */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('hide');
  }, 1900);
});

/* ──────────────────────────────────────────────────────
   NAVBAR
────────────────────────────────────────────────────── */
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

/* ──────────────────────────────────────────────────────
   FADE-UP
────────────────────────────────────────────────────── */
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.fade-up').forEach(el => io.observe(el));

/* ──────────────────────────────────────────────────────
   GENERADOR DE TICKET UNICO (8 chars alfanumerico)
────────────────────────────────────────────────────── */
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const STORAGE_KEY = 'endel_tickets_used';

function getUsedTickets() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveTicket(code) {
  const used = getUsedTickets();
  used.push(code);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(used));
}

function generateTicketCode() {
  const used = getUsedTickets();
  let code, attempts = 0;
  do {
    code = Array.from({ length: 8 }, () =>
      CHARS[Math.floor(Math.random() * CHARS.length)]
    ).join('');
    attempts++;
    if (attempts > 500) break;
  } while (used.includes(code));
  return code;
}

/* ──────────────────────────────────────────────────────
   TICKET FORM
────────────────────────────────────────────────────── */
const form          = document.getElementById('ticketForm');
const correoInput   = document.getElementById('correo');
const submitBtn     = document.getElementById('submitBtn');
const btnText       = document.getElementById('btnText');
const btnSpinner    = document.getElementById('btnSpinner');
const formError     = document.getElementById('formError');
const ticketBox     = document.getElementById('ticketBox');
const ticketSuccess = document.getElementById('ticketSuccess');
const tsCode        = document.getElementById('tsCode');
const tsEmail       = document.getElementById('tsEmail');
const btnCopy       = document.getElementById('btnCopy');
const btnOtro       = document.getElementById('btnOtro');

function setLoading(on) {
  submitBtn.disabled = on;
  btnText.style.display    = on ? 'none' : 'inline';
  btnSpinner.style.display = on ? 'inline-block' : 'none';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.textContent = '';

  const email = correoInput.value.trim();

  if (!email) {
    formError.textContent = 'Escribe tu correo electronico.';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    formError.textContent = 'El correo no tiene un formato valido.';
    return;
  }

  setLoading(true);

  const ticketCode = generateTicketCode();

  try {
    const res = await fetch('https://formspree.io/f/' + FORMSPREE_ID, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        email:       email,
        ticket:      ticketCode,
        mensaje:     email + ' ha tomado el ticket #' + ticketCode,
        _replyto:    email,
        _subject:    'Nuevo ticket ' + ticketCode + ' — ENDEL Estudios'
      })
    });

    if (!res.ok) throw new Error('Error ' + res.status);

    saveTicket(ticketCode);
    setLoading(false);
    ticketBox.style.display     = 'none';
    ticketSuccess.style.display = 'flex';
    tsCode.textContent  = ticketCode;
    tsEmail.textContent = 'Enviado desde: ' + email;
    form.reset();

  } catch (err) {
    setLoading(false);
    console.error('Error:', err);
    formError.textContent = 'No se pudo enviar. Revisa tu conexion e intenta de nuevo.';
  }
});

btnCopy.addEventListener('click', () => {
  navigator.clipboard.writeText(tsCode.textContent).then(() => {
    btnCopy.textContent = 'Copiado';
    setTimeout(() => { btnCopy.textContent = 'Copiar codigo'; }, 2000);
  });
});

btnOtro.addEventListener('click', () => {
  ticketSuccess.style.display = 'none';
  ticketBox.style.display     = 'grid';
  correoInput.value = '';
  formError.textContent = '';
});