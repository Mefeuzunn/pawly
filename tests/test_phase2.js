const express = require('express');
const cors = require('cors');
const { Readable, Writable } = require('stream');
const path = require('path');

process.env.JWT_SECRET = 'test-secret-2026';

const { load, get, save } = require('../server/db');

// Uygulamayı başlat
const app = express();
app.use(cors());
app.use(express.json());

load();

const eventsModule = require('../server/events');
app.use('/api/auth', require('../server/auth').router);
app.use('/api/events', eventsModule.router);
app.use('/api/pair', require('../server/pair'));
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

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ BAŞARISIZ: ${message}`);
    process.exit(1);
  }
  console.log(`✅ BAŞARILI: ${message}`);
}

async function runPhase2Tests() {
  console.log('🚀 --- FAZ 2 KAPSAMLI CANAVAR & GERÇEK ZAMANLI MOTOR TESTİ BAŞLADI ---');

  // 1. İki Kullanıcı Oluştur ve Eşleştir
  const uA = `parent_a_${Date.now()}`;
  const uB = `parent_b_${Date.now()}`;
  const regA = await mockFetch('POST', '/api/auth/register', { username: uA, name: 'Aslı', password: 'password123' });
  const regB = await mockFetch('POST', '/api/auth/register', { username: uB, name: 'Burak', password: 'password123' });
  const tokenA = regA.body.token;
  const tokenB = regB.body.token;

  // Eşleş
  const pairRes = await mockFetch('POST', '/api/pair/connect', { code: regA.body.user.pairCode, type: 'couple' }, tokenB);
  assert(pairRes.status === 200, 'Kullanıcılar başarıyla eşleşti');
  const relId = pairRes.body.relationship.id;

  // 2. Ortak Yumurta Oluştur (Co-Parenting Egg)
  const eggRes = await mockFetch('POST', '/api/pets', {
    name: 'Pofuduk',
    species: 'dino',
    relationshipId: relId
  }, tokenA);

  assert(eggRes.status === 200, 'Ortak canavar yumurtası oluşturuldu (200)');
  assert(eggRes.body.pet.hatched === false, 'Yumurta başlangıçta çatlamamış olmalı');
  assert(eggRes.body.pet.hatchProgress === 1, 'İlk sahip tıkladı, ilerleme 1/2 olmalı');
  assert(eggRes.body.pet.hatchNeeded === 2, '2 sahip de tıklamalı');
  const petId = eggRes.body.pet.id;

  // 3. İkinci Sahip Yumurtaya Tıklar ve Çatlatır
  const hatchRes = await mockFetch('POST', `/api/pets/${petId}/hatch`, {}, tokenB);
  assert(hatchRes.status === 200, 'İkinci sahip yumurtaya tıkladı (200)');
  assert(hatchRes.body.pet.hatched === true, 'İki sahip de tıkladığı için yumurta çatlamış olmalı');
  assert(hatchRes.body.pet.xp >= 20, 'Yumurta çatlayınca XP en az 20 olmalı');
  assert(hatchRes.body.pet.stageName === 'Yeni Doğan', 'Canavar evresi Yeni Doğan olmalı');

  // 4. Bakım Eylemi: Besleme (Feed)
  const initialFood = hatchRes.body.pet.stats.food;
  const feedRes = await mockFetch('POST', `/api/pets/${petId}/care`, { action: 'feed' }, tokenA);
  assert(feedRes.status === 200, 'Besleme eylemi başarılı oldu (200)');
  assert(feedRes.body.pet.stats.food > initialFood, 'Açlık değeri artmış olmalı');
  assert(feedRes.body.pet.logs.length > 0, 'Eylem loglara kaydedilmiş olmalı');
  assert(feedRes.body.pet.logs[0].actor.username === uA, 'Son eylemi Aslı yapmış olmalı');

  // 5. Cooldown Kontrolü (Hemen ardından tekrar besleme engellenmeli)
  const spamFeedRes = await mockFetch('POST', `/api/pets/${petId}/care`, { action: 'feed' }, tokenA);
  assert(spamFeedRes.status === 429, 'Cooldown bitmeden besleme 429 vermeli');

  // 6. Bakım Eylemi: Temizleme (Clean)
  const cleanRes = await mockFetch('POST', `/api/pets/${petId}/care`, { action: 'clean' }, tokenB);
  assert(cleanRes.status === 200, 'İkinci sahip temizleme yapabildi (200)');
  assert(cleanRes.body.pet.logs[0].actor.username === uB, 'Temizleme logunu Burak kaydetti');

  // 7. Anlık Sevme / Dürtme (Realtime Haptic Tap)
  const tapRes = await mockFetch('POST', `/api/pets/${petId}/tap`, {}, tokenA);
  assert(tapRes.status === 200, 'Anlık dokunma/sevme başarılı (200)');

  // 8. Uyku Modu ve Uykudayken Besleme Engeli
  const sleepRes = await mockFetch('POST', `/api/pets/${petId}/sleep`, {}, tokenB);
  assert(sleepRes.status === 200, 'Uyku moduna alındı (200)');
  assert(sleepRes.body.pet.sleeping === true, 'Canavar uyuyor olmalı');

  const sleepFeedRes = await mockFetch('POST', `/api/pets/${petId}/care`, { action: 'feed' }, tokenA);
  assert(sleepFeedRes.status === 400, 'Uykudayken mama verme engellenmeli (400)');

  // Uyandır
  const wakeRes = await mockFetch('POST', `/api/pets/${petId}/sleep`, {}, tokenA);
  assert(wakeRes.body.pet.sleeping === false, 'Canavar uyandırıldı');

  // 9. Canavar Detayı ve Geçmiş Logları
  const detailRes = await mockFetch('GET', `/api/pets/${petId}`, null, tokenA);
  assert(detailRes.status === 200, 'Canavar detayları çekilebilmeli');
  assert(detailRes.body.pet.logs.length >= 3, 'En az 3 eylem geçmişi loglanmış olmalı');
  assert(detailRes.body.pet.relationship.id === relId, 'İlişki ID doğru bağlanmış olmalı');

  // 10. Realtime Event Hub Testi
  let receivedEvent = null;
  const mockSseRes = {
    write(msg) {
      if (msg.includes('event: pet:action')) receivedEvent = msg;
    }
  };
  eventsModule.activeClients.set(uB, new Set([mockSseRes]));

  eventsModule.sendToPetOwners(detailRes.body.pet, 'pet:action', {
    petId,
    actor: { username: uA, name: 'Aslı' },
    action: 'pet',
    toast: 'Aslı canavarı sevdi 🤗'
  });

  assert(receivedEvent !== null, 'SSE üzerinden partnere pet:action olayı ulaştı');
  eventsModule.activeClients.delete(uB);

  console.log('🎉 --- FAZ 2 TESTLERİNİN TÜMÜ EKSİKSİZ BAŞARIYLA GEÇTİ! ---');
}

runPhase2Tests().catch(err => {
  console.error('Test hatası:', err);
  process.exit(1);
});
