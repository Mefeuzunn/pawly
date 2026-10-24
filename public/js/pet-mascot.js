/* ==========================================================================
   Pawly Procedural Animated Mascot Engine
   Rich SVG Mascot Characters • Blinking, Chewing & State Machines
   Replaces raw text emojis with genuine interactive game art
   ========================================================================== */

(function () {
  let blinkTimer = null;
  let isBlinking = false;

  // Göz kırpma döngüsü
  setInterval(() => {
    isBlinking = true;
    setTimeout(() => { isBlinking = false; }, 180);
  }, 3600);

  // SVG Maskot Üretici
  function renderMascotSVG(species = 'cat', state = 'idle', outfit = {}) {
    const { hat = '', clothes = '', accessory = '' } = outfit;

    // Renk Temaları
    const themes = {
      cat: { body: '#FFFBF5', bodyDark: '#F3E8DC', ear: '#FFAAA6', blush: '#FF8EA3', nose: '#FF6584' },
      shiba: { body: '#F6A857', bodyDark: '#D9822F', white: '#FFF9F2', blush: '#FF7B90', nose: '#2D1E14' },
      bear: { body: '#BA8050', bodyDark: '#996035', belly: '#FDE4C8', blush: '#FF8EA3', nose: '#3A2012' },
      penguin: { body: '#4A6FA5', bodyDark: '#36537D', belly: '#FFFFFF', beak: '#FF9F1C', blush: '#FF8EA3' },
      bunny: { body: '#FFF0F5', bodyDark: '#E8D3DC', ear: '#FFB7C5', blush: '#FF6584', nose: '#FF4A6F' },
      dino: { body: '#52B788', bodyDark: '#40916C', belly: '#D8F3DC', blush: '#FF7B90', nose: '#2D6A4F' }
    };

    const t = themes[species] || themes.cat;

    // Gözler
    let eyesSvg = '';
    if (state === 'sleeping') {
      eyesSvg = `
        <path d="M42 66 Q52 74 62 66" stroke="#2D1E14" stroke-width="3.5" stroke-linecap="round" fill="none"/>
        <path d="M78 66 Q88 74 98 66" stroke="#2D1E14" stroke-width="3.5" stroke-linecap="round" fill="none"/>
      `;
    } else if (state === 'happy') {
      eyesSvg = `
        <path d="M42 68 Q52 56 62 68" stroke="#2D1E14" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M78 68 Q88 56 98 68" stroke="#2D1E14" stroke-width="4" stroke-linecap="round" fill="none"/>
      `;
    } else if (state === 'hungry') {
      // Büyük ıslak anime gözleri
      eyesSvg = `
        <ellipse cx="52" cy="65" rx="9" ry="11" fill="#2D1E14"/>
        <circle cx="50" cy="61" r="4" fill="#FFFFFF"/>
        <circle cx="54" cy="68" r="2" fill="#FFFFFF"/>
        <ellipse cx="88" cy="65" rx="9" ry="11" fill="#2D1E14"/>
        <circle cx="86" cy="61" r="4" fill="#FFFFFF"/>
        <circle cx="90" cy="68" r="2" fill="#FFFFFF"/>
        <!-- Minik gözyaşı parıltısı -->
        <circle cx="43" cy="72" r="2.5" fill="#58C2ED"/>
      `;
    } else if (isBlinking) {
      eyesSvg = `
        <line x1="44" y1="65" x2="60" y2="65" stroke="#2D1E14" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="80" y1="65" x2="96" y2="65" stroke="#2D1E14" stroke-width="3.5" stroke-linecap="round"/>
      `;
    } else {
      // Normal parlak gözler
      eyesSvg = `
        <ellipse cx="52" cy="65" rx="7.5" ry="9" fill="#2D1E14"/>
        <circle cx="50" cy="62" r="3" fill="#FFFFFF"/>
        <ellipse cx="88" cy="65" rx="7.5" ry="9" fill="#2D1E14"/>
        <circle cx="86" cy="62" r="3" fill="#FFFFFF"/>
      `;
    }

    // Ağız
    let mouthSvg = '';
    if (state === 'eating') {
      mouthSvg = `
        <ellipse cx="70" cy="78" rx="8" ry="7" fill="#E63946"/>
        <path d="M64 78 Q70 82 76 78" fill="#FF85A1"/>
      `;
    } else if (state === 'happy') {
      mouthSvg = `
        <path d="M62 74 Q70 85 78 74" stroke="#2D1E14" stroke-width="3" stroke-linecap="round" fill="#FF85A1"/>
      `;
    } else if (state === 'hungry') {
      mouthSvg = `
        <path d="M64 78 Q70 72 76 78" stroke="#2D1E14" stroke-width="3" stroke-linecap="round" fill="none"/>
      `;
    } else {
      mouthSvg = `
        <path d="M64 74 Q70 79 76 74" stroke="#2D1E14" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      `;
    }

    // Tür Çizimi (Species Anatomy)
    let bodySvg = '';

    if (species === 'cat') {
      bodySvg = `
        <!-- Kedi Kuyruğu -->
        <path class="pet-tail-anim" d="M105 110 C130 110 135 85 125 75 C120 70 115 80 112 88" stroke="${t.bodyDark}" stroke-width="9" stroke-linecap="round" fill="none"/>
        <!-- Kulaklar -->
        <polygon points="32,46 50,15 62,45" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="3"/>
        <polygon points="38,42 50,22 58,42" fill="${t.ear}"/>
        <polygon points="108,46 90,15 78,45" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="3"/>
        <polygon points="102,42 90,22 82,42" fill="${t.ear}"/>
        <!-- Gövde -->
        <ellipse cx="70" cy="100" rx="38" ry="34" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="3.5"/>
        <!-- Kafa -->
        <ellipse cx="70" cy="65" rx="44" ry="38" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="3.5"/>
        <!-- Yanak Allıkları -->
        <circle cx="38" cy="72" r="7" fill="${t.blush}" opacity="0.6"/>
        <circle cx="102" cy="72" r="7" fill="${t.blush}" opacity="0.6"/>
        <!-- Burun -->
        <polygon points="67,70 73,70 70,74" fill="${t.nose}"/>
        <!-- Bıyıklar -->
        <line x1="28" y1="68" x2="16" y2="66" stroke="#2D1E14" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="28" y1="73" x2="14" y2="76" stroke="#2D1E14" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="112" y1="68" x2="124" y2="66" stroke="#2D1E14" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="112" y1="73" x2="126" y2="76" stroke="#2D1E14" stroke-width="1.8" stroke-linecap="round"/>
        <!-- Patiler -->
        <ellipse cx="50" cy="126" rx="10" ry="7" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="2.5"/>
        <ellipse cx="90" cy="126" rx="10" ry="7" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="2.5"/>
      `;
    } else if (species === 'shiba') {
      bodySvg = `
        <!-- Shiba Kıvrık Kuyruğu -->
        <path class="pet-tail-anim" d="M102 105 C125 105 130 75 115 72 C105 70 102 85 108 95" stroke="${t.body}" stroke-width="12" stroke-linecap="round" fill="none"/>
        <!-- Kulaklar -->
        <polygon points="34,44 48,16 64,42" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="3.5"/>
        <polygon points="40,40 50,24 60,40" fill="#FFF"/>
        <polygon points="106,44 92,16 76,42" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="3.5"/>
        <polygon points="100,40 90,24 80,40" fill="#FFF"/>
        <!-- Gövde -->
        <ellipse cx="70" cy="100" rx="38" ry="34" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="3.5"/>
        <ellipse cx="70" cy="102" rx="24" ry="22" fill="${t.white}"/>
        <!-- Kafa -->
        <ellipse cx="70" cy="65" rx="44" ry="38" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="3.5"/>
        <!-- Beyaz Yanaklar (Shiba Urajiro) -->
        <ellipse cx="46" cy="74" rx="16" ry="12" fill="${t.white}"/>
        <ellipse cx="94" cy="74" rx="16" ry="12" fill="${t.white}"/>
        <ellipse cx="70" cy="74" rx="14" ry="10" fill="${t.white}"/>
        <!-- Kaş Noktaları -->
        <circle cx="50" cy="50" r="4" fill="${t.white}"/>
        <circle cx="90" cy="50" r="4" fill="${t.white}"/>
        <!-- Yanak Allıkları -->
        <circle cx="38" cy="72" r="6" fill="${t.blush}" opacity="0.6"/>
        <circle cx="102" cy="72" r="6" fill="${t.blush}" opacity="0.6"/>
        <!-- Burun -->
        <ellipse cx="70" cy="69" rx="5" ry="4" fill="${t.nose}"/>
        <!-- Patiler -->
        <ellipse cx="50" cy="126" rx="10" ry="7" fill="${t.white}" stroke="${t.bodyDark}" stroke-width="2.5"/>
        <ellipse cx="90" cy="126" rx="10" ry="7" fill="${t.white}" stroke="${t.bodyDark}" stroke-width="2.5"/>
      `;
    } else if (species === 'bear') {
      bodySvg = `
        <!-- Yuvarlak Kulaklar -->
        <circle cx="36" cy="35" r="16" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="3.5"/>
        <circle cx="36" cy="35" r="9" fill="${t.belly}"/>
        <circle cx="104" cy="35" r="16" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="3.5"/>
        <circle cx="104" cy="35" r="9" fill="${t.belly}"/>
        <!-- Gövde -->
        <ellipse cx="70" cy="102" rx="42" ry="36" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="3.5"/>
        <ellipse cx="70" cy="104" rx="26" ry="24" fill="${t.belly}"/>
        <!-- Kafa -->
        <ellipse cx="70" cy="66" rx="45" ry="38" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="3.5"/>
        <!-- Ağız/Burun Bölgesi -->
        <ellipse cx="70" cy="73" rx="18" ry="13" fill="${t.belly}"/>
        <ellipse cx="70" cy="68" rx="6" ry="4.5" fill="${t.nose}"/>
        <!-- Yanak Allıkları -->
        <circle cx="40" cy="73" r="6" fill="${t.blush}" opacity="0.6"/>
        <circle cx="100" cy="73" r="6" fill="${t.blush}" opacity="0.6"/>
        <!-- Patiler -->
        <ellipse cx="48" cy="128" rx="11" ry="8" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="2.5"/>
        <ellipse cx="92" cy="128" rx="11" ry="8" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="2.5"/>
      `;
    } else if (species === 'penguin') {
      bodySvg = `
        <!-- Kanatlar -->
        <path class="pet-tail-anim" d="M26 80 Q14 95 24 110 Q32 98 34 85" fill="${t.bodyDark}"/>
        <path class="pet-tail-anim" d="M114 80 Q126 95 116 110 Q108 98 106 85" fill="${t.bodyDark}"/>
        <!-- Gövde -->
        <ellipse cx="70" cy="85" rx="44" ry="48" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="3.5"/>
        <!-- Beyaz Karın -->
        <ellipse cx="70" cy="90" rx="30" ry="36" fill="#FFFFFF"/>
        <!-- Gaga -->
        <polygon points="63,68 77,68 70,77" fill="${t.beak}" stroke="#E07A00" stroke-width="1.5"/>
        <!-- Yanak Allıkları -->
        <circle cx="40" cy="71" r="6" fill="${t.blush}" opacity="0.6"/>
        <circle cx="100" cy="71" r="6" fill="${t.blush}" opacity="0.6"/>
        <!-- Turuncu Perdeli Ayaklar -->
        <ellipse cx="50" cy="130" rx="13" ry="6" fill="${t.beak}"/>
        <ellipse cx="90" cy="130" rx="13" ry="6" fill="${t.beak}"/>
      `;
    } else { // bunny / default
      bodySvg = `
        <!-- Tavşan Uzun Kulakları -->
        <ellipse cx="48" cy="20" rx="10" ry="26" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="3" transform="rotate(-10 48 20)"/>
        <ellipse cx="48" cy="20" rx="5" ry="19" fill="${t.ear}" transform="rotate(-10 48 20)"/>
        <ellipse cx="92" cy="20" rx="10" ry="26" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="3" transform="rotate(10 92 20)"/>
        <ellipse cx="92" cy="20" rx="5" ry="19" fill="${t.ear}" transform="rotate(10 92 20)"/>
        <!-- Gövde -->
        <ellipse cx="70" cy="100" rx="38" ry="34" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="3.5"/>
        <!-- Kafa -->
        <ellipse cx="70" cy="65" rx="44" ry="38" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="3.5"/>
        <circle cx="38" cy="72" r="7" fill="${t.blush}" opacity="0.6"/>
        <circle cx="102" cy="72" r="7" fill="${t.blush}" opacity="0.6"/>
        <polygon points="67,71 73,71 70,75" fill="${t.nose}"/>
        <ellipse cx="50" cy="126" rx="10" ry="7" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="2.5"/>
        <ellipse cx="90" cy="126" rx="10" ry="7" fill="${t.body}" stroke="${t.bodyDark}" stroke-width="2.5"/>
      `;
    }

    // Kıyafetler (Clothes SVG Layers)
    let clothesSvg = '';
    if (clothes === 'dress' || clothes === '👗') {
      // Pembe fırfırlı victoria elbisesi
      clothesSvg = `
        <!-- Pembe Elbise -->
        <path d="M46 92 Q70 86 94 92 L106 126 Q70 132 34 126 Z" fill="#FF85A1" stroke="#E65173" stroke-width="2.5"/>
        <!-- Beyaz Dantel Yaka -->
        <path d="M52 90 Q70 102 88 90" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" fill="none"/>
        <circle cx="70" cy="104" r="3" fill="#FFFFFF"/>
        <circle cx="70" cy="114" r="3" fill="#FFFFFF"/>
        <!-- Alt Fırfır -->
        <path d="M34 126 Q43 130 52 126 Q61 130 70 126 Q79 130 88 126 Q97 130 106 126" stroke="#FFFFFF" stroke-width="3.5" fill="none"/>
      `;
    } else if (clothes === 'striped' || clothes === '👕') {
      // Mavi-beyaz breton tişört
      clothesSvg = `
        <clipPath id="shirtClip">
          <path d="M46 90 Q70 86 94 90 L102 124 Q70 128 38 124 Z"/>
        </clipPath>
        <g clip-path="url(#shirtClip)">
          <rect x="30" y="85" width="80" height="45" fill="#FFFFFF"/>
          <line x1="30" y1="94" x2="110" y2="94" stroke="#2B6CB0" stroke-width="4"/>
          <line x1="30" y1="104" x2="110" y2="104" stroke="#2B6CB0" stroke-width="4"/>
          <line x1="30" y1="114" x2="110" y2="114" stroke="#2B6CB0" stroke-width="4"/>
          <line x1="30" y1="124" x2="110" y2="124" stroke="#2B6CB0" stroke-width="4"/>
        </g>
        <path d="M46 90 Q70 86 94 90 L102 124 Q70 128 38 124 Z" fill="none" stroke="#2B6CB0" stroke-width="2.5"/>
      `;
    } else if (clothes === 'tracksuit' || clothes === '🧥') {
      // Nane yeşili spor eşofman
      clothesSvg = `
        <path d="M44 90 Q70 86 96 90 L104 125 Q70 128 36 125 Z" fill="#48CFAD" stroke="#2EB080" stroke-width="2.5"/>
        <line x1="70" y1="88" x2="70" y2="125" stroke="#FFFFFF" stroke-width="3"/>
        <circle cx="70" cy="98" r="3.5" fill="#FFC436"/>
      `;
    }

    // Şapkalar (Hats SVG Layers)
    let hatSvg = '';
    if (hat === 'safari' || hat === '👒') {
      hatSvg = `
        <!-- Safari Bucket Hat (Screenshot 2 Ayı şapkası) -->
        <ellipse cx="70" cy="36" rx="42" ry="12" fill="#D4B07B" stroke="#A8824D" stroke-width="2.5"/>
        <path d="M42 36 L48 14 Q70 10 92 14 L98 36 Z" fill="#E8C99B" stroke="#A8824D" stroke-width="2.5"/>
        <path d="M44 32 Q70 28 96 32" stroke="#4A6B32" stroke-width="4" fill="none"/>
      `;
    } else if (hat === 'cap' || hat === '🧢') {
      hatSvg = `
        <!-- Yeşil Kep -->
        <path d="M38 34 Q70 8 102 34 Z" fill="#38C793" stroke="#249E72" stroke-width="2.5"/>
        <ellipse cx="70" cy="34" rx="34" ry="7" fill="#249E72"/>
        <ellipse cx="88" cy="35" rx="22" ry="5" fill="#38C793" stroke="#249E72" stroke-width="2"/>
      `;
    } else if (hat === 'bow' || hat === '🎀') {
      hatSvg = `
        <!-- Pembe Fiyonk -->
        <polygon points="70,30 52,18 54,42" fill="#FF6584" stroke="#E63946" stroke-width="2"/>
        <polygon points="70,30 88,18 86,42" fill="#FF6584" stroke="#E63946" stroke-width="2"/>
        <circle cx="70" cy="30" r="5" fill="#FFD166"/>
      `;
    } else if (hat === 'nightcap' || state === 'sleeping') {
      hatSvg = `
        <!-- Uyku Başlığı -->
        <path d="M40 38 Q70 10 100 38 Q118 20 120 40 Q105 45 92 40" fill="#9D7BFF" stroke="#7A56E0" stroke-width="2.5"/>
        <circle cx="120" cy="40" r="6" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
      `;
    }

    // Elde Tutulan Aksesuar (Held Items)
    let itemSvg = '';
    if (accessory === 'icecream' || hat === 'safari') {
      // Çift toplu dondurma külahı
      itemSvg = `
        <g transform="translate(100, 88)">
          <polygon points="8,16 16,36 24,16" fill="#D4A373" stroke="#9C6644" stroke-width="1.5"/>
          <circle cx="16" cy="14" r="8" fill="#48CFAD"/>
          <circle cx="16" cy="4" r="7" fill="#FF85A1"/>
          <circle cx="16" cy="-2" r="3" fill="#E63946"/>
        </g>
      `;
    } else if (accessory === 'strawberry' || state === 'eating') {
      itemSvg = `
        <g transform="translate(62, 85)">
          <path d="M8 6 C8 0 20 0 20 6 C20 16 8 20 8 20 C8 20 -4 16 -4 6 C-4 0 8 0 8 6 Z" fill="#E63946" transform="scale(0.8)"/>
          <circle cx="6" cy="5" r="1" fill="#FFF"/>
          <circle cx="10" cy="8" r="1" fill="#FFF"/>
          <polygon points="5,2 7,-2 9,2 11,-2 13,2" fill="#38C793"/>
        </g>
      `;
    }

    return `
      <svg class="pet-mascot-svg ${state === 'sleeping' ? 'mascot-sleep' : 'mascot-breath'}" viewBox="0 0 140 145" width="140" height="145">
        <defs>
          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#A07855" flood-opacity="0.18"/>
          </filter>
        </defs>
        <g filter="url(#softShadow)">
          ${bodySvg}
          ${clothesSvg}
          ${eyesSvg}
          ${mouthSvg}
          ${hatSvg}
          ${itemSvg}
        </g>
      </svg>
    `;
  }

  // Çatlamamış Yumurta SVG
  function renderEggSVG(taps = 0, totalNeeded = 2) {
    const crackRatio = taps / Math.max(totalNeeded, 1);
    let cracksSvg = '';

    if (crackRatio >= 0.5) {
      cracksSvg = `
        <path d="M68 45 L74 55 L65 62 L75 70 L68 82" stroke="#5C4033" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M74 55 L82 58" stroke="#5C4033" stroke-width="2" fill="none"/>
      `;
    }
    if (crackRatio >= 0.8) {
      cracksSvg += `
        <path d="M50 70 L58 75 L52 85" stroke="#5C4033" stroke-width="2" fill="none"/>
      `;
    }

    return `
      <svg class="pet-egg-svg" viewBox="0 0 140 150" width="140" height="150">
        <!-- Kadife Yuva Yastığı -->
        <ellipse cx="70" cy="130" rx="46" ry="14" fill="#FFD4DF" stroke="#FFAAA6" stroke-width="3"/>
        <ellipse cx="70" cy="128" rx="36" ry="9" fill="#FFF0F5"/>
        
        <!-- Yumurta Gövdesi -->
        <g class="egg-wobble">
          <path d="M70 20 C40 20 28 65 28 95 C28 122 46 132 70 132 C94 132 112 122 112 95 C112 65 100 20 70 20 Z" 
                fill="#FFF9E6" stroke="#EAD49B" stroke-width="3.5"/>
          <!-- Pastel Benekler -->
          <circle cx="50" cy="65" r="7" fill="#FFCAD4" opacity="0.8"/>
          <circle cx="85" cy="55" r="8.5" fill="#BEE1E6" opacity="0.8"/>
          <circle cx="78" cy="95" r="6" fill="#FDE2E4" opacity="0.8"/>
          <circle cx="48" cy="105" r="7.5" fill="#C5DEDD" opacity="0.8"/>
          <circle cx="88" cy="80" r="5" fill="#DFCCF1" opacity="0.8"/>
          ${cracksSvg}
        </g>
      </svg>
    `;
  }

  window.PawlyMascot = {
    renderMascotSVG,
    renderEggSVG
  };
})();
