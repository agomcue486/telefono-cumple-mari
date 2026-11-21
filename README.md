# 📱 Teléfono Virtual de Cumpleaños

Aplicación web interactiva que simula la pantalla de un smartphone (estilo iOS/Android oscuro y elegante) para recibir llamadas sorpresa y felicitaciones de voz personalizadas de amigos y familiares en tu cumpleaños.

Conectada directamente con **Supabase** (Base de datos PostgreSQL, Storage para fotos y audios, y Supabase Auth para el panel de administración).

---

## ✨ Características Principales

- **Diseño Móvil Realista**: Chasis de smartphone con Dynamic Island, reloj en tiempo real, barra de estado (5G, WiFi, batería) e indicador inferior.
- **Modo Cumpleañero**:
  - 🎲 **Llamada aleatoria**: Elige un contacto al azar y lanza la llamada entrante.
  - 👥 **Agenda de Contactos**: Lista completa con búsqueda en tiempo real y llamada directa al pulsar.
  - 🎂 **Mensaje de Bienvenida Personalizable**: Modificable desde la administración y guardado en Supabase.
- **Simulador de Llamada Entrante**:
  - Foto del contacto con anillos pulsantes concéntricos.
  - Tono sintético generado con **Web Audio API** (sin depender de archivos de audio externos).
  - Vibración háptica del dispositivo (`navigator.vibrate`).
  - Botón rojo **Rechazar** y botón verde pulsante animado **Contestar**.
- **Pantalla En Llamada**:
  - Contador de duración digital en vivo (`00:01`, `00:02`...).
  - Ecualizador de sonido con barras animadas.
  - Reproducción automática del archivo de audio del contacto (`audio_url`).
  - Cuelgue automático al finalizar el mensaje de voz (o mediante el botón **Colgar**).
- **Panel de Administrador (Protegido con Supabase Auth)**:
  - Acceso discreto mediante candado 🔒 en la esquina superior.
  - Formulario para añadir nuevos contactos con subida directa de fotos y audios al bucket `multimedia` de Supabase Storage.
  - Lista de contactos registrados con reproducción previa y botón para eliminar (registro y archivos).
  - Editor para personalizar el título y subtítulo de la pantalla principal.

---

## 🚀 Despliegue en GitHub Pages (Gratis en 1 minuto)

Esta aplicación es 100% estática para el cliente y puede funcionar en **GitHub Pages** sin necesidad de servidor:

1. Crea un nuevo repositorio en [GitHub](https://github.com/new).
2. Sube los archivos de este proyecto (`index.html`, `styles.css`, `app.js`, carpeta `vendor/`, etc.).
3. Ve a **Settings** de tu repositorio $\rightarrow$ **Pages** (menú izquierdo).
4. En **Source**, selecciona **Deploy from a branch**, elige la rama `main` y carpeta `/ (root)` $\rightarrow$ **Save**.
5. ¡Listo! En 1 minuto tendrás una URL pública HTTPS (ej. `https://tu-usuario.github.io/tu-repo/`) accesible desde cualquier móvil del mundo sin tener tu ordenador encendido.

> [!NOTE]
> Al publicar en GitHub Pages (HTTPS), recuerda añadir la URL de tu GitHub Pages en tu panel de Supabase:
> **Authentication** $\rightarrow$ **URL Configuration** $\rightarrow$ Añadir tu URL en **Redirect URLs**.

---

## 💻 Ejecución en Local

Para ejecutarlo en tu red local con Node.js:

```bash
node server.js
```

El servidor estará disponible en:
- Local: `http://localhost:3000`
- Dispositivos en tu red WiFi: `http://<TU_IP_LOCAL>:3000`
