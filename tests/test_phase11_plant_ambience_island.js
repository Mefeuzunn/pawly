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
  console.log('--- WIDGETABLE AŞK BAHÇESİ, DİNAMİK ADA & LO-FI ORTAM TESTİ BAŞLIYOR ---');

  const ts = Date.now();
  // 1. Kullanıcı oluştur
  const u1 = await mockFetch('POST', '/api/auth/register', { username: `garden_user_${ts}`, password: 'password123', name: 'Ece' });
  expect(u1.status === 200, 'Ece kullanıcısı oluşturuldu');
  const token = u1.body.token;

  // 2. Çift Bahçesi (Plant Widget) GET Testi
  const plantGet = await mockFetch('GET', '/api/widgets/plant', null, token);
  expect(plantGet.status === 200, 'Ortak Çift Bahçesi GET başarılı');
  expect(plantGet.body.plant && plantGet.body.plant.info.name.includes('Gül'), 'Başlangıç bitkisi Aşk Gülü olarak tanımlı');
  expect(plantGet.body.plantTypes.length >= 4, 'En az 4 çiçek türü mevcut (Gül, Ayçiçeği, Lale, Sakura)');

  // 3. Bitki Sulama (Watering) Testi
  const water1 = await mockFetch('POST', '/api/widgets/plant/water', null, token);
  expect(water1.status === 200 && water1.body.ok, 'İlk sulama başarılı (+25 Büyüme)');
  expect(water1.body.plant.waterCount >= 1, 'Sulama sayacı arttı');

  // Çiçeği tam açtırana kadar sula (100 büyüme)
  await mockFetch('POST', '/api/widgets/plant/water', null, token);
  await mockFetch('POST', '/api/widgets/plant/water', null, token);
  const bloomWater = await mockFetch('POST', '/api/widgets/plant/water', null, token);

  expect(bloomWater.status === 200, 'Son sulama tamamlandı');
  expect(bloomWater.body.bloomed === true, 'Çiçek tam olgunlaşarak çiçek açtı (bloomed: true)');
  expect(bloomWater.body.plant.bloomedLetters.length >= 1, 'Sevgi buketi ve aşk mektubu üretildi');

  // 4. Lo-fi Ambience & Animalese Audio Modülü Doğrulaması
  const audioPath = path.join(__dirname, '../public/js/audio.js');
  const audioCode = fs.readFileSync(audioPath, 'utf8');
  expect(audioCode.includes('startAmbience'), 'Audio: startAmbience fonksiyonu tanımlı');
  expect(audioCode.includes('stopAmbience'), 'Audio: stopAmbience fonksiyonu tanımlı');
  expect(audioCode.includes('soundAnimalese'), 'Audio: soundAnimalese cıvıltı ses motoru tanımlı');

  // 5. Genişleyen Dinamik Ada (Interactive Dynamic Island) Doğrulaması
  const htmlPath = path.join(__dirname, '../public/index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  expect(html.includes('id="iphoneIsland"'), 'HTML: #iphoneIsland öğesi mevcut');
  expect(html.includes('id="islandCompactView"'), 'HTML: Kompakt ada görünümü (#islandCompactView) mevcut');
  expect(html.includes('id="islandExpandedView"'), 'HTML: Genişletilmiş Canlı Etkinlik görünümü (#islandExpandedView) mevcut');
  expect(html.includes('id="btnAmbienceToggle"'), 'HTML: Topbar Lo-fi Ortam sesi butonu (#btnAmbienceToggle) mevcut');
  expect(html.includes('id="ambienceModal"'), 'HTML: Ortam sesleri seçim modalı (#ambienceModal) mevcut');
  expect(html.includes('id="petDiaryModal"'), 'HTML: Canavar Büyüme Günlüğü modalı (#petDiaryModal) mevcut');

  // 6. CSS Doğrulamaları
  const cssPath = path.join(__dirname, '../public/css/styles.css');
  const css = fs.readFileSync(cssPath, 'utf8');
  expect(css.includes('.iphone-island.expanded'), 'CSS: .iphone-island.expanded dinamik ada geçiş stilleri tanımlı');
  expect(css.includes('.widget-plant'), 'CSS: .widget-plant çift bahçesi stilleri tanımlı');
  expect(css.includes('.diary-milestone-card'), 'CSS: .diary-milestone-card büyüme günlüğü kart stilleri tanımlı');

  console.log('\n🎉 TÜM AŞK BAHÇESİ, DİNAMİK ADA & LO-FI ORTAM TESTLERİ BAŞARIYLA GEÇTİ!');
}

runTests().catch(err => {
  console.error('Test hatası:', err);
  process.exit(1);
});