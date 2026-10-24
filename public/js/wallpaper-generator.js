/* ==========================================================================
   Pawly / Widgetable HD Lockscreen Wallpaper Generator
   Retina 1170 x 2532 Resolution • Procedural Canvas Engine • Zero Dependencies
   ========================================================================== */

(function () {
  const THEMES = {
    sakura: {
      id: 'sakura',
      name: '🌸 Sakura Pembe',
      bgTop: '#FFF0F3',
      bgBottom: '#FFE3E8',
      accent: '#FF6584',
      badgeBg: 'rgba(255, 255, 255, 0.85)',
      badgeBorder: '#FFD4DF',
      textColor: '#4A3525',
      particles: '🌸'
    },
    honey: {
      id: 'honey',
      name: '🍯 Sıcak Bal Krem',
      bgTop: '#FFF9F0',
      bgBottom: '#FFEBD9',
      accent: '#FFA34E',
      badgeBg: 'rgba(255, 255, 255, 0.85)',
      badgeBorder: '#FFE0C2',
      textColor: '#4A3525',
      particles: '✨'
    },
    mint: {
      id: 'mint',
      name: '🌿 Taze Nane',
      bgTop: '#F0FDF8',
      bgBottom: '#D8F5EA',
      accent: '#38C793',
      badgeBg: 'rgba(255, 255, 255, 0.85)',
      badgeBorder: '#C8F3E6',
      textColor: '#2D3E35',
      particles: '🍀'
    },
    lavender: {
      id: 'lavender',
      name: '💜 Lavanta Rüya',
      bgTop: '#F6F4FE',
      bgBottom: '#E6E1FA',
      accent: '#8B5CF6',
      badgeBg: 'rgba(255, 255, 255, 0.85)',
      badgeBorder: '#DDD6FE',
      textColor: '#3A2E4C',
      particles: '🌙'
    },
    midnight: {
      id: 'midnight',
      name: '🌌 Gece Mavisi',
      bgTop: '#181829',
      bgBottom: '#282845',
      accent: '#FF7B90',
      badgeBg: 'rgba(40, 40, 65, 0.85)',
      badgeBorder: 'rgba(255, 255, 255, 0.15)',
      textColor: '#FFFFFF',
      particles: '⭐'
    }
  };

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function drawWallpaper(canvas, options = {}) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const scale = w / 1170; // Retina referans ölçeği

    const themeKey = options.theme || 'honey';
    const theme = THEMES[themeKey] || THEMES.honey;
    const petName = options.petName || 'Mochi';
    const partnerName = options.partnerName || 'Alex';
    const streakDays = options.streakDays || 7;
    const petSpecies = options.petSpecies || 'cat';

    // 1. Arka Plan Degrade (Vertical Gradient)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, theme.bgTop);
    bgGrad.addColorStop(1, theme.bgBottom);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Yüzen Arka Plan Parçacıkları (Floating Bokeh / Hearts)
    ctx.save();
    ctx.font = `${Math.round(28 * scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.35;
    const seedPoints = [
      { x: 0.15, y: 0.12 }, { x: 0.82, y: 0.15 },
      { x: 0.22, y: 0.32 }, { x: 0.78, y: 0.38 },
      { x: 0.12, y: 0.65 }, { x: 0.88, y: 0.72 },
      { x: 0.25, y: 0.88 }, { x: 0.75, y: 0.92 }
    ];
    seedPoints.forEach(pt => {
      ctx.fillText(theme.particles, pt.x * w, pt.y * h);
    });
    ctx.restore();

    // 3. Güvenli Saat Alanı Kılavuzu (Simulated Clock Safe Area)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = theme.textColor;
    ctx.globalAlpha = 0.55;
    ctx.font = `600 ${Math.round(36 * scale)}px 'Nunito', sans-serif`;
    ctx.fillText('Cumartesi, 24 Ekim', w / 2, 280 * scale);

    ctx.font = `800 ${Math.round(150 * scale)}px 'Fredoka', sans-serif`;
    ctx.globalAlpha = 0.85;
    ctx.fillText('09:41', w / 2, 440 * scale);
    ctx.restore();

    // 4. Maskot Zemin Gölgesi ve Pedestal (Clay Cloud Base)
    const mascotCenterY = 960 * scale;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.beginPath();
    ctx.ellipse(w / 2, mascotCenterY + 190 * scale, 220 * scale, 45 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5. Sevimli Kil Maskot Figürü Çizimi (Procedural Clay Pet)
    ctx.save();
    const cx = w / 2;
    const cy = mascotCenterY;
    const bodyR = 175 * scale;

    // Kulaklar
    const earOffset = 110 * scale;
    const earHeight = 100 * scale;
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(74, 53, 37, 0.12)';
    ctx.shadowBlur = 20 * scale;
    ctx.shadowOffsetY = 10 * scale;

    // Sol Kulak
    ctx.beginPath();
    ctx.moveTo(cx - earOffset - 50 * scale, cy - 80 * scale);
    ctx.lineTo(cx - earOffset, cy - 80 * scale - earHeight);
    ctx.lineTo(cx - earOffset + 50 * scale, cy - 100 * scale);
    ctx.closePath();
    ctx.fill();

    // Sağ Kulak
    ctx.beginPath();
    ctx.moveTo(cx + earOffset - 50 * scale, cy - 100 * scale);
    ctx.lineTo(cx + earOffset, cy - 80 * scale - earHeight);
    ctx.lineTo(cx + earOffset + 50 * scale, cy - 80 * scale);
    ctx.closePath();
    ctx.fill();

    // Kulak İçi Pembelik
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#FFCAD4';
    ctx.beginPath();
    ctx.moveTo(cx - earOffset - 25 * scale, cy - 75 * scale);
    ctx.lineTo(cx - earOffset, cy - 75 * scale - earHeight * 0.65);
    ctx.lineTo(cx - earOffset + 25 * scale, cy - 90 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + earOffset - 25 * scale, cy - 90 * scale);
    ctx.lineTo(cx + earOffset, cy - 75 * scale - earHeight * 0.65);
    ctx.lineTo(cx + earOffset + 25 * scale, cy - 75 * scale);
    ctx.closePath();
    ctx.fill();

    // Gövde (Kil Küresi)
    const bodyGrad = ctx.createRadialGradient(
      cx - 40 * scale, cy - 60 * scale, 20 * scale,
      cx, cy, bodyR
    );
    bodyGrad.addColorStop(0, '#FFFFFF');
    bodyGrad.addColorStop(0.7, '#FFFBF5');
    bodyGrad.addColorStop(1, '#FFE8D6');
    ctx.fillStyle = bodyGrad;
    ctx.shadowColor = 'rgba(74, 53, 37, 0.18)';
    ctx.shadowBlur = 28 * scale;
    ctx.shadowOffsetY = 16 * scale;

    ctx.beginPath();
    ctx.ellipse(cx, cy, bodyR, bodyR * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // Sevimli Gözler (Mutlu Kavis veya Parıltılı Yuvarlak)
    ctx.fillStyle = '#3D291D';
    const eyeSpacing = 68 * scale;
    const eyeY = cy - 10 * scale;

    ctx.beginPath();
    ctx.arc(cx - eyeSpacing, eyeY, 18 * scale, 0, Math.PI * 2);
    ctx.arc(cx + eyeSpacing, eyeY, 18 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Göz Pırıltısı
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx - eyeSpacing + 5 * scale, eyeY - 5 * scale, 6 * scale, 0, Math.PI * 2);
    ctx.arc(cx + eyeSpacing + 5 * scale, eyeY - 5 * scale, 6 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Yanak Allıkları
    ctx.fillStyle = 'rgba(255, 122, 162, 0.45)';
    ctx.beginPath();
    ctx.ellipse(cx - eyeSpacing - 35 * scale, eyeY + 30 * scale, 24 * scale, 14 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + eyeSpacing + 35 * scale, eyeY + 30 * scale, 24 * scale, 14 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sevimli Minik Burun ve Ağız
    ctx.fillStyle = '#FF8DA1';
    ctx.beginPath();
    ctx.ellipse(cx, eyeY + 18 * scale, 10 * scale, 7 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#3D291D';
    ctx.lineWidth = 5 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx - 12 * scale, eyeY + 28 * scale, 12 * scale, 0.2 * Math.PI, 0.9 * Math.PI);
    ctx.arc(cx + 12 * scale, eyeY + 28 * scale, 12 * scale, 0.1 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();

    // Pembe Fiyonk / Aksesuar
    ctx.fillStyle = '#FF6584';
    ctx.beginPath();
    ctx.ellipse(cx - 110 * scale, cy - 120 * scale, 28 * scale, 18 * scale, -0.3, 0, Math.PI * 2);
    ctx.ellipse(cx - 65 * scale, cy - 120 * scale, 28 * scale, 18 * scale, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFD166';
    ctx.beginPath();
    ctx.arc(cx - 88 * scale, cy - 120 * scale, 12 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 6. Frosted Glass Widgetable Çift Kartı (Lockscreen Widget Mockup)
    const cardW = 920 * scale;
    const cardH = 340 * scale;
    const cardX = (w - cardW) / 2;
    const cardY = 1420 * scale;
    const cardR = 48 * scale;

    ctx.save();
    // Kart Gövdesi (Cam Efekti)
    roundRect(ctx, cardX, cardY, cardW, cardH, cardR);
    ctx.fillStyle = theme.badgeBg;
    ctx.shadowColor = 'rgba(74, 53, 37, 0.12)';
    ctx.shadowBlur = 35 * scale;
    ctx.shadowOffsetY = 16 * scale;
    ctx.fill();

    // Kart Kenarlık
    ctx.strokeStyle = theme.badgeBorder;
    ctx.lineWidth = 3.5 * scale;
    ctx.stroke();
    ctx.shadowColor = 'transparent';

    // Kart Üst Başlık
    ctx.fillStyle = theme.accent;
    ctx.font = `800 ${Math.round(24 * scale)}px 'Nunito', sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('🐾 PAWLY • WIDGETABLE', cardX + 50 * scale, cardY + 70 * scale);

    // Kart Seri Rozeti
    roundRect(ctx, cardX + cardW - 240 * scale, cardY + 45 * scale, 190 * scale, 48 * scale, 24 * scale);
    ctx.fillStyle = '#FFEBD9';
    ctx.fill();
    ctx.fillStyle = '#D9480F';
    ctx.font = `800 ${Math.round(20 * scale)}px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`🔥 ${streakDays} Gün Seri`, cardX + cardW - 145 * scale, cardY + 76 * scale);

    // Çift Başlığı
    ctx.fillStyle = theme.textColor;
    ctx.font = `800 ${Math.round(44 * scale)}px 'Fredoka', sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`${petName} & ${partnerName}`, cardX + 50 * scale, cardY + 160 * scale);

    // Aşk & Mesafe Durumu
    ctx.fillStyle = theme.textColor;
    ctx.globalAlpha = 0.75;
    ctx.font = `600 ${Math.round(28 * scale)}px 'Nunito', sans-serif`;
    ctx.fillText('Aramızdaki Mesafe: 0 km • Kalpler Bir Arada 💕', cardX + 50 * scale, cardY + 220 * scale);
    ctx.fillText('Bugün 999x Özlem Gönderildi • Mutluluk: %100 ✨', cardX + 50 * scale, cardY + 270 * scale);
    ctx.restore();

    // 7. Alt Bilgi & İmzalar (Footer Branding)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `700 ${Math.round(24 * scale)}px 'Nunito', sans-serif`;
    ctx.fillStyle = theme.textColor;
    ctx.globalAlpha = 0.45;
    ctx.fillText('pawly-mu.vercel.app • official widgetable edition', w / 2, 2380 * scale);
    ctx.restore();
  }

  function downloadWallpaper(options = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = 1170;
    canvas.height = 2532;
    drawWallpaper(canvas, options);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pawly-lockscreen-${options.theme || 'honey'}.png`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(url);
      }, 500);
    }, 'image/png');
  }

  function renderPreview(canvas, options = {}) {
    if (!canvas) return;
    drawWallpaper(canvas, options);
  }

  window.PawlyWallpaper = {
    THEMES,
    drawWallpaper,
    renderPreview,
    downloadWallpaper
  };
})();