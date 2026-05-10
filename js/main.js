/* ═══════════════════════════════════════════════════════
   ENDEL Estudios — main.js
   - Loader animado
   - Navbar scroll + hamburger
   - IntersectionObserver para fade-up
   - Generador de tickets únicos 8 chars alfanuméricos
   - EmailJS: notifica a copiloto237@gmail.com
═══════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────────────
   EMAILJS CONFIG
   ⚠ DEBES REEMPLAZAR estos 3 valores con los tuyos
   desde https://www.emailjs.com
────────────────────────────────────────────────────── */
const EMAILJS_PUBLIC_KEY  = 'y-RXkWqoTCvdoDFH_';     // Account > API Keys
const EMAILJS_SERVICE_ID  = 'nlmublg';     // Email Services
const EMAILJS_TEMPLATE_ID = '6yy83df';   // Email Templates

/* ──────────────────────────────────────────────────────
   LOADER
────────────────────────────────────────────────────── */
window.addEventListener('load', () => {
  // Espera que la barra termine (1.6s) + un pequeño margen
  setTimeout(() => {
    document.getElementById('loader').classList.add('hide');
  }, 1900);
});

/* ──────────────────────────────────────────────────────
   NAVBAR — scroll + hamburger
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
   FADE-UP  (IntersectionObserver)
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
   GENERADOR DE TICKET ÚNICO (8 chars alfanumérico)
   Guarda los usados en localStorage para no repetir
────────────────────────────────────────────────────── */
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin O,0,I,1 para evitar confusión
const STORAGE_KEY = 'endel_tickets_used';

function getUsedTickets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
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
    if (attempts > 500) {
      // Prácticamente imposible, pero por si acaso
      console.warn('ENDEL: muchos tickets generados en este dispositivo.');
      break;
    }
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

// Inicializar EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

function setLoading(on) {
  submitBtn.disabled = on;
  btnText.style.display    = on ? 'none'   : 'inline';
  btnSpinner.style.display = on ? 'inline-block' : 'none';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.textContent = '';

  const email = correoInput.value.trim();

  if (!email) {
    formError.textContent = '⚠ Escribe tu correo electrónico.';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    formError.textContent = '⚠ El correo no tiene un formato válido.';
    return;
  }

  setLoading(true);

  const ticketCode = generateTicketCode();
  const ahora      = new Date();
  const fecha      = ahora.toLocaleString('es-MX', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City'
  });

  try {
    // Envía email a copiloto237@gmail.com
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email:    'copiloto237@gmail.com',
      reply_to:    email,             // ← al responder el email, va directo al cliente
      from_email:  email,
      ticket_code: ticketCode,
      fecha:       fecha,
      // Mensaje que llega a tu correo:
      mensaje: `${email} ha tomado el ticket #${ticketCode} el ${fecha}.`,
    });

    // Guardar ticket localmente para no repetirlo
    saveTicket(ticketCode);

    // Mostrar pantalla de éxito
    setLoading(false);
    ticketBox.style.display     = 'none';
    ticketSuccess.style.display = 'flex';
    tsCode.textContent  = ticketCode;
    tsEmail.textContent = `Enviado a: ${email}`;
    form.reset();

  } catch (err) {
    setLoading(false);
    console.error('EmailJS error:', err);
    formError.textContent = '⚠ No se pudo enviar. Revisa tu conexión e intenta de nuevo.';
  }
});

/* ── Copiar código ────────────────────────────────── */
btnCopy.addEventListener('click', () => {
  const code = tsCode.textContent;
  navigator.clipboard.writeText(code).then(() => {
    btnCopy.textContent = '✔ Copiado';
    setTimeout(() => { btnCopy.textContent = '📋 Copiar código'; }, 2000);
  });
});

/* ── Otro ticket ──────────────────────────────────── */
btnOtro.addEventListener('click', () => {
  ticketSuccess.style.display = 'none';
  ticketBox.style.display     = 'grid';
  correoInput.value = '';
  formError.textContent = '';
});
