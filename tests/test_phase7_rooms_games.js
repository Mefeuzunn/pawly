const { Readable, Writable } = require('stream');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

process.env.JWT_SECRET = 'test-secret-2026';
const { load, get, save } = require('../server/db');

const app = express();
app.use(cors());
app.use(express.json());
load();

app.use('/api/auth', require('../server/auth').router);
app.use('/api/pair', require('../server/pair'));
app.use('/api/friends', require('../server/friends'));
app.use('/api/widgets', require('../server/widgets'));
app.use('/api/pets', require('../server/pets'));

function mockFetch(method, url, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const req = new Readable({
      read() {
        if (bodyStr) this.push(bodyStr);
        this.push(null);
      }
    });

    req.method = method;
    req.url = url;
    req.headers = {
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(bodyStr),
      ...(token ? { 'authorization': `Bearer ${token}` } : {})
    };

    let statusCode = 200;
    const headers = {};
    let responseData = '';

    const res = new Writable({
      write(chunk, encoding, callback) {
        responseData += chunk.toString();
        callback();
      }
    });

    res.statusCode = 200;
    res.status = function(code) {
      statusCode = code;
      res.statusCode = code;
      return res;
    };
    res.setHeader = function(name, value) {
      headers[name.toLowerCase()] = value;
    };
    res.getHeader = function(name) {
      return headers[name.toLowerCase()];
    };

    res.json = function(jsonObj) {
      statusCode = res.statusCode || 200;
      resolve({ status: statusCode, body: jsonObj });
    };

    res.on('finish', () => {
      try {
        resolve({ status: statusCode, body: JSON.parse(responseData) });
      } catch {
        resolve({ status: statusCode, raw: responseData });
      }
    });

    res.on('error', reject);

    app.handle(req, res);
  });
}

function expect(cond, msg) {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${msg}`);
  }
}

async function runTests() {
  console.log('--- FAZ 3: İNTERAKTİF MİNİ-OYUNLAR & YAŞAYAN ODALAR TESTİ BAŞLIYOR ---');

  const ts = Date.now();
  // 1. İki kullanıcı oluştur ve eşleştir
  const u1 = await mockFetch('POST', '/api/auth/register', { username: `gamer_a_${ts}`, password: 'password123', name: 'Zeynep' });
  const u2 = await mockFetch('POST', '/api/auth/register', { username: `gamer_b_${ts}`, password: 'password123', name: 'Kerem' });
  expect(u1.status === 200 && u2.status === 200, 'Zeynep ve Kerem başarıyla oluşturuldu');

  const tokenA = u1.body.token;
  const tokenB = u2.body.token;

  const codeRes = await mockFetch('GET', '/api/pair/my-code', null, tokenA);
  const pairRes = await mockFetch('POST', '/api/pair/connect', { code: codeRes.body.pairCode, type: 'couple' }, tokenB);
  expect(pairRes.status === 200, 'Zeynep ve Kerem eşleşti');

  // 2. Ortak Yumurta Oluştur (Kuluçka Testi)
  const eggRes = await mockFetch('POST', '/api/pets', {
    name: 'Mochi 🐾',
    species: 'cat',
    withUser: `gamer_b_${ts}`
  }, tokenA);

  expect(eggRes.status === 200 && eggRes.body.pet, 'Mochi yumurtası oluşturuldu');
  const petId = eggRes.body.pet.id;
  expect(eggRes.body.pet.hatched === false, 'Yumurta başlangıçta çatlamamış durumda');
  expect(eggRes.body.pet.hatchProgress === 1, 'İlk sahip tıkladığı için ilerleme 1/2');

  // İkinci sahip dokunarak çatlatır
  const hatchRes = await mockFetch('POST', `/api/pets/${petId}/hatch`, null, tokenB);
  expect(hatchRes.status === 200 && hatchRes.body.pet.hatched === true, 'İkinci dokunuşla yumurta başarıyla çatladı ve bebek kedi Mochi doğdu! 🐣🎉');
  expect(hatchRes.body.pet.xp >= 20, 'Yumurta çatlama XP ödülü verildi (+20 XP)');

  // 3. Mutfak Mini-Oyunu: Besleme (Feed)
  // İlk açlık seviyesini al
  const initFood = hatchRes.body.pet.stats.food;
  const feedRes = await mockFetch('POST', `/api/pets/${petId}/care`, { action: 'feed' }, tokenA);
  expect(feedRes.status === 200, 'Mutfak: Çilek/Somon yedirme işlemi başarılı');
  expect(feedRes.body.pet.stats.food >= initFood, `Açlık değeri arttı: ${feedRes.body.pet.stats.food}%`);
  expect(feedRes.body.pet.logs[0].action === 'feed', 'Besleme eylemi günlüğe kaydedildi');

  // 4. Banyo Mini-Oyunu: Köpüklü Banyo (Clean)
  // Temizlik cooldown aşılmaması için zaman aşımı simülasyonu
  const db = get();
  const dbPet = db.pets.find(p => p.id === petId);
  dbPet.cooldowns = {}; // Test amaçlı sıfırla
  save();

  const cleanRes = await mockFetch('POST', `/api/pets/${petId}/care`, { action: 'clean' }, tokenB);
  expect(cleanRes.status === 200, 'Banyo: Süngerle ovalama ve duş başlığı ile durulama başarılı');
  expect(cleanRes.body.pet.stats.clean >= 75, `Temizlik değeri arttı: ${cleanRes.body.pet.stats.clean}%`);

  // 5. Salon Mini-Oyunu: Tenis Topu Fırlatma & Oynama (Play)
  dbPet.cooldowns = {};
  save();

  const playRes = await mockFetch('POST', `/api/pets/${petId}/care`, { action: 'play' }, tokenA);
  expect(playRes.status === 200, 'Salon: Tenis topu fırlatma ve yakalama oyunu başarılı');
  expect(playRes.body.pet.stats.happy >= 80, `Mutluluk değeri yükseldi: ${playRes.body.pet.stats.happy}%`);

  // 6. Yatak Odası Mini-Oyunu: Gece Lambası & Uyku Modu (Sleep)
  const sleepRes = await mockFetch('POST', `/api/pets/${petId}/sleep`, null, tokenA);
  expect(sleepRes.status === 200 && sleepRes.body.pet.sleeping === true, 'Yatak Odası: Başucu lambası söndürüldü, Mochi gece uykusuna geçti 🌙💤');

  const wakeRes = await mockFetch('POST', `/api/pets/${petId}/sleep`, null, tokenB);
  expect(wakeRes.status === 200 && wakeRes.body.pet.sleeping === false, 'Yatak Odası: Kerem lambayı açtı, Mochi esneyerek uyandı ☀️🐾');

  // 7. Kod ve Modül Doğrulamaları
  const roomGamePath = path.join(__dirname, '../public/js/room-game.js');
  expect(fs.existsSync(roomGamePath), 'public/js/room-game.js dosyası mevcut');
  const roomGameCode = fs.readFileSync(roomGamePath, 'utf8');
  expect(roomGameCode.includes('draggable-food-item'), 'Mutfak: Sürükle-bırak yemek sınıfı (draggable-food-item) mevcut');
  expect(roomGameCode.includes('scrubSponge'), 'Banyo: Sabun süngeri aracı (scrubSponge) mevcut');
  expect(roomGameCode.includes('spawnFloatingBubbles'), 'Banyo: Patlatılabilir köpük fonksiyonu mevcut');
  expect(roomGameCode.includes('tennisBall'), 'Salon: Fiziksel tenis topu (tennisBall) mevcut');
  expect(roomGameCode.includes('bedsideLamp'), 'Yatak Odası: Tıklanabilir başucu lambası (bedsideLamp) mevcut');
  expect(roomGameCode.includes('egg-crack-2'), 'Kuluçka: 3 aşamalı çatlama sınıfları mevcut');

  const pet3DPath = path.join(__dirname, '../public/js/pet-3d.js');
  const pet3DCode = fs.readFileSync(pet3DPath, 'utf8');
  expect(pet3DCode.includes('lookAtPoint'), '3D Maskot: Dinamik kafa imleç/yiyecek takip metodu (lookAtPoint) tanımlı');
  expect(pet3DCode.includes('triggerChew'), '3D Maskot: Çiğneme mimik animasyonu (triggerChew) tanımlı');

  const cssPath = path.join(__dirname, '../public/css/styles.css');
  const cssCode = fs.readFileSync(cssPath, 'utf8');
  expect(cssCode.includes('.pet-stats-hud'), 'Canlı İhtiyaç Göstergesi CSS kuralları (.pet-stats-hud) tanımlı');
  expect(cssCode.includes('.floating-drag-ghost'), 'Sürükleme hayaleti CSS kuralları (.floating-drag-ghost) tanımlı');
  expect(cssCode.includes('.game-bubble-particle'), 'Sabun köpüğü CSS kuralları tanımlı');

  console.log('\n🎉 FAZ 3 TÜM TESTLERİ EKSİKSİZ BAŞARIYLA GEÇTİ!');
}

runTests().catch(err => {
  console.error('Test hatası:', err);
  process.exit(1);
});
