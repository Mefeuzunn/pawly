/* ==========================================================================
   Pawly Interactive Room & Mini-Game Playground
   Real Game Mechanics • Drag & Feed • Bubble Bath • Ball Fetch • Night Mode
   ========================================================================== */

(function () {
  let isNightMode = false;
  let activePetState = 'idle'; // idle, happy, hungry, eating, sleeping

  // 1. Odayı Başlat ve Mini-Oyunları Kur
  function setupRoomStage(container, pet, room, onAction) {
    if (!container) return;

    const mascotRenderer = window.PawlyMascot;
    const audio = window.PawlyAudio;

    container.className = `room-stage room-theme-${room} ${isNightMode ? 'night-mode' : ''}`;
    container.innerHTML = '';

    // A. EĞER YUMURTA İSE (EGG HATCHING CHAMBER)
    if (pet && !pet.hatched) {
      container.innerHTML = `
        <div class="egg-chamber-wrap">
          <div class="pet-speech-bubble" id="eggBubble">Tıkla ve çatlat! (${pet.hatchProgress || 1}/${pet.hatchNeeded || 2}) 🐣</div>
          <div class="clickable-egg-stage" id="eggInteractiveBtn">
            ${mascotRenderer.renderEggSVG(pet.hatchProgress || 1, pet.hatchNeeded || 2)}
          </div>
          <div class="egg-instruction-pill">🔥 Yumurtaya dokunarak ısıt!</div>
        </div>
      `;

      const eggBtn = container.querySelector('#eggInteractiveBtn');
      if (eggBtn) {
        eggBtn.onclick = (e) => {
          if (audio) audio.soundPop(450);
          eggBtn.classList.add('squish-anim');
          setTimeout(() => eggBtn.classList.remove('squish-anim'), 300);
          if (onAction) onAction('hatch');
        };
      }
      return;
    }

    // B. YETİŞKİN PET ODALARI
    let stageProps = '';
    let gameDock = '';

    if (room === 'living') {
      // SALON: Şömine, Lamba ve Top Yakalama Mini-Oyunu
      stageProps = `
        <div class="living-fireplace-box">
          <div class="flame-particles">🔥</div>
        </div>
        <div class="living-plant-pot">🪴</div>
        <div class="living-cozy-rug"></div>
        <div class="interactive-ball" id="tennisBall" title="Fırlatmak için tıkla!">🎾</div>
      `;
      gameDock = `
        <div class="room-game-bar">
          <button class="room-dock-item" id="btnThrowBall">🎾 Topu Fırlat</button>
          <button class="room-dock-item" id="btnPetLove">🤗 Sev & Okşa</button>
        </div>
      `;
    } else if (room === 'kitchen') {
      // MUTFAK: İnteraktif Mama Yedirme
      stageProps = `
        <div class="kitchen-picnic-table"></div>
      `;
      gameDock = `
        <div class="room-game-bar food-dock">
          <button class="food-item-btn" data-food="strawberry" title="Çilek">🍓</button>
          <button class="food-item-btn" data-food="fish" title="Somon">🐟</button>
          <button class="food-item-btn" data-food="milk" title="Süt">🍼</button>
          <button class="food-item-btn" data-food="donut" title="Donut">🍩</button>
        </div>
      `;
    } else if (room === 'bath') {
      // BANYO: Köpük Patlatma & Ördek
      stageProps = `
        <div class="clawfoot-bathtub">
          <div class="water-waves"></div>
          <div class="squeaky-duck" id="rubberDuck" title="Vıkla!">🐥</div>
        </div>
        <div class="soap-bubble-emitter" id="bubbleEmitter"></div>
      `;
      gameDock = `
        <div class="room-game-bar">
          <button class="room-dock-item" id="btnLatherSoap">🧼 Sabunla</button>
          <button class="room-dock-item" id="btnShowerWater">🚿 Durula</button>
        </div>
      `;
    } else if (room === 'bed') {
      // YATAK ODASI: Gece Modu & Lamba Aç/Kapa
      stageProps = `
        <div class="wooden-bed-frame">
          <div class="soft-duvet"></div>
          <div class="fluffy-pillow"></div>
        </div>
        <div class="bedside-lamp ${isNightMode ? 'off' : 'on'}" id="bedsideLamp" title="Gece / Gündüz lambası">
          <div class="lamp-shade">💡</div>
          <div class="lamp-cord"></div>
        </div>
        ${isNightMode ? '<div class="window-stars">✨ 🌟 ✨</div><div class="zzz-particles">💤</div>' : ''}
      `;
      gameDock = `
        <div class="room-game-bar">
          <button class="room-dock-item" id="btnToggleSleep">${isNightMode ? '☀️ Uyandır' : '🌙 Işığı Kapat & Uyut'}</button>
        </div>
      `;
    } else if (room === 'tamagotchi') {
      // TAMAGOTCHI RETRO HANDHELD OYUNU
      renderTamagotchiDevice(container, pet, onAction);
      return;
    }

    // Sahneye Karakteri ve Objeleri Ekle
    const mascotHtml = mascotRenderer.renderMascotSVG(
      pet?.species || 'cat',
      isNightMode ? 'sleeping' : activePetState,
      { hat: localStorage.getItem('pawly_pet_hat') || '', clothes: localStorage.getItem('pawly_pet_clothes') || '' }
    );

    let defaultSpeech = 'Hello there! Let\'s play together! 🐾';
    if (room === 'kitchen') defaultSpeech = 'So hungry! My tummy is rumbling! 🥺';
    if (room === 'bath') defaultSpeech = 'Warm bubble bath is so fresh! 🫧';
    if (room === 'bed') defaultSpeech = isNightMode ? 'Zzz... good night babe 💕' : 'Cozy bed! Tuck me in when it\'s late 🛏️';

    container.innerHTML = `
      ${stageProps}
      <div class="pet-stage-character" id="petInteractiveWrap">
        <div class="pet-speech-bubble" id="petSpeechBubble">${defaultSpeech}</div>
        <div class="pet-svg-container" id="petSvgBox">
          ${mascotHtml}
        </div>
      </div>
      ${gameDock}
    `;

    // Etkileşim Olaylarını Bağla
    bindRoomInteractions(container, pet, room, onAction);
  }

  // 2. Oda Etkileşim Dinleyicileri
  function bindRoomInteractions(container, pet, room, onAction) {
    const audio = window.PawlyAudio;
    const petWrap = container.querySelector('#petSvgBox');
    const bubble = container.querySelector('#petSpeechBubble');

    // A. Pet'e Tıklama (Okşama / Sevme)
    if (petWrap) {
      petWrap.onclick = () => {
        if (audio) audio.soundHappy();
        setTemporaryState('happy', 1800, pet, room, container);
        if (bubble) bubble.textContent = 'I love you so much! 🥰';
        spawnHeartParticles(petWrap);
        if (onAction) onAction('pet');
      };
    }

    // B. Mutfak: Yiyecek Verme
    container.querySelectorAll('.food-item-btn').forEach(btn => {
      btn.onclick = () => {
        const foodEmoji = btn.textContent;
        if (audio) audio.soundEat();
        setTemporaryState('eating', 2200, pet, room, container);
        if (bubble) bubble.textContent = `Yum yum! ${foodEmoji} is so tasty! 😋`;
        spawnHeartParticles(btn, foodEmoji);
        if (onAction) onAction('feed');
      };
    });

    // C. Banyo: Sabun & Baloncuklar
    const duck = container.querySelector('#rubberDuck');
    if (duck) {
      duck.onclick = () => {
        if (audio) audio.soundPop(750);
        duck.classList.add('squish-anim');
        setTimeout(() => duck.classList.remove('squish-anim'), 300);
      };
    }

    const btnLather = container.querySelector('#btnLatherSoap');
    if (btnLather) {
      btnLather.onclick = () => {
        if (audio) audio.soundBubble();
        spawnFloatingBubbles(container);
        if (bubble) bubble.textContent = 'So bubbly and clean! 🫧';
        if (onAction) onAction('clean');
      };
    }

    const btnShower = container.querySelector('#btnShowerWater');
    if (btnShower) {
      btnShower.onclick = () => {
        if (audio) audio.soundBubble();
        setTemporaryState('happy', 1500, pet, room, container);
        if (bubble) bubble.textContent = 'Squeaky clean! ✨';
      };
    }

    // D. Salon: Top Fırlatma
    const ball = container.querySelector('#tennisBall');
    const btnBall = container.querySelector('#btnThrowBall');
    const throwBall = () => {
      if (!ball) return;
      if (audio) audio.soundBounce();
      ball.classList.add('ball-bouncing-anim');
      if (petWrap) petWrap.classList.add('pet-chase-anim');

      setTimeout(() => {
        if (audio) audio.soundHappy();
        ball.classList.remove('ball-bouncing-anim');
        if (petWrap) petWrap.classList.remove('pet-chase-anim');
        setTemporaryState('happy', 2000, pet, room, container);
        if (bubble) bubble.textContent = 'I caught the ball! Yay! 🎾';
        if (onAction) onAction('play');
      }, 1400);
    };

    if (ball) ball.onclick = throwBall;
    if (btnBall) btnBall.onclick = throwBall;

    // E. Yatak Odası: Lamba & Gece Modu
    const lamp = container.querySelector('#bedsideLamp');
    const btnSleep = container.querySelector('#btnToggleSleep');
    const toggleNight = () => {
      isNightMode = !isNightMode;
      if (audio) audio.soundPop(320);
      setupRoomStage(container, pet, 'bed', onAction);
    };

    if (lamp) lamp.onclick = toggleNight;
    if (btnSleep) btnSleep.onclick = toggleNight;
  }

  // 3. Geçici Durum Geçişi (Yemek yerken, Sevilirken)
  function setTemporaryState(state, durationMs, pet, room, container) {
    activePetState = state;
    const petBox = container.querySelector('#petSvgBox');
    if (petBox && window.PawlyMascot) {
      petBox.innerHTML = window.PawlyMascot.renderMascotSVG(
        pet?.species || 'cat',
        state,
        { hat: localStorage.getItem('pawly_pet_hat') || '', clothes: localStorage.getItem('pawly_pet_clothes') || '' }
      );
    }

    setTimeout(() => {
      activePetState = 'idle';
      if (petBox && window.PawlyMascot) {
        petBox.innerHTML = window.PawlyMascot.renderMascotSVG(
          pet?.species || 'cat',
          isNightMode ? 'sleeping' : 'idle',
          { hat: localStorage.getItem('pawly_pet_hat') || '', clothes: localStorage.getItem('pawly_pet_clothes') || '' }
        );
      }
    }, durationMs);
  }

  // 4. Baloncuk Üretici (Bubble Emitter)
  function spawnFloatingBubbles(container) {
    const audio = window.PawlyAudio;
    for (let i = 0; i < 6; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'game-bubble-particle';
      bubble.textContent = '🫧';
      bubble.style.left = `${20 + Math.random() * 60}%`;
      bubble.style.bottom = `${20 + Math.random() * 30}px`;
      bubble.style.animationDuration = `${2 + Math.random() * 2}s`;

      bubble.onclick = () => {
        if (audio) audio.soundBubble();
        bubble.style.transform = 'scale(1.8)';
        bubble.style.opacity = '0';
        setTimeout(() => bubble.remove(), 150);
      };

      container.appendChild(bubble);
      setTimeout(() => bubble.remove(), 4000);
    }
  }

  // 5. Kalp & Parçacık Animasyonu
  function spawnHeartParticles(el, emoji = '💖') {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    for (let i = 0; i < 4; i++) {
      const p = document.createElement('div');
      p.className = 'floating-heart';
      p.textContent = emoji;
      p.style.left = `${rect.left + rect.width / 2 + (Math.random() * 40 - 20)}px`;
      p.style.top = `${rect.top + (Math.random() * 20 - 10)}px`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1100);
    }
  }

  // 6. Retro Tamagotchi El Konsolu (Screenshot 3 - 1:1 Casing)
  function renderTamagotchiDevice(container, pet, onAction) {
    const audio = window.PawlyAudio;
    container.innerHTML = `
      <div class="tamagotchi-game-chassis">
        <div class="tamagotchi-keychain-ring"></div>
        <div class="tamagotchi-lcd-screen">
          <div class="tamagotchi-lcd-scanlines"></div>
          <div class="tamagotchi-top-icons">
            <span>🦴</span> <span>🥣</span> <span>💤</span> <span>❤️</span>
          </div>
          <div class="tamagotchi-pet-pixel-art" id="tamaPixelPet">
            ${pet?.species === 'cat' ? '🐱' : pet?.species === 'shiba' ? '🐕' : '🐻'}
          </div>
          <div class="tamagotchi-speech-strip">So hungry! My tummy is rumbling! 🥺</div>
        </div>
        <div class="tamagotchi-buttons-console">
          <button class="tama-tactile-btn" id="btnTamaFeed" title="Besle">🦴</button>
          <button class="tama-tactile-btn" id="btnTamaWater" title="Su Ver">🥣</button>
          <button class="tama-tactile-btn" id="btnTamaLove" title="Sev">🍼</button>
        </div>
      </div>
    `;

    const pixelPet = container.querySelector('#tamaPixelPet');
    const strip = container.querySelector('.tamagotchi-speech-strip');

    const triggerTama = (type, soundFreq, text) => {
      if (audio) audio.soundTamaBeep(soundFreq);
      if (pixelPet) {
        pixelPet.classList.add('squish-anim');
        setTimeout(() => pixelPet.classList.remove('squish-anim'), 350);
      }
      if (strip) strip.textContent = text;
      if (onAction) onAction(type);
    };

    container.querySelector('#btnTamaFeed').onclick = () => triggerTama('feed', 750, 'Yum yum! Crunch crunch! 🦴');
    container.querySelector('#btnTamaWater').onclick = () => triggerTama('water', 900, 'Slurp slurp! Fresh water! 🥣');
    container.querySelector('#btnTamaLove').onclick = () => triggerTama('pet', 1100, 'I love you! Hearts! 🍼');
  }

  window.PawlyRoomGame = {
    setupRoomStage
  };
})();
