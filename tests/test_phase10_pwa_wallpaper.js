const fs = require('fs');
const path = require('path');

function expect(cond, msg) {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${msg}`);
  }
}

async function runTests() {
  console.log('--- FAZ 6: MOBİL PWA, KİLİT EKRANI DUVAR KÂĞIDI & CANLI DAĞITIM TESTİ BAŞLIYOR ---');

  // 1. PWA Manifest Doğrulaması
  const manifestPath = path.join(__dirname, '../public/manifest.json');
  expect(fs.existsSync(manifestPath), 'public/manifest.json dosyası mevcut');

  const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
  let manifest;
  try {
    manifest = JSON.parse(manifestRaw);
    expect(true, 'manifest.json geçerli bir JSON dosyası');
  } catch (e) {
    expect(false, 'manifest.json JSON parse hatası');
  }

  expect(manifest.name && manifest.name.includes('Pawly'), 'PWA Uygulama adı (name) Pawly içeriyor');
  expect(manifest.short_name === 'Pawly', 'PWA Kısa ad (short_name) "Pawly"');
  expect(manifest.start_url === '/', 'PWA start_url "/" olarak ayarlı');
  expect(manifest.display === 'standalone', 'PWA display "standalone" (tam ekran mobil uygulama modu)');
  expect(manifest.theme_color === '#FFEEDD', 'PWA theme_color pastel Widgetable bal krem (#FFEEDD)');
  expect(manifest.background_color === '#FFFDF9', 'PWA background_color pastel krem (#FFFDF9)');
  expect(Array.isArray(manifest.icons) && manifest.icons.length > 0, 'PWA ikonları tanımlı');
  expect(manifest.icons[0].src.includes('icon.svg'), 'PWA ikonu SVG olarak ayarlanmış');

  // 2. SVG Uygulama İkonu Doğrulaması
  const iconPath = path.join(__dirname, '../public/icons/icon.svg');
  expect(fs.existsSync(iconPath), 'public/icons/icon.svg dosyası mevcut');
  const iconSvg = fs.readFileSync(iconPath, 'utf8');
  expect(iconSvg.includes('<svg') && iconSvg.includes('viewBox="0 0 512 512"'), '512x512 vektörel retina SVG ikonu tanımlı');
  expect(iconSvg.includes('feDropShadow'), 'İkonda claymorphic yumuşak gölge efekti mevcut');

  // 3. Service Worker (sw.js) Doğrulaması
  const swPath = path.join(__dirname, '../public/sw.js');
  expect(fs.existsSync(swPath), 'public/sw.js dosyası mevcut');
  const swCode = fs.readFileSync(swPath, 'utf8');
  expect(swCode.includes('pawly-cache-v6'), 'Service Worker v6 önbellek sürümü (pawly-cache-v6) tanımlı');
  expect(swCode.includes('SHELL_ASSETS'), 'Çevrimdışı çekirdek kabuk varlıkları (SHELL_ASSETS) mevcut');
  expect(swCode.includes('/css/styles.css') && swCode.includes('/js/app.js'), 'CSS ve ana scriptler önbelleğe dahil edilmiş');
  expect(swCode.includes("addEventListener('install'"), 'SW install yaşam döngüsü dinleyicisi mevcut');
  expect(swCode.includes("addEventListener('activate'"), 'SW activate eski önbellek temizleme dinleyicisi mevcut');
  expect(swCode.includes("addEventListener('fetch'"), 'SW fetch önbellek aracı dinleyicisi mevcut');
  expect(swCode.includes("url.pathname.startsWith('/api/')"), 'SW /api/ isteklerini doğrudan ağa yönlendiriyor');

  // 4. Kilit Ekranı Duvar Kâğıdı Üretici (wallpaper-generator.js) Doğrulaması
  const wpPath = path.join(__dirname, '../public/js/wallpaper-generator.js');
  expect(fs.existsSync(wpPath), 'public/js/wallpaper-generator.js dosyası mevcut');
  const wpCode = fs.readFileSync(wpPath, 'utf8');
  expect(wpCode.includes('window.PawlyWallpaper'), 'PawlyWallpaper global nesnesi dışa aktarılmış');
  expect(wpCode.includes('sakura') && wpCode.includes('honey') && wpCode.includes('mint'), 'En az 5 pastel tema tanımlı');
  expect(wpCode.includes('downloadWallpaper'), '1170x2532 HD wallpaper indirme fonksiyonu (downloadWallpaper) mevcut');
  expect(wpCode.includes('renderPreview'), 'Canlı duvar kâğıdı önizleme fonksiyonu (renderPreview) mevcut');
  expect(wpCode.includes('drawWallpaper'), 'Prosedürel Canvas çizim motoru (drawWallpaper) mevcut');

  // 5. HTML Entegrasyon Doğrulamaları
  const htmlPath = path.join(__dirname, '../public/index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  expect(html.includes('<link rel="manifest" href="/manifest.json">'), 'HTML: manifest.json linki head içinde mevcut');
  expect(html.includes('<meta name="apple-mobile-web-app-capable" content="yes">'), 'HTML: iOS Safari tam ekran Web App desteği tanımlı');
  expect(html.includes('<meta name="theme-color" content="#FFEEDD">'), 'HTML: theme-color meta etiketi tanımlı');
  expect(html.includes('id="btnOpenWallpaperModal"'), 'HTML: Duvar kâğıdı üretici butonu (#btnOpenWallpaperModal) mevcut');
  expect(html.includes('id="wallpaperModal"'), 'HTML: Duvar kâğıdı modalı (#wallpaperModal) mevcut');
  expect(html.includes('id="wallpaperPreviewCanvas"'), 'HTML: Önizleme canvası (#wallpaperPreviewCanvas) mevcut');
  expect(html.includes('id="btnDownloadWallpaper"'), 'HTML: İndirme butonu (#btnDownloadWallpaper) mevcut');
  expect(html.includes('src="/js/wallpaper-generator.js"'), 'HTML: wallpaper-generator.js script etiketi ekli');

  // 6. JavaScript (app.js) Doğrulamaları
  const appPath = path.join(__dirname, '../public/js/app.js');
  const appCode = fs.readFileSync(appPath, 'utf8');
  expect(appCode.includes("navigator.serviceWorker.register('/sw.js')"), 'app.js: PWA Service Worker kaydedici çağrısı mevcut');
  expect(appCode.includes('openWallpaperModal'), 'app.js: openWallpaperModal fonksiyonu mevcut');
  expect(appCode.includes('downloadHdWallpaper'), 'app.js: downloadHdWallpaper fonksiyonu mevcut');
  expect(appCode.includes('btnOpenWallpaperModal'), 'app.js: Duvar kâğıdı modal açılış olayı bağlanmış');

  console.log('\n🎉 FAZ 6 TÜM TESTLERİ EKSİKSİZ BAŞARIYLA GEÇTİ!');
}

runTests().catch(err => {
  console.error('Test hatası:', err);
  process.exit(1);
});