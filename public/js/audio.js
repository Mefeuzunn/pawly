/* ==========================================================================
   Pawly / Widgetable Sound Synthesizer (Web Audio API)
   Zero external dependencies • Zero latency • 100% procedural cute audio
   ========================================================================== */

let audioCtx = null;
let soundEnabled = localStorage.getItem('pawly_sound') !== 'false';

function getAudioCtx() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Global ses aç/kapa
function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem('pawly_sound', soundEnabled);
  return soundEnabled;
}

function isSoundEnabled() {
  return soundEnabled;
}

// 1. Sevimli Buton / Dokunma Tıkı (Bubble Pop / Tap)
function soundPop(freq = 600, duration = 0.08) {
  if (!soundEnabled) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.8, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

// 2. Çiğneme & Mama Yeme Sesi (Nom Nom Crunch)
function soundEat() {
  if (!soundEnabled) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    [0, 0.09, 0.18].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const f = 340 + i * 90;
      osc.frequency.setValueAtTime(f, now + delay);
      osc.frequency.exponentialRampToValueAtTime(f * 0.6, now + delay + 0.07);

      gain.gain.setValueAtTime(0.2, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.07);
    });
  } catch {}
}

// 3. Su / Banyo Baloncuğu Patlama Sesi (Squish Pop)
function soundBubble() {
  if (!soundEnabled) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const startF = 400 + Math.random() * 200;
    osc.frequency.setValueAtTime(startF, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(startF * 2.2, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {}
}

// 4. Kalp & Özlem Sesi (Sweet Harp Note)
function soundHeart() {
  if (!soundEnabled) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  try {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const note = notes[Math.floor(Math.random() * notes.length)];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(note, ctx.currentTime);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {}
}

// 5. Sevme & Okşama Mırıltısı (Happy Purr / Chirp)
function soundHappy() {
  if (!soundEnabled) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    [0, 0.08].forEach((d, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587 + i * 150, now + d);
      osc.frequency.exponentialRampToValueAtTime(880, now + d + 0.12);

      gain.gain.setValueAtTime(0.18, now + d);
      gain.gain.exponentialRampToValueAtTime(0.001, now + d + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + d);
      osc.stop(now + d + 0.12);
    });
  } catch {}
}

// 6. 8-Bit Retro Tamagotchi Bip Sesi (Game Boy Chirp)
function soundTamaBeep(freq = 980) {
  if (!soundEnabled) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square'; // 8-bit chiptune
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch {}
}

// 7. Kutlama & Yumurta Çatlatma Fanfarı (Victory Chime)
function soundFanfare() {
  if (!soundEnabled) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  try {
    const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    const now = ctx.currentTime;
    chords.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.2, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.4);
    });
  } catch {}
}

// 8. Top Sektirme & Yakalama (Ball Bounce)
function soundBounce() {
  if (!soundEnabled) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {}
}

window.PawlyAudio = {
  toggleSound,
  isSoundEnabled,
  soundPop,
  soundEat,
  soundBubble,
  soundHeart,
  soundHappy,
  soundTamaBeep,
  soundFanfare,
  soundBounce
};
