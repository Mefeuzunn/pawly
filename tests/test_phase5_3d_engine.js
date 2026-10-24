const fs = require('fs');
const path = require('path');

function expect(cond, msg) {
  if (!cond) {
    console.error('❌ HATA:', msg);
    process.exit(1);
  }
  console.log('✅ BAŞARILI:', msg);
}

function runPhase5Tests() {
  console.log('🚀 --- FAZ 1 (3D MOTOR & ANİMASYON) TESTLERİ BAŞLADI ---');

  // 1. Three.js modül dosyası var mı ve boyutu geçerli mi?
  const threePath = path.join(__dirname, '..', 'public', 'js', 'three.module.js');
  expect(fs.existsSync(threePath), 'three.module.js mevcut');
  const threeStat = fs.statSync(threePath);
  expect(threeStat.size > 500000, `three.module.js boyutu geçerli (${(threeStat.size / 1024).toFixed(1)} KB)`);

  // 2. pet-3d.js motor dosyası var mı?
  const pet3DPath = path.join(__dirname, '..', 'public', 'js', 'pet-3d.js');
  expect(fs.existsSync(pet3DPath), 'pet-3d.js motor dosyası mevcut');
  const pet3DContent = fs.readFileSync(pet3DPath, 'utf8');
  expect(pet3DContent.includes('Pet3DScene'), 'Pet3DScene sınıfı tanımlı');
  expect(pet3DContent.includes('import * as THREE'), 'Three.js importu mevcut');
  expect(pet3DContent.includes('buildMascot'), 'buildMascot procedural modelleme metodu mevcut');
  expect(pet3DContent.includes('applyOutfits'), 'applyOutfits gardırop bağlama metodu mevcut');
  expect(pet3DContent.includes('animate'), 'animate 60 FPS render döngüsü mevcut');

  // 3. index.html içinde Three.js ve pet-3d.js script tagleri var mı?
  const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  expect(htmlContent.includes('/js/pet-3d.js'), 'index.html içinde pet-3d.js modülü dahil edilmiş');
  expect(htmlContent.includes('type="module"'), 'type="module" doğru tanımlanmış');
  expect(htmlContent.includes('btnSoundToggle'), 'Ses kontrol butonu mevcut');

  // 4. styles.css içinde .pet-3d-box tanımlı mı?
  const cssPath = path.join(__dirname, '..', 'public', 'css', 'styles.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  expect(cssContent.includes('.pet-3d-box'), '.pet-3d-box stili mevcut');

  console.log('🎉 --- FAZ 1 (3D MOTOR & ANİMASYON) TESTLERİNİN TÜMÜ EKSİKSİZ BAŞARIYLA GEÇTİ! ---');
}

runPhase5Tests();
