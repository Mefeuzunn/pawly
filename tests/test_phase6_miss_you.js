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
  console.log('--- FAZ 2: KAPSAMLI ÖZLEDİM (MISS YOU) TESTLERİ BAŞLIYOR ---');

  const ts = Date.now();
  // 1. İki kullanıcı oluştur
  const u1Res = await mockFetch('POST', '/api/auth/register', { username: `hearta_${ts}`, password: 'password123', name: 'Can' });
  const u2Res = await mockFetch('POST', '/api/auth/register', { username: `heartb_${ts}`, password: 'password123', name: 'Ece' });
  expect(u1Res.status === 200 && u1Res.body.token, 'Kullanıcı Can ve Ece başarıyla oluşturuldu');

  const tokenA = u1Res.body.token;
  const tokenB = u2Res.body.token;

  // 2. Eşleşme kodu ile birbirlerine bağlan
  const codeRes = await mockFetch('GET', '/api/pair/my-code', null, tokenA);
  expect(codeRes.body.pairCode, 'Can eşleşme kodu aldı: ' + codeRes.body.pairCode);

  const pairRes = await mockFetch('POST', '/api/pair/connect', { code: codeRes.body.pairCode, type: 'couple' }, tokenB);
  expect(pairRes.status === 200 && pairRes.body.ok, 'Ece, Can ile couple olarak eşleşti');

  // 3. Can -> Ece'ye Fısıltı Notu ve Kombo ile Özlem Gönder
  const missPostRes = await mockFetch('POST', '/api/widgets/miss-you', {
    combo: 5,
    note: 'Kokunu çok özledim 🌸',
    isBomb: false
  }, tokenA);

  expect(missPostRes.status === 200 && missPostRes.body.ok, 'Can özlem ve fısıltı notunu gönderdi');
  expect(missPostRes.body.entry.note === 'Kokunu çok özledim 🌸', 'Fısıltı notu doğru kaydedildi');
  expect(missPostRes.body.entry.combo === 5, '5x kombo değeri başarıyla iletildi');

  // 4. Can -> Ece'ye 50x Aşk Bombası Fırlat
  const bombRes = await mockFetch('POST', '/api/widgets/miss-you', {
    combo: 50,
    note: 'Kocaman Aşk Bombası! 💣',
    isBomb: true
  }, tokenA);

  expect(bombRes.status === 200 && bombRes.body.entry.isBomb === true, '50x Aşk Bombası başarıyla patlatıldı');

  // 5. Ece'nin Özlem Geçmişi & Saatlik Isı Haritasını Getir
  const histRes = await mockFetch('GET', '/api/widgets/miss-you/history', null, tokenB);
  expect(histRes.status === 200, 'Ece özlem geçmişini ve ısı haritasını aldı');
  expect(histRes.body.received >= 2, 'Ece Can\'dan en az 2 özlem aldı');
  expect(histRes.body.latestPartnerNote && histRes.body.latestPartnerNote.note.includes('Aşk Bombası'), 'Ece son partner fısıltı notunu gördü');

  const hour = new Date().getHours();
  expect(histRes.body.heatmap[hour] >= 2, `Saatlik ısı haritasında (${hour}:00) kayıtlar mevcut: ${histRes.body.heatmap[hour]}`);

  // 6. Çift Varlık Kalp Atışı (Realtime Dual Heart Sync)
  // Can ping atar
  const pingA = await mockFetch('POST', '/api/widgets/miss-you/heartbeat', null, tokenA);
  expect(pingA.status === 200, 'Can heartbeat attı');

  // Ece hemen ardından ping atar -> senkron olmalı!
  const pingB = await mockFetch('POST', '/api/widgets/miss-you/heartbeat', null, tokenB);
  expect(pingB.status === 200 && pingB.body.synced === true, '✨ Can ve Ece aynı anda aktif: Çift Kalp Senkronu (Heart Sync) başarıyla tetiklendi!');

  // 7. Dosya & Modül Doğrulamaları
  const missYou3DPath = path.join(__dirname, '../public/js/miss-you-3d.js');
  expect(fs.existsSync(missYou3DPath), 'public/js/miss-you-3d.js dosyası mevcut');
  const missYou3DContent = fs.readFileSync(missYou3DPath, 'utf8');
  expect(missYou3DContent.includes('MissYou3DScene'), 'MissYou3DScene sınıfı mevcut');
  expect(missYou3DContent.includes('triggerTapPulse'), '3D yay fiziği triggerTapPulse metodu mevcut');
  expect(missYou3DContent.includes('spawnBurstParticles'), '3D parçacık patlaması metodu mevcut');

  const audioPath = path.join(__dirname, '../public/js/audio.js');
  const audioContent = fs.readFileSync(audioPath, 'utf8');
  expect(audioContent.includes('soundHarpScale'), 'Pentatonik arp kombo sesi (soundHarpScale) tanımlı');
  expect(audioContent.includes('soundLoveBomb'), 'Aşk bombası sesi (soundLoveBomb) tanımlı');
  expect(audioContent.includes('vibrateHeartbeat'), 'Haptik titreşim motoru (vibrateHeartbeat) tanımlı');

  const cssPath = path.join(__dirname, '../public/css/styles.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  expect(cssContent.includes('.miss-you-heart-3d-wrap'), '3D kalp bento CSS kuralları tanımlı');
  expect(cssContent.includes('.love-rain-canvas'), 'Love Rain FX tam ekran canvas CSS kuralları tanımlı');
  expect(cssContent.includes('.miss-you-modal'), 'Özledim Hub modalı CSS kuralları tanımlı');

  console.log('\n🎉 FAZ 2 TÜM TESTLERİ BAŞARIYLA GEÇTİ!');
}

runTests().catch(err => {
  console.error('Test hatası:', err);
  process.exit(1);
});
