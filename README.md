# ENDEL-estudios 🎫

Sitio web de presentación con sistema de tickets únicos y notificación por email.

---

## Estructura

```
endel-estudios/
├── index.html
├── css/style.css
├── js/main.js
├── assets/
│   ├── logo.png
│   └── favicon.ico
├── instalar.sh
└── actualizar.sh
```

---

## ⚙️ Configurar EmailJS (OBLIGATORIO para que lleguen los emails)

### 1. Crear cuenta
Ve a https://www.emailjs.com y regístrate gratis.

### 2. Conectar tu Gmail
- Panel → **Email Services** → **Add New Service**
- Selecciona **Gmail**
- Autoriza con `copiloto237@gmail.com`
- Copia el **Service ID** (ej. `service_abc123`)

### 3. Crear plantilla
- Panel → **Email Templates** → **Create New Template**
- En **To Email**: `copiloto237@gmail.com`
- En **Reply To**: `{{reply_to}}`
- **Subject**: `🎫 Nuevo ticket {{ticket_code}} — ENDEL Estudios`
- **Body**:
```
{{from_email}} ha tomado el ticket #{{ticket_code}}

Fecha: {{fecha}}

Responde directamente a este correo para contactar al cliente.
```
- Guarda y copia el **Template ID** (ej. `template_xyz789`)

### 4. Copiar tu Public Key
- Panel → **Account** → **API Keys**
- Copia la **Public Key** (ej. `user_AbCdEfG`)

### 5. Pegar en el código
Abre `js/main.js` y reemplaza las 3 líneas al inicio:

```js
const EMAILJS_PUBLIC_KEY  = 'TU_PUBLIC_KEY';    // ← tu Public Key
const EMAILJS_SERVICE_ID  = 'TU_SERVICE_ID';    // ← tu Service ID
const EMAILJS_TEMPLATE_ID = 'TU_TEMPLATE_ID';   // ← tu Template ID
```

---

## 🚀 Levantar la web

1. Abre la carpeta en **VS Code**
2. Instala la extensión **Live Server** (Ritwick Dey)
3. Abre `index.html` → clic en **Go Live** (barra inferior)
4. Para URL pública: `bash actualizar.sh`

---

## 📦 Instalar dependencias

```bash
bash instalar.sh
```

---

## 🎫 Cómo funcionan los tickets

- El visitante escribe su correo y presiona **Tomar ticket**
- Se genera un código alfanumérico único de 8 caracteres (ej. `K7XN2QBR`)
- Te llega un email a `copiloto237@gmail.com` con el correo del cliente
- Respondes el email directamente → llega al cliente
- Los códigos usados se guardan localmente para no repetirse
