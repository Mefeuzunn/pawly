/* ==========================================================================
   Pawly Interactive Room & Mini-Game Playground (1:1 Living Game Engine)
   Drag & Feed Physics • Scrub & Bubble Bath • Ball Fetch • Bedtime Dream Mode
   ========================================================================== */

(function () {
  let isNightMode = false;
  let activePetState = 'idle'; // idle, happy, hungry, eating, sleeping
  let ballAnimFrame = null;
  let dreamInterval = null;
  let adventureInterval = null;

  // 1. Odayı Başlat ve Mini-Oyunları Kur
  function setupRoomStage(container, pet, room, onAction) {
    if (!container) return;

    if (ballAnimFrame) {
      cancelAnimationFrame(ballAnimFrame);
      ballAnimFrame = null;
    }
    if (dreamInterval) {
      clearInterval(dreamInterval);
      dreamInterval = null;
    }
    if (adventureInterval) {
      clearInterval(adventureInterval);
      adventureInterval = null;
    }

    const mascotRenderer = window.PawlyMascot;
    const audio = window.PawlyAudio;

    container.className = `room-stage room-theme-${room} ${isNightMode ? 'night-mode' : ''}`;
    container.innerHTML = '';

    // A. EĞER YUMURTA İSE (EGG HATCHING CHAMBER - 3 AŞAMALI ÇATLAMA)
    if (pet && !pet.hatched) {
      const progress = pet.hatchProgress || 1;
      const needed = pet.hatchNeeded || 2;
      const crackRatio = progress / needed;

      let crackClass = 'egg-crack-0';
      let crackDesc = 'Pürüzsüz ve sıcak bir yumurta... İçeriden hafif kıpırtılar geliyor!';
      if (crackRatio >= 1) {
        crackClass = 'egg-crack-2';
        crackDesc = '✨ Kabuk çatlamak üzere! Son dokunuşla yeni dostunu dünyaya çıkar! ✨';
      } else if (crackRatio >= 0.5) {
        crackClass = 'egg-crack-1';
        crackDesc = 'Çatlaklar belirdi! Kabuktan altın gibi ışıklar sızıyor! 🐣';
      }

      container.innerHTML = `
        <div class="egg-chamber-wrap">
          <div class="pet-speech-bubble" id="eggBubble">${crackDesc}</div>
          <div class="clickable-egg-stage ${crackClass}" id="eggInteractiveBtn" title="Dokun ve çatlat!">
            ${mascotRenderer.renderEggSVG(progress, needed)}
            <div class="egg-tap-sparks" id="eggSparks"></div>
          </div>
          <div class="egg-instruction-pill">
            🔥 Isıtma İlerlemesi: <b>${progress} / ${needed}</b>
          </div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:8px">
            ${needed > 1 ? 'Ortak canavar: Partnerinle birlikte dokunarak çatlatın!' : 'Dokunarak yumurtayı çatlat!'}
          </div>
        </div>
      `;

      const eggBtn = container.querySelector('#eggInteractiveBtn');
      if (eggBtn) {
        eggBtn.onclick = () => {
          if (audio) audio.soundPop(500);
          eggBtn.classList.add('squish-anim');
          setTimeout(() => eggBtn.classList.remove('squish-anim'), 300);

          // Çatlama kıvılcımları
          spawnSparks(eggBtn);

          if (progress >= needed) {
            if (audio) audio.soundFanfare();
          }

          if (onAction) onAction('hatch');
        };
      }
      return;
    }

    // B. YETİŞKİN PET İÇİN CANLI ODA SAHNESİ
    let stageProps = '';
    let gameDock = '';

    // Pet Canlı Durum Göstergesi (Stats Bar HUD)
    const statsHud = pet?.stats ? `
      <div class="pet-stats-hud">
        <div class="stat-hud-item" title="Açlık (Food)">
          <span class="stat-icon">🍓</span>
          <div class="stat-bar-track">
            <div class="stat-bar-fill stat-food" style="width:${pet.stats.food || 75}%"></div>
          </div>
          <span class="stat-val">${pet.stats.food || 75}%</span>
        </div>
        <div class="stat-hud-item" title="Hijyen (Clean)">
          <span class="stat-icon">🫧</span>
          <div class="stat-bar-track">
            <div class="stat-bar-fill stat-clean" style="width:${pet.stats.clean || 75}%"></div>
          </div>
          <span class="stat-val">${pet.stats.clean || 75}%</span>
        </div>
        <div class="stat-hud-item" title="Enerji (Energy)">
          <span class="stat-icon">⚡</span>
          <div class="stat-bar-track">
            <div class="stat-bar-fill stat-energy" style="width:${pet.stats.energy || 80}%"></div>
          </div>
          <span class="stat-val">${pet.stats.energy || 80}%</span>
        </div>
        <div class="stat-hud-item" title="Mutluluk (Happy)">
          <span class="stat-icon">💖</span>
          <div class="stat-bar-track">
            <div class="stat-bar-fill stat-happy" style="width:${pet.stats.happy || 80}%"></div>
          </div>
          <span class="stat-val">${pet.stats.happy || 80}%</span>
        </div>
      </div>
    ` : '';

    if (room === 'living') {
      // 1. SALON: Şömine, Rahat Halı ve Fiziksel Seken Tenis Topu
      stageProps = `
        <div class="living-fireplace-box">
          <div class="flame-particles">🔥</div>
        </div>
        <div class="living-plant-pot">🪴</div>
        <div class="living-cozy-rug"></div>
        <div class="interactive-ball" id="tennisBall" title="Fırlatmak veya sürüklemek için dokun!">🎾</div>
      `;
      gameDock = `
        <div class="room-game-bar">
          <button class="room-dock-item" id="btnThrowBall">🎾 Topu Fırlat</button>
          <button class="room-dock-item" id="btnPetLove">🤗 Sev & Okşa</button>
        </div>
      `;
    } else if (room === 'kitchen') {
      // 2. MUTFAK: Sürükle-Bırak Fiziksel Yemekler
      stageProps = `
        <div class="kitchen-picnic-table"></div>
        <div class="drag-food-tip">👆 Yiyeceği canavarın ağzına sürükle!</div>
      `;
      gameDock = `
        <div class="room-game-bar food-dock">
          <div class="draggable-food-item" draggable="true" data-food="strawberry" title="Çilek">🍓</div>
          <div class="draggable-food-item" draggable="true" data-food="fish" title="Somon">🐟</div>
          <div class="draggable-food-item" draggable="true" data-food="milk" title="Süt">🍼</div>
          <div class="draggable-food-item" draggable="true" data-food="donut" title="Donut">🍩</div>
          <div class="draggable-food-item" draggable="true" data-food="honey" title="Bal">🍯</div>
        </div>
      `;
    } else if (room === 'bath') {
      // 3. BANYO: Sabun Süngeri, Patlatılabilir Köpükler & Ördek
      stageProps = `
        <div class="clawfoot-bathtub">
          <div class="water-waves"></div>
          <div class="squeaky-duck" id="rubberDuck" title="Vıkla!">🐥</div>
        </div>
        <div class="scrub-sponge-tool" id="scrubSponge" title="Canavarı köpürtmek için gezdir!">🧽</div>
        <div class="shower-head-fixture" id="showerHead" title="Durulamak için tıkla!">🚿</div>
        <div class="soap-bubble-emitter" id="bubbleEmitter"></div>
      `;
      gameDock = `
        <div class="room-game-bar">
          <button class="room-dock-item" id="btnLatherSoap">🧼 Bol Köpük Saç</button>
          <button class="room-dock-item" id="btnShowerWater">🚿 Duş Başlığı ile Durula</button>
        </div>
      `;
    } else if (room === 'bed') {
      // 4. YATAK ODASI: Gece Modu & Başucu Lambası
      stageProps = `
        <div class="wooden-bed-frame">
          <div class="soft-duvet"></div>
          <div class="fluffy-pillow"></div>
        </div>
        <div class="bedside-lamp ${isNightMode ? 'off' : 'on'}" id="bedsideLamp" title="Işığı aç/kapat">
          <div class="lamp-shade">💡</div>
          <div class="lamp-cord-pull" id="lampCord"></div>
        </div>
        ${isNightMode ? `
          <div class="window-stars">🌙 ✨ 🌟 ✨</div>
          <div class="zzz-particles" id="zzzCloud">💤</div>
          <div class="dream-bubble-float" id="dreamBubble">💭 💕</div>
        ` : ''}
      `;
      gameDock = `
        <div class="room-game-bar">
          <button class="room-dock-item" id="btnToggleSleep">
            ${isNightMode ? '☀️ Işığı Aç & Uyandır' : '🌙 Işığı Kapat & Mışıl Mışıl Uyu'}
          </button>
        </div>
      `;
    } else if (room === 'tamagotchi') {
      renderTamagotchiDevice(container, pet, onAction);
      return;
    }

    // Sahneye Maskotu ve Parçaları Yerleştir
    const mascotHtml = mascotRenderer ? mascotRenderer.renderMascotSVG(
      pet?.species || 'cat',
      isNightMode ? 'sleeping' : activePetState,
      { hat: localStorage.getItem('pawly_pet_hat') || '', clothes: localStorage.getItem('pawly_pet_clothes') || '' }
    ) : '';

    let defaultSpeech = 'Merhaba! Birlikte harika vakit geçirelim! 🐾';
    if (room === 'kitchen') defaultSpeech = 'Karnım zil çalıyor! Bir şeyler yedirir misin? 🥺';
    if (room === 'bath') defaultSpeech = 'Köpüklü ılık bir banyo ne güzel olurdu! 🫧';
    if (room === 'bed') defaultSpeech = isNightMode ? 'Zzz... Tatlı rüyalar aşkım 💕' : 'Yumuşacık yatak! Uykum gelince lambayı söndür 🛏️';
    if (room === 'living') defaultSpeech = 'Topu fırlat, hemen yakalayıp getireyim! 🎾';

    // Aktif Macera Başlığı (Banner)
    let advBannerHtml = '';
    if (pet && pet.adventure) {
      const adv = pet.adventure;
      const dest = adv.destination || { name: 'Dünya Turu 🎒', city: 'Keşif', item: 'Hatıra' };
      const isFin = adv.isFinished || adv.remainingSec <= 0;
      const mins = Math.floor((adv.remainingSec || 0) / 60);
      const secs = (adv.remainingSec || 0) % 60;
      const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      defaultSpeech = `Şu an ${dest.city} sokaklarındayım! Sana harika bir hediye arıyorum... 🎒✨`;

      advBannerHtml = `
        <div class="pet-adventure-banner" id="petAdvBanner">
          <div class="pet-adv-left">
            <div class="pet-adv-icon-badge">🎒</div>
            <div class="pet-adv-info">
              <h4><span>✈️</span> <span>${dest.name}</span></h4>
              <div class="adv-countdown" id="petAdvCountdown">
                ${isFin ? '🎉 Seyahat Tamamlandı!' : `Kalan Süre: <span id="advTimerSpan">${timeStr}</span>`}
              </div>
            </div>
          </div>
          <div class="pet-adv-actions">
            ${isFin ? `
              <button class="btn-adv-claim" id="btnClaimAdvInsideRoom">🎁 Karşıla & Al 📸</button>
            ` : `
              <button class="btn-adv-speedup" id="btnSpeedupAdvInsideRoom">⚡ Hızlandır</button>
            `}
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      ${statsHud}
      ${advBannerHtml}
      ${stageProps}
      <div class="pet-stage-character" id="petInteractiveWrap">
        <div class="pet-speech-bubble" id="petSpeechBubble">${defaultSpeech}</div>
        <div class="pet-3d-box" id="pet3DBox" style="width:260px;height:240px;margin:0 auto;position:relative">
          ${mascotHtml}
        </div>
      </div>
      ${gameDock}
    `;

    // 3D Three.js WebGL Maskotunu Başlat
    const petBox = container.querySelector('#pet3DBox');
    if (petBox && window.Pet3DScene) {
      if (window._currentPet3D) {
        try { window._currentPet3D.destroy(); } catch {}
      }
      try {
        window._currentPet3D = new window.Pet3DScene(petBox, {
          species: pet?.species || 'cat',
          state: isNightMode ? 'sleeping' : activePetState,
          outfit: {
            hat: localStorage.getItem('pawly_pet_hat') || '',
            clothes: localStorage.getItem('pawly_pet_clothes') || ''
          }
        });
      } catch (err) {
        console.warn('3D WebGL başlatılamadı, SVG devrede:', err);
      }
    }

    // Oda Etkileşimlerini Bağla
    bindRoomInteractions(container, pet, room, onAction);
  }

  // 2. Oda Etkileşim Dinleyicileri (Mini-Game Logic)
  function bindRoomInteractions(container, pet, room, onAction) {
    const audio = window.PawlyAudio;
    const pet3DBox = container.querySelector('#pet3DBox');
    const bubble = container.querySelector('#petSpeechBubble');

    // Macera Eylemleri (Oda İçi Banner)
    const btnSpeedup = container.querySelector('#btnSpeedupAdvInsideRoom');
    if (btnSpeedup) {
      btnSpeedup.onclick = async () => {
        if (audio) audio.soundPop(600);
        if (onAction) onAction('adventure_speedup');
      };
    }

    const btnClaim = container.querySelector('#btnClaimAdvInsideRoom');
    if (btnClaim) {
      btnClaim.onclick = async () => {
        if (audio) audio.soundFanfare();
        if (onAction) onAction('adventure_claim');
      };
    }

    // Canlı Geri Sayım Sayacı
    if (adventureInterval) {
      clearInterval(adventureInterval);
      adventureInterval = null;
    }
    if (pet && pet.adventure && pet.adventure.remainingSec > 0) {
      let rem = pet.adventure.remainingSec;
      adventureInterval = setInterval(() => {
        rem--;
        const span = container.querySelector('#advTimerSpan');
        if (span) {
          const m = Math.floor(Math.max(0, rem) / 60);
          const s = Math.max(0, rem) % 60;
          span.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        if (rem <= 0) {
          clearInterval(adventureInterval);
          adventureInterval = null;
          if (audio) audio.soundDoorbell();
          if (onAction) onAction('adventure_finished');
        }
      }, 1000);
    }

    // A. Pet'e Dokunma / Okşama (Pet Loving)
    if (pet3DBox) {
      pet3DBox.addEventListener('click', () => {
        if (audio) audio.soundHappy();
        setTemporaryState('happy', 1800, pet, room, container);
        if (bubble) bubble.textContent = 'Seni çok ama çok seviyorum! 🥰';
        spawnHeartParticles(pet3DBox, '💖');
        if (onAction) onAction('pet');
      });
    }

    const btnPet = container.querySelector('#btnPetLove');
    if (btnPet) {
      btnPet.onclick = () => {
        if (audio) audio.soundHappy();
        setTemporaryState('happy', 1800, pet, room, container);
        if (bubble) bubble.textContent = 'Mırrr... Bu çok iyi geldi! 😻';
        spawnHeartParticles(pet3DBox || btnPet, '💖');
        if (onAction) onAction('pet');
      };
    }

    // B. MUTFAK: Sürükle-Bırak Yemek Yedirme Mekaniği
    if (room === 'kitchen') {
      const foodItems = container.querySelectorAll('.draggable-food-item');
      foodItems.forEach(item => {
        const foodEmoji = item.textContent;

        const feedPet = (clientX, clientY) => {
          if (audio) audio.soundEat();
          if (window._currentPet3D && typeof window._currentPet3D.triggerChew === 'function') {
            window._currentPet3D.triggerChew(2200);
          } else {
            setTemporaryState('eating', 2200, pet, room, container);
          }

          if (bubble) bubble.textContent = `Ham hum! ${foodEmoji} inanılmaz lezzetli! 😋`;
          spawnFoodCrumbs(pet3DBox || container, foodEmoji);
          spawnFloatingText(pet3DBox || container, `+25 Açlık! ${foodEmoji}`, '#FF6584');

          if (onAction) onAction('feed');
        };

        // 1. Tıklayarak Uçarak Yedirme
        item.onclick = (e) => feedPet(e.clientX, e.clientY);

        // 2. Masaüstü & Mobil Sürükleme (Drag & Drop)
        let isDraggingFood = false;
        let dragGhost = null;

        const onPointerDown = (e) => {
          isDraggingFood = true;
          item.classList.add('item-being-dragged');

          dragGhost = document.createElement('div');
          dragGhost.className = 'floating-drag-ghost';
          dragGhost.textContent = foodEmoji;
          document.body.appendChild(dragGhost);
          moveGhost(e.clientX, e.clientY);

          window.addEventListener('pointermove', onPointerMove);
          window.addEventListener('pointerup', onPointerUp);
        };

        const moveGhost = (x, y) => {
          if (!dragGhost) return;
          dragGhost.style.left = `${x}px`;
          dragGhost.style.top = `${y}px`;
          if (window._currentPet3D && typeof window._currentPet3D.lookAtPoint === 'function') {
            window._currentPet3D.lookAtPoint(x, y);
          }
        };

        const onPointerMove = (e) => {
          if (!isDraggingFood) return;
          moveGhost(e.clientX, e.clientY);
        };

        const onPointerUp = (e) => {
          if (!isDraggingFood) return;
          isDraggingFood = false;
          item.classList.remove('item-being-dragged');

          if (dragGhost) {
            dragGhost.remove();
            dragGhost = null;
          }

          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerup', onPointerUp);

          // Canavarın üzerine bırakıldı mı?
          if (pet3DBox) {
            const rect = pet3DBox.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
              feedPet(e.clientX, e.clientY);
            }
          }
        };

        item.addEventListener('pointerdown', onPointerDown);
      });
    }

    // C. BANYO: Süngerle Köpürtme, Sabun Baloncukları & Ördek
    if (room === 'bath') {
      const sponge = container.querySelector('#scrubSponge');
      const duck = container.querySelector('#rubberDuck');
      const shower = container.querySelector('#showerHead');
      const btnLather = container.querySelector('#btnLatherSoap');
      const btnShower = container.querySelector('#btnShowerWater');

      // 1. Ördeğe Tıklama
      if (duck) {
        duck.onclick = () => {
          if (audio) audio.soundPop(820);
          duck.classList.add('squish-anim');
          setTimeout(() => duck.classList.remove('squish-anim'), 300);
          spawnFloatingText(duck, 'Vıyk! 🐥', '#FFA34E');
        };
      }

      // 2. Süngerle Canavarı Ovalama (Scrubbing)
      if (sponge) {
        let isScrubbing = false;
        sponge.addEventListener('pointerdown', (e) => {
          isScrubbing = true;
          sponge.classList.add('sponge-active');

          const onMove = (ev) => {
            if (!isScrubbing) return;
            sponge.style.left = `${ev.clientX - container.getBoundingClientRect().left - 20}px`;
            sponge.style.top = `${ev.clientY - container.getBoundingClientRect().top - 20}px`;

            if (pet3DBox) {
              const rect = pet3DBox.getBoundingClientRect();
              if (ev.clientX >= rect.left && ev.clientX <= rect.right &&
                  ev.clientY >= rect.top && ev.clientY <= rect.bottom) {
                if (Math.random() > 0.6) {
                  if (audio) audio.soundBubble();
                  spawnSudsParticle(pet3DBox, ev.clientX, ev.clientY);
                }
              }
            }
          };

          const onUp = () => {
            isScrubbing = false;
            sponge.classList.remove('sponge-active');
            sponge.style.left = '';
            sponge.style.top = '';
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            if (bubble) bubble.textContent = 'Köpükler her yerimi sardı! Tertemiz oluyorum! 🫧';
          };

          window.addEventListener('pointermove', onMove);
          window.addEventListener('pointerup', onUp);
        });
      }

      // 3. Sabunla Butonu
      if (btnLather) {
        btnLather.onclick = () => {
          if (audio) audio.soundBubble();
          spawnFloatingBubbles(container);
          if (bubble) bubble.textContent = 'Rengarenk sabun köpükleri! Dokun ve patlat! 🫧';
          spawnFloatingText(btnLather, 'Köpükler! 🫧', '#38C793');
        };
      }

      // 4. Duş Başlığı ile Durulama
      const doShower = () => {
        if (audio) audio.soundBubble();
        setTemporaryState('happy', 2000, pet, room, container);
        spawnShowerStreams(container);
        if (bubble) bubble.textContent = 'Mis gibi oldum! Işıl ışıl parlıyorum! ✨';
        spawnFloatingText(pet3DBox || container, '+35 Temizlik! 🫧', '#2EB080');
        if (onAction) onAction('clean');
      };

      if (shower) shower.onclick = doShower;
      if (btnShower) btnShower.onclick = doShower;

      // Otomatik Yükselen Köpükler (Sürekli patlatılabilir)
      spawnFloatingBubbles(container, 8);
    }

    // D. SALON: Fiziksel Seken Tenis Topu & Maskot Yakalaması
    if (room === 'living') {
      const ball = container.querySelector('#tennisBall');
      const btnBall = container.querySelector('#btnThrowBall');

      const triggerBallPhysics = () => {
        if (!ball) return;
        if (audio) audio.soundBounce();

        let posX = 40;
        let posY = 20;
        let vx = (Math.random() * 8 + 6);
        let vy = -12;
        const gravity = 0.65;
        const bounceDamping = 0.72;
        let bounces = 0;

        ball.classList.add('ball-active-physics');

        function stepBall() {
          vy += gravity;
          posX += vx;
          posY += vy;

          // Zemin Çarpışması
          if (posY >= 160) {
            posY = 160;
            vy = -vy * bounceDamping;
            vx *= 0.85;
            bounces++;
            if (audio && Math.abs(vy) > 2) audio.soundBounce();
          }

          // Duvar Çarpışması
          if (posX > 240 || posX < 20) {
            vx = -vx * bounceDamping;
          }

          ball.style.transform = `translate(${posX}px, ${posY}px)`;

          // 3D Maskot kafa takibi
          if (window._currentPet3D && typeof window._currentPet3D.lookAtPoint === 'function') {
            const ballRect = ball.getBoundingClientRect();
            window._currentPet3D.lookAtPoint(ballRect.left, ballRect.top);
          }

          if (bounces < 5 && Math.abs(vy) > 1) {
            ballAnimFrame = requestAnimationFrame(stepBall);
          } else {
            // Top durdu: Maskot koşup yakalar
            setTimeout(() => {
              if (audio) audio.soundHappy();
              if (bubble) bubble.textContent = 'Topu yakaladım ve getirdim! Harika bir atıştı! 🎾🐕';
              spawnFloatingText(ball, '+25 Mutluluk! 🎾', '#FFA34E');
              ball.classList.remove('ball-active-physics');
              ball.style.transform = '';
              setTemporaryState('happy', 2000, pet, room, container);
              if (onAction) onAction('play');
            }, 600);
          }
        }

        ballAnimFrame = requestAnimationFrame(stepBall);
      };

      if (ball) ball.onclick = triggerBallPhysics;
      if (btnBall) btnBall.onclick = triggerBallPhysics;
    }

    // E. YATAK ODASI: Lamba Çekme & Gece Rüya Modu
    if (room === 'bed') {
      const lamp = container.querySelector('#bedsideLamp');
      const cord = container.querySelector('#lampCord');
      const btnSleep = container.querySelector('#btnToggleSleep');

      const toggleNightMode = () => {
        isNightMode = !isNightMode;
        if (audio) audio.soundPop(320);

        if (cord) {
          cord.classList.add('cord-pulled');
          setTimeout(() => cord.classList.remove('cord-pulled'), 200);
        }

        setupRoomStage(container, pet, 'bed', onAction);

        if (isNightMode) {
          spawnFloatingText(container, 'İyi geceler... Zzz 💤', '#A58BFF');
          startDreamBubbleLoop(container);
        } else {
          spawnFloatingText(container, 'Günaydın! Güneş doğdu! ☀️', '#FFD166');
        }

        if (onAction) onAction('sleep');
      };

      if (lamp) lamp.onclick = toggleNightMode;
      if (cord) cord.onclick = toggleNightMode;
      if (btnSleep) btnSleep.onclick = toggleNightMode;

      if (isNightMode) {
        startDreamBubbleLoop(container);
      }
    }
  }

  // 3. Rüya Baloncukları Döngüsü (Gece Modu)
  function startDreamBubbleLoop(container) {
    if (dreamInterval) clearInterval(dreamInterval);
    const dreams = ['💭 🍓', '💭 💕', '💭 🐟', '💭 🌟', '💭 🎾', '💭 🍰'];
    let idx = 0;

    dreamInterval = setInterval(() => {
      const dreamEl = container.querySelector('#dreamBubble');
      if (dreamEl) {
        dreamEl.textContent = dreams[idx % dreams.length];
        dreamEl.classList.remove('dream-pulse');
        void dreamEl.offsetWidth; // reflow
        dreamEl.classList.add('dream-pulse');
        idx++;
      }
    }, 3200);
  }

  // 4. Geçici Durum Geçişi (Yemek yerken, Sevilirken)
  function setTemporaryState(state, durationMs, pet, room, container) {
    activePetState = state;
    if (window._currentPet3D) {
      window._currentPet3D.state = state;
      if (state === 'happy' || state === 'eating') {
        window._currentPet3D.triggerSquish();
      }
    }

    const petBox = container.querySelector('#pet3DBox') || container.querySelector('#petSvgBox');
    if (petBox && window.PawlyMascot && !window._currentPet3D) {
      petBox.innerHTML = window.PawlyMascot.renderMascotSVG(
        pet?.species || 'cat',
        state,
        { hat: localStorage.getItem('pawly_pet_hat') || '', clothes: localStorage.getItem('pawly_pet_clothes') || '' }
      );
    }

    setTimeout(() => {
      activePetState = 'idle';
      if (window._currentPet3D) {
        window._currentPet3D.state = isNightMode ? 'sleeping' : 'idle';
      } else if (petBox && window.PawlyMascot) {
        petBox.innerHTML = window.PawlyMascot.renderMascotSVG(
          pet?.species || 'cat',
          isNightMode ? 'sleeping' : 'idle',
          { hat: localStorage.getItem('pawly_pet_hat') || '', clothes: localStorage.getItem('pawly_pet_clothes') || '' }
        );
      }
    }, durationMs);
  }

  // 5. Patlatılabilir Sabun Baloncuğu Üretici (Poppable Bubbles)
  function spawnFloatingBubbles(container, count = 7) {
    const audio = window.PawlyAudio;
    for (let i = 0; i < count; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'game-bubble-particle';
      bubble.textContent = '🫧';
      bubble.style.left = `${15 + Math.random() * 70}%`;
      bubble.style.bottom = `${20 + Math.random() * 40}px`;
      bubble.style.fontSize = `${24 + Math.random() * 16}px`;
      bubble.style.animationDuration = `${2.5 + Math.random() * 2}s`;

      bubble.onclick = (e) => {
        e.stopPropagation();
        if (audio) audio.soundBubble();
        bubble.classList.add('bubble-pop-burst');
        spawnDroplets(bubble);
        setTimeout(() => bubble.remove(), 180);
      };

      container.appendChild(bubble);
      setTimeout(() => { if (bubble.parentNode) bubble.remove(); }, 4800);
    }
  }

  function spawnDroplets(target) {
    const rect = target.getBoundingClientRect();
    for (let i = 0; i < 4; i++) {
      const drop = document.createElement('div');
      drop.className = 'water-drop-spray';
      drop.textContent = '💧';
      drop.style.left = `${rect.left + rect.width / 2 + (Math.random() * 20 - 10)}px`;
      drop.style.top = `${rect.top + (Math.random() * 20 - 10)}px`;
      document.body.appendChild(drop);
      setTimeout(() => drop.remove(), 600);
    }
  }

  function spawnShowerStreams(container) {
    for (let i = 0; i < 8; i++) {
      const stream = document.createElement('div');
      stream.className = 'water-stream-line';
      stream.style.left = `${35 + i * 4}%`;
      container.appendChild(stream);
      setTimeout(() => stream.remove(), 1200);
    }
  }

  function spawnSudsParticle(container, x, y) {
    const sud = document.createElement('div');
    sud.className = 'foam-sud-dot';
    sud.textContent = '🫧';
    sud.style.left = `${x - container.getBoundingClientRect().left}px`;
    sud.style.top = `${y - container.getBoundingClientRect().top}px`;
    container.appendChild(sud);
    setTimeout(() => sud.remove(), 3500);
  }

  function spawnFoodCrumbs(container, emoji) {
    for (let i = 0; i < 5; i++) {
      const c = document.createElement('div');
      c.className = 'food-crumb-particle';
      c.textContent = '✨';
      c.style.left = `${120 + (Math.random() * 40 - 20)}px`;
      c.style.top = `${120 + (Math.random() * 30 - 15)}px`;
      container.appendChild(c);
      setTimeout(() => c.remove(), 800);
    }
  }

  function spawnSparks(el) {
    for (let i = 0; i < 6; i++) {
      const s = document.createElement('div');
      s.className = 'egg-sparkle-dot';
      s.textContent = '✨';
      s.style.left = `${50 + (Math.random() * 60 - 30)}%`;
      s.style.top = `${50 + (Math.random() * 60 - 30)}%`;
      el.appendChild(s);
      setTimeout(() => s.remove(), 600);
    }
  }

  function spawnFloatingText(el, text, color = '#FF6584') {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const t = document.createElement('div');
    t.className = 'floating-score-badge';
    t.textContent = text;
    t.style.color = color;
    t.style.left = `${rect.left + rect.width / 2}px`;
    t.style.top = `${rect.top}px`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1200);
  }

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

  // 6. Retro Tamagotchi El Konsolu (1:1 Casing & LCD)
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
    setupRoomStage,
    isNightMode: () => isNightMode
  };
})();
