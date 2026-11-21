/**
 * Teléfono Virtual de Cumpleaños
 * JavaScript Principal - Conexión Supabase, Web Audio API y Lógica de Interfaz
 */

(() => {
  'use strict';

  // ==========================================================================
  // 1. CONFIGURACIÓN Y CREDENCIALES DE SUPABASE
  // ==========================================================================
  
  const SUPABASE_RAW_URL = 'https://muvmznfpmarbijnswqdg.supabase.co/rest/v1/';
  // Sanitizar URL base eliminando sufijos '/rest/v1' o barras finales
  const SUPABASE_URL = SUPABASE_RAW_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  const SUPABASE_KEY = 'sb_publishable_z9kYwSOOEYFW20Pfnoeeig_9IvWw7Ej';

  let supabase = null;
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase Client inicializado correctamente con URL:', SUPABASE_URL);
  } else {
    console.warn('⚠️ Supabase JS SDK no encontrado en window.supabase.');
  }

  // ==========================================================================
  // 2. CONTACTOS DE DEMOSTRACIÓN (Fallback si Supabase está vacío o con RLS)
  // ==========================================================================
  
  const DEMO_CONTACTS = [
    {
      id: 'demo-1',
      nombre: 'Mamá ❤️',
      foto_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      audio_url: '', // Se generará con Web Audio / Speech Synthesis si está vacío
      isDemo: true,
      mensajeVoz: '¡Hola mi amor! ¡Muchísimas felicidades en tu cumpleaños! Que la pases maravilloso hoy y siempre, te quiero con todo mi corazón.'
    },
    {
      id: 'demo-2',
      nombre: 'Carlos (Mejor Amigo) 🎉',
      foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      audio_url: '',
      isDemo: true,
      mensajeVoz: '¡Hermano, feliz cumpleaños! Prepara todo que hoy celebramos a lo grande. ¡Un abrazo enorme!'
    },
    {
      id: 'demo-3',
      nombre: 'Abuelos 🎂',
      foto_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      audio_url: '',
      isDemo: true,
      mensajeVoz: '¡Muchas felicidades de parte de tus abuelos! Estamos muy orgullosos de ti. ¡Que Dios te bendiga siempre!'
    }
  ];

  // ==========================================================================
  // 3. ESTADO GLOBAL DE LA APLICACIÓN
  // ==========================================================================
  
  const state = {
    contacts: [],
    usingDemoContacts: false,
    activeContact: null,
    currentScreenId: 'screen-home',
    currentUser: null,
    callStartTime: null,
    callTimerInterval: null,
    vibrationInterval: null,
    isRinging: false,
    isInCall: false,
    uploadedPhotoFile: null,
    uploadedAudioFile: null
  };

  // ==========================================================================
  // 4. TONO DE LLAMADA SINTÉTICO (Web Audio API)
  // Genera un tono de llamada realista sin dependencias externas
  // ==========================================================================
  
  class SyntheticRingtone {
    constructor() {
      this.audioCtx = null;
      this.isPlaying = false;
      this.cycleTimer = null;
    }

    _getOrCreateContext() {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) {
          this.audioCtx = new AudioCtxClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    }

    start() {
      if (this.isPlaying) return;
      this.isPlaying = true;
      const ctx = this._getOrCreateContext();
      if (!ctx) return;

      console.log('🔔 Iniciando tono sintético Web Audio API...');

      // Patrón de melodía digital alegre similar a llamada iOS / chime moderno
      const playChimePattern = () => {
        if (!this.isPlaying) return;
        const currentCtx = this._getOrCreateContext();
        if (!currentCtx) return;

        const now = currentCtx.currentTime;

        // Secuencia de notas armónicas estilo marimba/timbre digital
        const melody = [
          { freq: 523.25, time: 0.00, dur: 0.12 }, // C5
          { freq: 659.25, time: 0.14, dur: 0.12 }, // E5
          { freq: 783.99, time: 0.28, dur: 0.12 }, // G5
          { freq: 1046.50, time: 0.42, dur: 0.18 }, // C6
          { freq: 783.99, time: 0.65, dur: 0.12 }, // G5
          { freq: 1046.50, time: 0.80, dur: 0.25 }, // C6

          // Segunda frase
          { freq: 587.33, time: 1.20, dur: 0.12 }, // D5
          { freq: 698.46, time: 1.34, dur: 0.12 }, // F5
          { freq: 880.00, time: 1.48, dur: 0.12 }, // A5
          { freq: 1174.66, time: 1.62, dur: 0.18 }, // D6
          { freq: 880.00, time: 1.85, dur: 0.12 }, // A5
          { freq: 1174.66, time: 2.00, dur: 0.28 }  // D6
        ];

        melody.forEach(note => {
          this._playSynthesizedTone(currentCtx, note.freq, now + note.time, note.dur);
        });

        // Repetir el ciclo cada 3.3 segundos
        this.cycleTimer = setTimeout(() => {
          if (this.isPlaying) playChimePattern();
        }, 3300);
      };

      playChimePattern();
    }

    _playSynthesizedTone(ctx, frequency, startTime, duration) {
      try {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // Oscilador 1: Onda sinusoidal pura (cuerpo principal)
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(frequency, startTime);

        // Oscilador 2: Onda triangular para armónico cálido
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(frequency, startTime);

        // Envolvente de volumen (ataque rápido y caída suave)
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.20, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + duration + 0.05);
        osc2.stop(startTime + duration + 0.05);
      } catch (err) {
        console.warn('Error sintetizando tono individual:', err);
      }
    }

    // Tono especial de fin de llamada / cuelgue
    playCallEndTone() {
      const ctx = this._getOrCreateContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        [480, 480, 480].forEach((freq, idx) => {
          const start = now + (idx * 0.22);
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.15, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.16);
        });
      } catch (e) {
        // Silencioso
      }
    }

    stop() {
      this.isPlaying = false;
      if (this.cycleTimer) {
        clearTimeout(this.cycleTimer);
        this.cycleTimer = null;
      }
    }
  }

  const ringtone = new SyntheticRingtone();

  // ==========================================================================
  // 5. GESTOR DE VIBRACIÓN (navigator.vibrate)
  // ==========================================================================
  
  const VibrationManager = {
    start() {
      if ('vibrate' in navigator) {
        try {
          // Patrón de vibración continuo estilo teléfono: vibra 500ms, pausa 250ms, vibra 500ms, pausa 1500ms
          const pattern = [500, 250, 500, 1500];
          navigator.vibrate(pattern);
          
          state.vibrationInterval = setInterval(() => {
            if (state.isRinging && 'vibrate' in navigator) {
              navigator.vibrate(pattern);
            } else {
              clearInterval(state.vibrationInterval);
            }
          }, 2750);
        } catch (e) {
          console.log('Vibración no permitida o deshabilitada en este entorno:', e);
        }
      }
    },
    stop() {
      if (state.vibrationInterval) {
        clearInterval(state.vibrationInterval);
        state.vibrationInterval = null;
      }
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(0);
        } catch (e) {}
      }
    }
  };

  // ==========================================================================
  // 6. ELEMENTOS DEL DOM
  // ==========================================================================
  
  const dom = {
    statusClock: document.getElementById('status-clock'),
    dynamicIsland: document.getElementById('dynamic-island'),
    islandCallTimer: document.getElementById('island-call-timer'),
    
    // Vistas / Pantallas
    screenHome: document.getElementById('screen-home'),
    screenContacts: document.getElementById('screen-contacts'),
    screenIncomingCall: document.getElementById('screen-incoming-call'),
    screenActiveCall: document.getElementById('screen-active-call'),
    screenAdminPanel: document.getElementById('screen-admin-panel'),

    // Modo Cumpleañero (Home)
    btnRandomCall: document.getElementById('btn-random-call'),
    btnOpenContacts: document.getElementById('btn-open-contacts'),
    btnOpenAdminModal: document.getElementById('btn-open-admin-modal'),
    contactsCounterLabel: document.getElementById('contacts-counter-label'),
    homeGreetingTitle: document.getElementById('home-greeting-title'),
    homeGreetingSubtitle: document.getElementById('home-greeting-subtitle'),

    // Lista de Contactos
    btnBackFromContacts: document.getElementById('btn-back-from-contacts'),
    contactsSearchInput: document.getElementById('contacts-search-input'),
    contactsListContainer: document.getElementById('contacts-list-container'),

    // Llamada Entrante
    incomingCallerName: document.getElementById('incoming-caller-name'),
    incomingCallerPhoto: document.getElementById('incoming-caller-photo'),
    incomingAmbientBg: document.getElementById('incoming-ambient-bg'),
    btnDeclineCall: document.getElementById('btn-decline-call'),
    btnAnswerCall: document.getElementById('btn-answer-call'),

    // En Llamada
    activeCallerName: document.getElementById('active-caller-name'),
    activeCallerPhoto: document.getElementById('active-caller-photo'),
    activeAmbientBg: document.getElementById('active-ambient-bg'),
    activeCallTimer: document.getElementById('active-call-timer'),
    audioEqualizer: document.getElementById('audio-equalizer'),
    audioPlayingStatus: document.getElementById('audio-playing-status'),
    btnHangupCall: document.getElementById('btn-hangup-call'),
    ctrlMute: document.getElementById('ctrl-mute'),
    ctrlSpeaker: document.getElementById('ctrl-speaker'),

    // Admin Panel
    btnExitAdmin: document.getElementById('btn-exit-admin'),
    btnAdminLogout: document.getElementById('btn-admin-logout'),
    adminUserEmail: document.getElementById('admin-user-email'),
    adminContactsCount: document.getElementById('admin-contacts-count'),
    adminContactsList: document.getElementById('admin-contacts-list'),
    formAddContact: document.getElementById('form-add-contact'),
    inputContactName: document.getElementById('input-contact-name'),
    inputContactPhoto: document.getElementById('input-contact-photo'),
    inputContactAudio: document.getElementById('input-contact-audio'),
    dropzonePhoto: document.getElementById('dropzone-photo'),
    dropzonePhotoEmpty: document.getElementById('dropzone-photo-empty'),
    dropzonePhotoPreview: document.getElementById('dropzone-photo-preview'),
    previewPhotoImg: document.getElementById('preview-photo-img'),
    btnRemovePhoto: document.getElementById('btn-remove-photo'),
    dropzoneAudio: document.getElementById('dropzone-audio'),
    dropzoneAudioEmpty: document.getElementById('dropzone-audio-empty'),
    dropzoneAudioPreview: document.getElementById('dropzone-audio-preview'),
    previewAudioName: document.getElementById('preview-audio-name'),
    previewAudioPlayer: document.getElementById('preview-audio-player'),
    btnRemoveAudio: document.getElementById('btn-remove-audio'),
    uploadProgressBox: document.getElementById('upload-progress-box'),
    uploadProgressFill: document.getElementById('upload-progress-fill'),
    uploadProgressText: document.getElementById('upload-progress-text'),
    btnSaveContact: document.getElementById('btn-save-contact'),

    // Update Greeting Form in Admin Panel
    formUpdateGreeting: document.getElementById('form-update-greeting'),
    inputGreetingTitle: document.getElementById('input-greeting-title'),
    inputGreetingSubtitle: document.getElementById('input-greeting-subtitle'),
    btnSaveGreeting: document.getElementById('btn-save-greeting'),

    // Modal Login
    modalAdminLogin: document.getElementById('modal-admin-login'),
    formAdminLogin: document.getElementById('form-admin-login'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    btnTogglePassword: document.getElementById('btn-toggle-password'),
    loginErrorBanner: document.getElementById('login-error-banner'),
    loginErrorText: document.getElementById('login-error-text'),
    btnCancelLogin: document.getElementById('btn-cancel-login'),
    btnSubmitLogin: document.getElementById('btn-submit-login'),
    loginRecoveryLinkContainer: document.getElementById('login-recovery-link-container'),
    btnSendMagicLink: document.getElementById('btn-send-magic-link'),

    // Modal Set New Password (Recovery)
    modalSetNewPassword: document.getElementById('modal-set-new-password'),
    formModalNewPassword: document.getElementById('form-modal-new-password'),
    modalInputNewPwd: document.getElementById('modal-input-new-pwd'),
    btnToggleModalNewPwd: document.getElementById('btn-toggle-modal-new-pwd'),
    btnSkipModalNewPwd: document.getElementById('btn-skip-modal-new-pwd'),
    btnSubmitModalNewPwd: document.getElementById('btn-submit-modal-new-pwd'),

    // Update Password Form in Admin Panel
    formUpdatePassword: document.getElementById('form-update-password'),
    inputNewPassword: document.getElementById('input-new-password'),
    btnToggleNewPwd: document.getElementById('btn-toggle-new-pwd'),
    btnSaveNewPassword: document.getElementById('btn-save-new-password'),

    // Otros
    toastContainer: document.getElementById('toast-container'),
    contactAudioElement: document.getElementById('contact-audio-element')
  };

  // ==========================================================================
  // 7. SISTEMA DE NAVEGACIÓN ENTRE PANTALLAS
  // ==========================================================================
  
  function showScreen(screenId) {
    const screens = [
      dom.screenHome,
      dom.screenContacts,
      dom.screenIncomingCall,
      dom.screenActiveCall,
      dom.screenAdminPanel
    ];

    screens.forEach(screen => {
      if (screen) {
        if (screen.id === screenId) {
          screen.classList.add('active');
        } else {
          screen.classList.remove('active');
        }
      }
    });

    state.currentScreenId = screenId;

    // Actualizar dynamic island según el estado de llamada
    if (screenId === 'screen-active-call') {
      dom.dynamicIsland.classList.add('calling');
    } else {
      dom.dynamicIsland.classList.remove('calling');
    }
  }

  // ==========================================================================
  // 8. RELOJ DEL SISTEMA (Status Bar Clock)
  // ==========================================================================
  
  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    if (dom.statusClock) {
      dom.statusClock.textContent = `${hours}:${minutes}`;
    }
  }
  setInterval(updateClock, 1000);
  updateClock();

  // ==========================================================================
  // 9. TOAST NOTIFICACIONES
  // ==========================================================================
  
  function showToast(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-solid fa-circle-info';
    if (type === 'success') icon = 'fa-solid fa-circle-check';
    if (type === 'error') icon = 'fa-solid fa-triangle-exclamation';

    toast.innerHTML = `
      <i class="${icon}"></i>
      <span>${escapeHtml(message)}</span>
    `;

    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-fadeout');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  function escapeHtml(string) {
    const div = document.createElement('div');
    div.textContent = string;
    return div.innerHTML;
  }

  // ==========================================================================
  // 10. CARGA DE CONTACTOS DESDE SERVIDOR LOCAL / SUPABASE
  // ==========================================================================
  
  async function loadContactsFromSupabase() {
    dom.contactsCounterLabel.textContent = 'Consultando contactos...';

    // 1. Intentar cargar primero a través de la API del servidor local (/api/contactos)
    // Esto garantiza que teléfonos y dispositivos remotos en la red local reciban los contactos
    // sin verse afectados por DNS, bloqueadores o restricciones de red hacia Supabase.
    try {
      const localResponse = await fetch('/api/contactos', { cache: 'no-store' });
      if (localResponse.ok) {
        const localData = await localResponse.json();
        if (Array.isArray(localData) && localData.length > 0) {
          state.contacts = localData.map(item => ({
            id: item.id,
            nombre: item.nombre || item.name || 'Amigo Anónimo',
            foto_url: item.foto_url || item.avatar_url || item.foto || '',
            audio_url: item.audio_url || item.audio || '',
            isDemo: false
          }));

          state.usingDemoContacts = false;
          dom.contactsCounterLabel.textContent = `${state.contacts.length} felicitación${state.contacts.length === 1 ? '' : 'es'}`;
          console.log(`✅ ${state.contacts.length} contactos cargados a través de /api/contactos`);
          renderContactsAgenda();
          renderAdminContactsList();
          return;
        }
      }
    } catch (localErr) {
      console.log('API local /api/contactos no disponible, intentando conexión directa con Supabase SDK:', localErr);
    }
    
    // 2. Si la API local no respondió, intentar con el cliente directo de Supabase
    if (!supabase) {
      console.warn('Supabase no inicializado, activando contactos demo.');
      useDemoFallback('Supabase no configurado');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contactos')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.warn('Aviso al obtener contactos de Supabase:', error);
        
        // Si el error es 42501 (RLS / permission denied)
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          useDemoFallback('Permisos RLS activos en Supabase');
          return;
        }

        useDemoFallback(error.message);
        return;
      }

      if (data && data.length > 0) {
        // Normalizar los nombres de las columnas para compatibilidad
        state.contacts = data.map(item => ({
          id: item.id,
          nombre: item.nombre || item.name || 'Amigo Anónimo',
          foto_url: item.foto_url || item.avatar_url || item.foto || '',
          audio_url: item.audio_url || item.audio || '',
          isDemo: false
        }));

        state.usingDemoContacts = false;
        dom.contactsCounterLabel.textContent = `${state.contacts.length} felicitación${state.contacts.length === 1 ? '' : 'es'}`;
        console.log(`✅ ${state.contacts.length} contactos cargados directamente desde Supabase.`);
      } else {
        console.log('ℹ️ Tabla contactos vacía en Supabase. Cargando demos iniciales...');
        useDemoFallback('Sin registros en Supabase aún');
      }

      renderContactsAgenda();
      renderAdminContactsList();

    } catch (err) {
      console.error('Excepción al cargar contactos:', err);
      useDemoFallback('Error de red o CORS');
    }
  }

  function useDemoFallback(reason) {
    state.contacts = [...DEMO_CONTACTS];
    state.usingDemoContacts = true;
    dom.contactsCounterLabel.textContent = `${state.contacts.length} felicitaciones (Modo Demo)`;
    console.log(`📌 Usando contactos de demostración (${reason}).`);
    renderContactsAgenda();
    renderAdminContactsList();
  }

  // ==========================================================================
  // 11. RENDERIZADO DE LA LISTA DE CONTACTOS (Agenda de Cumpleaños)
  // ==========================================================================
  
  function renderContactsAgenda(filterQuery = '') {
    if (!dom.contactsListContainer) return;

    const query = filterQuery.trim().toLowerCase();
    const filtered = state.contacts.filter(c => 
      c.nombre.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
      dom.contactsListContainer.innerHTML = `
        <div class="empty-contacts-state">
          <i class="fa-regular fa-address-book empty-contacts-icon"></i>
          <p>No se encontraron felicitaciones con ese nombre.</p>
        </div>
      `;
      return;
    }

    const html = filtered.map(contact => {
      const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.nombre)}&background=1e293b&color=f8fafc&bold=true`;
      const photoSrc = contact.foto_url || fallbackAvatar;

      return `
        <div class="contact-item-card" data-contact-id="${contact.id}">
          <div class="contact-avatar-wrapper">
            <img src="${escapeHtml(photoSrc)}" alt="${escapeHtml(contact.nombre)}" loading="lazy" onerror="this.src='${fallbackAvatar}'">
          </div>
          <div class="contact-info-wrapper">
            <h4 class="contact-name-text">${escapeHtml(contact.nombre)}</h4>
            <span class="contact-desc-text">Toca para recibir su llamada</span>
          </div>
          <div class="contact-call-action-icon">
            <i class="fa-solid fa-phone"></i>
          </div>
        </div>
      `;
    }).join('');

    dom.contactsListContainer.innerHTML = html;

    // Asignar eventos de click a cada tarjeta
    dom.contactsListContainer.querySelectorAll('.contact-item-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-contact-id');
        const contact = state.contacts.find(c => String(c.id) === String(id));
        if (contact) {
          initiateIncomingCall(contact);
        }
      });
    });
  }

  // Filtro de búsqueda en la agenda
  if (dom.contactsSearchInput) {
    dom.contactsSearchInput.addEventListener('input', (e) => {
      renderContactsAgenda(e.target.value);
    });
  }

  // ==========================================================================
  // 12. SIMULACIÓN DE LLAMADA ENTRANTE (Núcleo de la App)
  // ==========================================================================
  
  function triggerRandomCall() {
    if (state.contacts.length === 0) {
      showToast('No hay contactos disponibles para llamar.', 'error');
      return;
    }
    const randomIndex = Math.floor(Math.random() * state.contacts.length);
    const chosenContact = state.contacts[randomIndex];
    initiateIncomingCall(chosenContact);
  }

  function initiateIncomingCall(contact) {
    state.activeContact = contact;
    state.isRinging = true;

    // Actualizar UI de llamada entrante
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.nombre)}&background=1e293b&color=f8fafc&bold=true`;
    const photoSrc = contact.foto_url || fallbackAvatar;

    dom.incomingCallerName.textContent = contact.nombre;
    dom.incomingCallerPhoto.src = photoSrc;
    dom.incomingCallerPhoto.onerror = () => {
      dom.incomingCallerPhoto.src = fallbackAvatar;
    };

    if (photoSrc) {
      dom.incomingAmbientBg.style.backgroundImage = `url("${photoSrc}")`;
    } else {
      dom.incomingAmbientBg.style.backgroundImage = 'none';
    }

    // Cambiar a pantalla de llamada entrante
    showScreen('screen-incoming-call');

    // Iniciar tono sintético con Web Audio API
    ringtone.start();

    // Iniciar vibración háptica
    VibrationManager.start();

    console.log(`📞 Llamada entrante de: ${contact.nombre}`);
  }

  function declineIncomingCall() {
    ringtone.stop();
    VibrationManager.stop();
    state.isRinging = false;
    state.activeContact = null;

    showToast('Llamada rechazada', 'info');
    showScreen('screen-home');
  }

  // ==========================================================================
  // 13. CONTESTAR LLAMADA Y REPRODUCCIÓN DE AUDIO (En Llamada)
  // ==========================================================================
  
  function answerCall() {
    // 1. Detener tono y vibración
    ringtone.stop();
    VibrationManager.stop();
    state.isRinging = false;
    state.isInCall = true;

    const contact = state.activeContact;
    if (!contact) {
      showScreen('screen-home');
      return;
    }

    // 2. Configurar vista de llamada activa
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.nombre)}&background=1e293b&color=f8fafc&bold=true`;
    const photoSrc = contact.foto_url || fallbackAvatar;

    dom.activeCallerName.textContent = contact.nombre;
    dom.activeCallerPhoto.src = photoSrc;
    dom.activeCallerPhoto.onerror = () => {
      dom.activeCallerPhoto.src = fallbackAvatar;
    };

    if (photoSrc) {
      dom.activeAmbientBg.style.backgroundImage = `url("${photoSrc}")`;
    }

    // 3. Iniciar contador de duración (00:00, 00:01...)
    startCallTimer();

    // 4. Cambiar a pantalla de llamada activa
    showScreen('screen-active-call');

    // 5. Reproducir audio_url del contacto
    playContactAudio(contact);
  }

  function startCallTimer() {
    stopCallTimer();
    state.callStartTime = Date.now();
    updateTimerDisplay(0);

    state.callTimerInterval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - state.callStartTime) / 1000);
      updateTimerDisplay(elapsedSeconds);
    }, 1000);
  }

  function updateTimerDisplay(seconds) {
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    const timeFormatted = `${mins}:${secs}`;
    dom.activeCallTimer.textContent = timeFormatted;
    dom.islandCallTimer.textContent = timeFormatted;
  }

  function stopCallTimer() {
    if (state.callTimerInterval) {
      clearInterval(state.callTimerInterval);
      state.callTimerInterval = null;
    }
  }

  function playContactAudio(contact) {
    const audioEl = dom.contactAudioElement;
    dom.audioPlayingStatus.innerHTML = '<i class="fa-solid fa-music"></i> <span>Escuchando mensaje...</span>';
    dom.audioEqualizer.style.opacity = '1';

    // Manejador al finalizar el audio
    const handleAudioEnded = () => {
      console.log('🎵 El audio del contacto ha terminado.');
      dom.audioPlayingStatus.innerHTML = '<i class="fa-solid fa-check"></i> <span>Mensaje finalizado</span>';
      dom.audioEqualizer.style.opacity = '0.3';
      
      // Esperar 1.5 segundos antes de colgar automáticamente
      setTimeout(() => {
        if (state.isInCall) {
          hangupCall('Llamada finalizada');
        }
      }, 1500);
    };

    // Manejador en caso de error cargando el archivo de audio
    const handleAudioError = (e) => {
      console.warn('No se pudo reproducir el archivo de audio remoto:', e);
      // Fallback: Síntesis de voz del navegador para una experiencia completa
      playSpeechSynthesisFallback(contact, handleAudioEnded);
    };

    audioEl.onended = handleAudioEnded;
    audioEl.onerror = handleAudioError;

    // Si tiene un audio_url válido cargado en Supabase
    if (contact.audio_url && contact.audio_url.trim().length > 5) {
      audioEl.src = contact.audio_url;
      audioEl.play().catch(err => {
        console.warn('Error al llamar audioEl.play():', err);
        playSpeechSynthesisFallback(contact, handleAudioEnded);
      });
    } else {
      // Si no tiene audio_url o es demo, usar síntesis de voz con mensaje cariñoso
      playSpeechSynthesisFallback(contact, handleAudioEnded);
    }
  }

  // Síntesis de voz sintética si no hay audio o falla
  function playSpeechSynthesisFallback(contact, onEndCallback) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const messageText = contact.mensajeVoz || 
        `¡Hola ${contact.nombre}! Te llamo para desearte un muy feliz cumpleaños. ¡Que todos tus sueños se hagan realidad hoy y siempre!`;

      const utterance = new SpeechSynthesisUtterance(messageText);
      utterance.lang = 'es-ES';
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      utterance.onend = () => {
        if (onEndCallback) onEndCallback();
      };
      utterance.onerror = () => {
        if (onEndCallback) onEndCallback();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      // Si el navegador no soporta síntesis de voz, simular duración de 6 segundos
      setTimeout(() => {
        if (onEndCallback) onEndCallback();
      }, 6000);
    }
  }

  function hangupCall(toastMessage = 'Llamada terminada') {
    state.isInCall = false;
    stopCallTimer();

    // Detener audio HTML5 y síntesis de voz
    if (dom.contactAudioElement) {
      dom.contactAudioElement.pause();
      dom.contactAudioElement.removeAttribute('src');
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Tono de colgado agradable
    ringtone.playCallEndTone();

    showToast(toastMessage, 'info');
    state.activeContact = null;
    showScreen('screen-home');
  }

  // ==========================================================================
  // 14. AUTENTICACIÓN SUPABASE Y PANEL DE ADMINISTRADOR
  // ==========================================================================

  // Abrir modal de Login
  function openAdminModal() {
    if (state.currentUser) {
      // Si ya está autenticado, ir directo al panel
      showScreen('screen-admin-panel');
      return;
    }
    dom.loginErrorBanner.classList.add('hidden');
    dom.modalAdminLogin.classList.remove('hidden');
    dom.loginEmail.focus();
  }

  function closeAdminModal() {
    dom.modalAdminLogin.classList.add('hidden');
    dom.formAdminLogin.reset();
    dom.loginErrorBanner.classList.add('hidden');
  }

  // Manejar Login exclusivamente con Supabase Auth (sin registro público)
  async function handleAdminLogin(e) {
    e.preventDefault();
    const email = dom.loginEmail.value.trim().toLowerCase();
    const password = dom.loginPassword.value;

    if (!email || !password) {
      showLoginError('Por favor introduce tu correo y contraseña.');
      return;
    }

    if (!supabase) {
      showLoginError('Cliente Supabase no disponible.');
      return;
    }

    setLoginLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Error en signInWithPassword:', error);
        if (error.message.includes('Invalid login credentials')) {
          showLoginError('Credenciales incorrectas. Verifica tu contraseña.');
        } else {
          showLoginError(error.message || 'Error al iniciar sesión.');
        }
        setLoginLoading(false);
        return;
      }

      console.log('✅ Sesión iniciada con éxito:', data.user);
      state.currentUser = data.user;
      dom.adminUserEmail.textContent = data.user.email || 'Admin';

      closeAdminModal();
      showToast('¡Bienvenido Administrador!', 'success');
      showScreen('screen-admin-panel');
      await loadContactsFromSupabase();

    } catch (err) {
      console.error('Excepción al autenticar:', err);
      showLoginError('Error de conexión con el servicio de autenticación.');
    } finally {
      setLoginLoading(false);
    }
  }

  // Enviar enlace de restablecimiento / enlace mágico al correo
  async function handleSendMagicLink() {
    const email = dom.loginEmail.value.trim().toLowerCase();
    if (!email) {
      showLoginError('Escribe primero tu correo electrónico arriba para enviarte el enlace.');
      dom.loginEmail.focus();
      return;
    }

    if (!supabase) {
      showToast('Cliente Supabase no disponible', 'error');
      return;
    }

    try {
      showToast('Enviando enlace de acceso a tu correo...', 'info');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname
      });

      if (error) {
        throw error;
      }

      showToast(`¡Enlace enviado a ${email}! Revisa tu bandeja de entrada o spam.`, 'success', 6000);
      dom.loginErrorBanner.classList.add('hidden');
    } catch (err) {
      console.error('Error enviando enlace:', err);
      showLoginError(`Error al enviar enlace: ${err.message}`);
    }
  }

  // Establecer / Actualizar contraseña (desde el formulario del Panel de Admin)
  async function handleAdminUpdatePassword(e) {
    e.preventDefault();
    const newPassword = dom.inputNewPassword.value;

    if (!newPassword || newPassword.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres.', 'error');
      return;
    }

    if (!supabase) {
      showToast('Cliente Supabase no conectado.', 'error');
      return;
    }

    try {
      dom.btnSaveNewPassword.disabled = true;
      dom.btnSaveNewPassword.innerHTML = '<div class="btn-spinner"></div> <span>Guardando...</span>';

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      console.log('✅ Contraseña actualizada correctamente en Supabase');
      showToast('¡Contraseña guardada con éxito! Ya puedes usarla siempre para entrar con el candado 🔒.', 'success', 6000);
      dom.formUpdatePassword.reset();

    } catch (err) {
      console.error('Error al actualizar contraseña:', err);
      showToast(`Error al guardar contraseña: ${err.message}`, 'error', 5000);
    } finally {
      dom.btnSaveNewPassword.disabled = false;
      dom.btnSaveNewPassword.innerHTML = '<i class="fa-solid fa-shield-check"></i> <span>Guardar Nueva Contraseña</span>';
    }
  }

  // Establecer contraseña desde el modal emergente de recuperación
  async function handleModalSetNewPassword(e) {
    e.preventDefault();
    const newPassword = dom.modalInputNewPwd.value;

    if (!newPassword || newPassword.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres.', 'error');
      return;
    }

    if (!supabase) {
      showToast('Cliente Supabase no conectado.', 'error');
      return;
    }

    try {
      dom.btnSubmitModalNewPwd.disabled = true;
      dom.btnSubmitModalNewPwd.querySelector('.btn-spinner').classList.remove('hidden');

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      console.log('✅ Contraseña establecida por enlace de recuperación');
      showToast('¡Contraseña asignada! A partir de ahora podrás iniciar sesión con ella directamente.', 'success', 6000);
      dom.modalSetNewPassword.classList.add('hidden');
      dom.formModalNewPassword.reset();

      // Limpiar el hash de la URL sin recargar
      if (window.history.replaceState) {
        window.history.replaceState(null, null, window.location.pathname);
      }

    } catch (err) {
      console.error('Error al establecer contraseña:', err);
      showToast(`Error al guardar contraseña: ${err.message}`, 'error', 5000);
    } finally {
      dom.btnSubmitModalNewPwd.disabled = false;
      dom.btnSubmitModalNewPwd.querySelector('.btn-spinner').classList.add('hidden');
    }
  }

  // ==========================================================================
  // CARGA Y ACTUALIZACIÓN DEL MENSAJE DE BIENVENIDA (Supabase + localStorage)
  // ==========================================================================

  async function loadAppGreeting() {
    const cachedTitle = localStorage.getItem('birthday_greeting_title') || '¡Feliz Cumpleaños!';
    const cachedSubtitle = localStorage.getItem('birthday_greeting_subtitle') || 'Tus amigos y familiares tienen mensajes de voz inolvidables para ti.';

    if (dom.homeGreetingTitle) dom.homeGreetingTitle.textContent = cachedTitle;
    if (dom.homeGreetingSubtitle) dom.homeGreetingSubtitle.textContent = cachedSubtitle;
    if (dom.inputGreetingTitle) dom.inputGreetingTitle.value = cachedTitle;
    if (dom.inputGreetingSubtitle) dom.inputGreetingSubtitle.value = cachedSubtitle;

    // Intentar primero a través de la API local
    try {
      const resp = await fetch('/api/configuracion', { cache: 'no-store' });
      if (resp.ok) {
        const cfgData = await resp.json();
        if (Array.isArray(cfgData) && cfgData.length > 0) {
          cfgData.forEach(item => {
            if (item.clave === 'titulo_bienvenida' && item.valor) {
              if (dom.homeGreetingTitle) dom.homeGreetingTitle.textContent = item.valor;
              if (dom.inputGreetingTitle) dom.inputGreetingTitle.value = item.valor;
              localStorage.setItem('birthday_greeting_title', item.valor);
            }
            if (item.clave === 'subtitulo_bienvenida' && item.valor) {
              if (dom.homeGreetingSubtitle) dom.homeGreetingSubtitle.textContent = item.valor;
              if (dom.inputGreetingSubtitle) dom.inputGreetingSubtitle.value = item.valor;
              localStorage.setItem('birthday_greeting_subtitle', item.valor);
            }
          });
          return;
        }
      }
    } catch (e) {}

    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('*');

      if (!error && data && data.length > 0) {
        data.forEach(item => {
          if (item.clave === 'titulo_bienvenida' && item.valor) {
            if (dom.homeGreetingTitle) dom.homeGreetingTitle.textContent = item.valor;
            if (dom.inputGreetingTitle) dom.inputGreetingTitle.value = item.valor;
            localStorage.setItem('birthday_greeting_title', item.valor);
          }
          if (item.clave === 'subtitulo_bienvenida' && item.valor) {
            if (dom.homeGreetingSubtitle) dom.homeGreetingSubtitle.textContent = item.valor;
            if (dom.inputGreetingSubtitle) dom.inputGreetingSubtitle.value = item.valor;
            localStorage.setItem('birthday_greeting_subtitle', item.valor);
          }
        });
      }
    } catch (e) {
      console.log('Tabla configuracion no disponible aún en Supabase:', e);
    }
  }

  async function handleUpdateGreeting(e) {
    e.preventDefault();
    const title = dom.inputGreetingTitle.value.trim();
    const subtitle = dom.inputGreetingSubtitle.value.trim();

    if (!title) {
      showToast('Por favor escribe un título.', 'error');
      return;
    }

    // Actualizar visualmente y en localStorage al instante
    if (dom.homeGreetingTitle) dom.homeGreetingTitle.textContent = title;
    if (dom.homeGreetingSubtitle) dom.homeGreetingSubtitle.textContent = subtitle;
    localStorage.setItem('birthday_greeting_title', title);
    localStorage.setItem('birthday_greeting_subtitle', subtitle);

    if (!supabase) {
      showToast('Mensaje de bienvenida guardado en la app.', 'success');
      return;
    }

    try {
      dom.btnSaveGreeting.disabled = true;
      dom.btnSaveGreeting.innerHTML = '<div class="btn-spinner"></div> <span>Guardando en Supabase...</span>';

      const { error } = await supabase
        .from('configuracion')
        .upsert([
          { clave: 'titulo_bienvenida', valor: title },
          { clave: 'subtitulo_bienvenida', valor: subtitle }
        ], { onConflict: 'clave' });

      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
          showToast('Mensaje guardado en la app. Crea la tabla "configuracion" en Supabase para sincronizarlo.', 'info', 6000);
        } else {
          throw error;
        }
      } else {
        showToast('¡Mensaje de bienvenida guardado en Supabase con éxito!', 'success');
      }

    } catch (err) {
      console.warn('Aviso guardando configuración:', err);
      showToast(`Guardado en la app (Aviso Supabase: ${err.message})`, 'info', 5000);
    } finally {
      dom.btnSaveGreeting.disabled = false;
      dom.btnSaveGreeting.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> <span>Guardar Mensaje de Bienvenida</span>';
    }
  }

  function showLoginError(msg) {
    dom.loginErrorText.textContent = msg;
    dom.loginErrorBanner.classList.remove('hidden');
  }

  function setLoginLoading(isLoading) {
    const btn = dom.btnSubmitLogin;
    const spinner = btn.querySelector('.btn-spinner');
    const text = btn.querySelector('.btn-text');

    if (isLoading) {
      btn.disabled = true;
      spinner.classList.remove('hidden');
      text.textContent = 'Verificando...';
    } else {
      btn.disabled = false;
      spinner.classList.add('hidden');
      text.textContent = 'Iniciar Sesión';
    }
  }

  // Cerrar Sesión
  async function handleAdminLogout() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    state.currentUser = null;
    showToast('Sesión de administrador cerrada.', 'info');
    showScreen('screen-home');
  }

  // Verificar sesión existente y escuchar eventos de recuperación
  async function checkInitialAuthSession() {
    if (!supabase) return;
    try {
      // 1. Verificar si viene con hash de recuperación en la URL
      if (window.location.hash.includes('type=recovery')) {
        console.log('🔄 Detectado enlace de recuperación de contraseña.');
        setTimeout(() => {
          if (dom.modalSetNewPassword) {
            dom.modalSetNewPassword.classList.remove('hidden');
            dom.modalInputNewPwd.focus();
          }
        }, 500);
      }

      // 2. Escuchar cambios de estado de autenticación (ej: PASSWORD_RECOVERY)
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔔 Evento de Supabase Auth:', event);
        if (event === 'PASSWORD_RECOVERY') {
          if (dom.modalSetNewPassword) {
            dom.modalSetNewPassword.classList.remove('hidden');
            dom.modalInputNewPwd.focus();
          }
        } else if (event === 'SIGNED_IN' && session) {
          state.currentUser = session.user;
          dom.adminUserEmail.textContent = session.user.email || 'Admin';
        } else if (event === 'SIGNED_OUT') {
          state.currentUser = null;
        }
      });

      // 3. Obtener sesión activa existente
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        state.currentUser = session.user;
        dom.adminUserEmail.textContent = session.user.email || 'Admin';
        console.log('🔑 Sesión previa activa:', session.user.email);
      }
    } catch (e) {
      console.log('Sin sesión previa:', e);
    }
  }

  // ==========================================================================
  // 15. SUBIDA DE ARCHIVOS A SUPABASE STORAGE Y REGISTRO EN BASE DE DATOS
  // ==========================================================================
  
  // Gestión de preview de Foto
  function handlePhotoSelect(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Por favor selecciona un archivo de imagen válido.', 'error');
      return;
    }

    state.uploadedPhotoFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      dom.previewPhotoImg.src = e.target.result;
      dom.dropzonePhotoEmpty.classList.add('hidden');
      dom.dropzonePhotoPreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  function resetPhotoUpload() {
    state.uploadedPhotoFile = null;
    dom.inputContactPhoto.value = '';
    dom.previewPhotoImg.src = '';
    dom.dropzonePhotoEmpty.classList.remove('hidden');
    dom.dropzonePhotoPreview.classList.add('hidden');
  }

  // Gestión de preview de Audio
  function handleAudioSelect(file) {
    if (!file) return;
    state.uploadedAudioFile = file;
    
    dom.previewAudioName.textContent = file.name;
    const audioUrl = URL.createObjectURL(file);
    dom.previewAudioPlayer.src = audioUrl;

    dom.dropzoneAudioEmpty.classList.add('hidden');
    dom.dropzoneAudioPreview.classList.remove('hidden');
  }

  function resetAudioUpload() {
    state.uploadedAudioFile = null;
    dom.inputContactAudio.value = '';
    dom.previewAudioPlayer.removeAttribute('src');
    dom.dropzoneAudioEmpty.classList.remove('hidden');
    dom.dropzoneAudioPreview.classList.add('hidden');
  }

  // Enviar formulario para añadir nuevo contacto
  async function handleAddContactSubmit(e) {
    e.preventDefault();

    const nombre = dom.inputContactName.value.trim();
    const photoFile = state.uploadedPhotoFile;
    const audioFile = state.uploadedAudioFile;

    if (!nombre) {
      showToast('Por favor escribe el nombre de la persona.', 'error');
      return;
    }
    if (!photoFile) {
      showToast('Por favor selecciona una foto.', 'error');
      return;
    }
    if (!audioFile) {
      showToast('Por favor selecciona el archivo de audio de felicitación.', 'error');
      return;
    }

    if (!supabase) {
      showToast('Cliente Supabase no conectado.', 'error');
      return;
    }

    // Iniciar barra de progreso
    dom.btnSaveContact.disabled = true;
    dom.uploadProgressBox.classList.remove('hidden');
    updateUploadProgress(15, 'Preparando archivos...');

    try {
      const timestamp = Date.now();
      const sanitizeName = (str) => str.replace(/[^a-zA-Z0-9._-]/g, '_');

      // 1. Subir Foto a Storage: bucket 'multimedia', carpeta 'fotos/'
      updateUploadProgress(35, 'Subiendo foto al bucket multimedia...');
      const photoExt = photoFile.name.split('.').pop() || 'jpg';
      const photoPath = `fotos/${timestamp}_${sanitizeName(photoFile.name)}`;

      const { data: photoUploadData, error: photoUploadError } = await supabase.storage
        .from('multimedia')
        .upload(photoPath, photoFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (photoUploadError) {
        throw new Error(`Error al subir foto: ${photoUploadError.message}`);
      }

      // Obtener URL pública de la foto
      const { data: photoUrlData } = supabase.storage
        .from('multimedia')
        .getPublicUrl(photoPath);

      const foto_url = photoUrlData.publicUrl;
      console.log('📷 Foto guardada en:', foto_url);

      // 2. Subir Audio a Storage: bucket 'multimedia', carpeta 'audios/'
      updateUploadProgress(65, 'Subiendo mensaje de audio a Supabase...');
      const audioPath = `audios/${timestamp}_${sanitizeName(audioFile.name)}`;

      const { data: audioUploadData, error: audioUploadError } = await supabase.storage
        .from('multimedia')
        .upload(audioPath, audioFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (audioUploadError) {
        throw new Error(`Error al subir audio: ${audioUploadError.message}`);
      }

      // Obtener URL pública del audio
      const { data: audioUrlData } = supabase.storage
        .from('multimedia')
        .getPublicUrl(audioPath);

      const audio_url = audioUrlData.publicUrl;
      console.log('🎤 Audio guardado en:', audio_url);

      // 3. Guardar registro en la tabla contactos
      updateUploadProgress(85, 'Guardando registro en base de datos...');
      const { data: insertData, error: insertError } = await supabase
        .from('contactos')
        .insert([
          {
            nombre: nombre,
            foto_url: foto_url,
            audio_url: audio_url
          }
        ])
        .select();

      if (insertError) {
        throw new Error(`Error al guardar en tabla contactos: ${insertError.message}`);
      }

      updateUploadProgress(100, '¡Contacto guardado con éxito!');
      showToast(`¡Contacto "${nombre}" añadido con éxito!`, 'success');

      // Limpiar formulario
      dom.formAddContact.reset();
      resetPhotoUpload();
      resetAudioUpload();

      // Recargar lista de contactos
      await loadContactsFromSupabase();

    } catch (err) {
      console.error('Error añadiendo contacto:', err);
      showToast(err.message || 'Error al guardar el contacto.', 'error', 5000);
    } finally {
      dom.btnSaveContact.disabled = false;
      setTimeout(() => {
        dom.uploadProgressBox.classList.add('hidden');
      }, 1800);
    }
  }

  function updateUploadProgress(percent, text) {
    dom.uploadProgressFill.style.width = `${percent}%`;
    dom.uploadProgressText.textContent = text;
  }

  // ==========================================================================
  // 16. GESTIÓN Y ELIMINACIÓN DE CONTACTOS EN PANEL ADMIN
  // ==========================================================================
  
  function renderAdminContactsList() {
    if (!dom.adminContactsList) return;

    dom.adminContactsCount.textContent = state.contacts.length;

    if (state.contacts.length === 0) {
      dom.adminContactsList.innerHTML = `
        <div class="empty-contacts-state">
          <p>No hay contactos guardados todavía.</p>
        </div>
      `;
      return;
    }

    const html = state.contacts.map(contact => {
      const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.nombre)}&background=1e293b&color=f8fafc&bold=true`;
      const photoSrc = contact.foto_url || fallbackAvatar;

      return `
        <div class="admin-contact-item" data-id="${contact.id}">
          <div class="admin-contact-left">
            <img class="admin-contact-photo" src="${escapeHtml(photoSrc)}" alt="${escapeHtml(contact.nombre)}" onerror="this.src='${fallbackAvatar}'">
            <div class="admin-contact-details">
              <span class="admin-contact-name">${escapeHtml(contact.nombre)}</span>
              <span class="admin-contact-audio-mini">
                <i class="fa-solid fa-microphone-lines"></i>
                ${contact.isDemo ? 'Audio demo integrado' : 'Audio guardado'}
              </span>
            </div>
          </div>
          <div class="admin-contact-actions">
            ${contact.audio_url ? `
              <button class="btn-play-mini-audio" data-audio="${escapeHtml(contact.audio_url)}" title="Escuchar audio">
                <i class="fa-solid fa-play"></i>
              </button>
            ` : ''}
            <button class="btn-delete-contact" data-id="${contact.id}" data-name="${escapeHtml(contact.nombre)}" title="Eliminar contacto">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    dom.adminContactsList.innerHTML = html;

    // Asignar eventos de reproducción rápida
    dom.adminContactsList.querySelectorAll('.btn-play-mini-audio').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = btn.getAttribute('data-audio');
        if (url) {
          const testAudio = new Audio(url);
          testAudio.play().catch(err => showToast('Error al reproducir audio: ' + err.message, 'error'));
        }
      });
    });

    // Asignar eventos de eliminación
    dom.adminContactsList.querySelectorAll('.btn-delete-contact').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        confirmAndDeleteContact(id, name);
      });
    });
  }

  async function confirmAndDeleteContact(id, name) {
    const contactToDelete = state.contacts.find(c => String(c.id) === String(id));
    if (!contactToDelete) return;

    if (!confirm(`¿Estás seguro de que deseas eliminar a "${name}"? Se borrará el registro y sus archivos multimedia.`)) {
      return;
    }

    if (contactToDelete.isDemo) {
      // Eliminar de los demos locales
      state.contacts = state.contacts.filter(c => String(c.id) !== String(id));
      renderContactsAgenda();
      renderAdminContactsList();
      showToast(`Contacto de prueba "${name}" eliminado.`, 'info');
      return;
    }

    if (!supabase) {
      showToast('Cliente Supabase no disponible.', 'error');
      return;
    }

    try {
      showToast(`Eliminando "${name}"...`, 'info');

      // 1. Eliminar archivos de Supabase Storage si corresponden al bucket 'multimedia'
      const filesToRemove = [];
      const extractStoragePath = (url) => {
        if (!url) return null;
        const match = url.match(/\/multimedia\/(.+)$/);
        return match ? match[1] : null;
      };

      const photoPath = extractStoragePath(contactToDelete.foto_url);
      const audioPath = extractStoragePath(contactToDelete.audio_url);

      if (photoPath) filesToRemove.push(photoPath);
      if (audioPath) filesToRemove.push(audioPath);

      if (filesToRemove.length > 0) {
        const { error: storageDelErr } = await supabase.storage
          .from('multimedia')
          .remove(filesToRemove);
        if (storageDelErr) {
          console.warn('Aviso al borrar archivos de Storage:', storageDelErr);
        }
      }

      // 2. Eliminar registro de la tabla contactos
      const { error: dbDeleteErr } = await supabase
        .from('contactos')
        .delete()
        .eq('id', id);

      if (dbDeleteErr) {
        throw new Error(`Error al eliminar de la base de datos: ${dbDeleteErr.message}`);
      }

      showToast(`Contacto "${name}" eliminado correctamente.`, 'success');
      await loadContactsFromSupabase();

    } catch (err) {
      console.error('Error al eliminar contacto:', err);
      showToast(err.message || 'Error al eliminar contacto', 'error');
    }
  }

  // ==========================================================================
  // 17. INICIALIZACIÓN DE EVENTOS DE INTERFAZ
  // ==========================================================================
  
  function initEventListeners() {
    // Modo Cumpleañero
    dom.btnRandomCall.addEventListener('click', () => {
      if (state.usingDemoContacts) {
        loadContactsFromSupabase();
      }
      triggerRandomCall();
    });

    dom.btnOpenContacts.addEventListener('click', () => {
      loadContactsFromSupabase();
      showScreen('screen-contacts');
    });

    dom.btnBackFromContacts.addEventListener('click', () => showScreen('screen-home'));

    // Re-sincronizar automáticamente cuando el usuario vuelve a la app en el móvil
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        loadContactsFromSupabase();
        loadAppGreeting();
      }
    });

    // Acceso Administrador
    dom.btnOpenAdminModal.addEventListener('click', openAdminModal);
    dom.btnCancelLogin.addEventListener('click', closeAdminModal);
    dom.formAdminLogin.addEventListener('submit', handleAdminLogin);
    dom.btnExitAdmin.addEventListener('click', () => showScreen('screen-home'));
    dom.btnAdminLogout.addEventListener('click', handleAdminLogout);

    if (dom.btnSendMagicLink) {
      dom.btnSendMagicLink.addEventListener('click', handleSendMagicLink);
    }

    // Toggle para ver contraseña en el modal
    dom.btnTogglePassword.addEventListener('click', () => {
      const type = dom.loginPassword.getAttribute('type') === 'password' ? 'text' : 'password';
      dom.loginPassword.setAttribute('type', type);
      dom.btnTogglePassword.querySelector('i').className = type === 'password' ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash';
    });

    // Formulario de cambio de contraseña en Panel Admin
    if (dom.formUpdatePassword) {
      dom.formUpdatePassword.addEventListener('submit', handleAdminUpdatePassword);
    }
    if (dom.btnToggleNewPwd) {
      dom.btnToggleNewPwd.addEventListener('click', () => {
        const type = dom.inputNewPassword.getAttribute('type') === 'password' ? 'text' : 'password';
        dom.inputNewPassword.setAttribute('type', type);
        dom.btnToggleNewPwd.querySelector('i').className = type === 'password' ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash';
      });
    }

    // Formulario de edición del mensaje de bienvenida
    if (dom.formUpdateGreeting) {
      dom.formUpdateGreeting.addEventListener('submit', handleUpdateGreeting);
    }

    // Modal de establecimiento de contraseña tras recuperación
    if (dom.formModalNewPassword) {
      dom.formModalNewPassword.addEventListener('submit', handleModalSetNewPassword);
    }
    if (dom.btnSkipModalNewPwd) {
      dom.btnSkipModalNewPwd.addEventListener('click', () => {
        dom.modalSetNewPassword.classList.add('hidden');
      });
    }
    if (dom.btnToggleModalNewPwd) {
      dom.btnToggleModalNewPwd.addEventListener('click', () => {
        const type = dom.modalInputNewPwd.getAttribute('type') === 'password' ? 'text' : 'password';
        dom.modalInputNewPwd.setAttribute('type', type);
        dom.btnToggleModalNewPwd.querySelector('i').className = type === 'password' ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash';
      });
    }

    // Llamada Entrante
    dom.btnDeclineCall.addEventListener('click', declineIncomingCall);
    dom.btnAnswerCall.addEventListener('click', answerCall);

    // En Llamada
    dom.btnHangupCall.addEventListener('click', () => hangupCall('Llamada finalizada por el usuario'));

    // Controles decorativos de llamada
    if (dom.ctrlMute) {
      dom.ctrlMute.addEventListener('click', () => {
        dom.ctrlMute.querySelector('.btn-phone-ctrl').classList.toggle('active');
        showToast('Micrófono silenciado', 'info', 1500);
      });
    }
    if (dom.ctrlSpeaker) {
      dom.ctrlSpeaker.addEventListener('click', () => {
        dom.ctrlSpeaker.querySelector('.btn-phone-ctrl').classList.toggle('active');
      });
    }

    // Formularios de subida
    dom.inputContactPhoto.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handlePhotoSelect(e.target.files[0]);
      }
    });

    dom.btnRemovePhoto.addEventListener('click', (e) => {
      e.stopPropagation();
      resetPhotoUpload();
    });

    dom.inputContactAudio.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleAudioSelect(e.target.files[0]);
      }
    });

    dom.btnRemoveAudio.addEventListener('click', (e) => {
      e.stopPropagation();
      resetAudioUpload();
    });

    dom.formAddContact.addEventListener('submit', handleAddContactSubmit);

    // Cerrar modal al pulsar tecla Escape o hacer clic fuera
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !dom.modalAdminLogin.classList.contains('hidden')) {
        closeAdminModal();
      }
    });

    dom.modalAdminLogin.addEventListener('click', (e) => {
      if (e.target === dom.modalAdminLogin) {
        closeAdminModal();
      }
    });
  }

  // ==========================================================================
  // 18. ARRANQUE DE LA APLICACIÓN
  // ==========================================================================
  
  async function init() {
    console.log('🚀 Iniciando Teléfono Virtual de Cumpleaños...');
    initEventListeners();
    await checkInitialAuthSession();
    await loadAppGreeting();
    await loadContactsFromSupabase();
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
