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
  console.log('--- FAZ 4: WIDGETABLE SOSYAL WIDGET PAKETİ TESTİ BAŞLIYOR ---');

  const ts = Date.now();
  // 1. İki kullanıcı oluştur ve eşleştir
  const u1 = await mockFetch('POST', '/api/auth/register', { username: `social_a_${ts}`, password: 'password123', name: 'Selin' });
  const u2 = await mockFetch('POST', '/api/auth/register', { username: `social_b_${ts}`, password: 'password123', name: 'Barış' });
  expect(u1.status === 200 && u2.status === 200, 'Selin ve Barış başarıyla oluşturuldu');

  const tokenA = u1.body.token;
  const tokenB = u2.body.token;

  const codeRes = await mockFetch('GET', '/api/pair/my-code', null, tokenA);
  const pairRes = await mockFetch('POST', '/api/pair/connect', { code: codeRes.body.pairCode, type: 'couple' }, tokenB);
  expect(pairRes.status === 200, 'Selin ve Barış eşleşti');

  // 2. Canlı Karalama Tuvali (Live Doodle Widget) Testi
  const fakePng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const doodlePost = await mockFetch('POST', '/api/widgets/doodle', {
    strokes: [{ color: '#FF6584', width: 4, points: [{ x: 10, y: 10 }, { x: 50, y: 50 }] }],
    previewDataUrl: fakePng
  }, tokenA);

  expect(doodlePost.status === 200 && doodlePost.body.ok, 'Selin aşk karalaması çizip gönderdi');
  expect(doodlePost.body.doodle.previewDataUrl === fakePng, 'Doodle çizim önizlemesi doğru kaydedildi');

  // Barış Doodle GET isteği yapar
  const doodleGet = await mockFetch('GET', '/api/widgets/doodle', null, tokenB);
  expect(doodleGet.status === 200 && doodleGet.body.doodle, 'Barış, Selin\'in çizdiği son aşk karalamasını aldı');
  expect(doodleGet.body.doodle.fromName === 'Selin', 'Çizimin Selin tarafından yapıldığı doğrulandı');

  // 3. Mesafe & Birlikteyiz (Together Mode) Testi
  const distRes = await mockFetch('POST', '/api/widgets/distance', {
    together: true,
    distanceKm: 0
  }, tokenA);

  expect(distRes.status === 200 && distRes.body.together === true, 'Birlikteyiz moduna geçildi (together: true)');
  expect(distRes.body.distanceKm === 0, 'Birlikteyken mesafe 0 km olarak güncellendi');

  // 4. Sleep VS 7 Günlük Düello & Altın Kupa Testi
  const sleepPost = await mockFetch('POST', '/api/widgets/sleep', {
    hours: 8.5,
    quality: 'Excellent',
    weekly: [8, 8.5, 9, 8, 8.5, 9, 8.5]
  }, tokenA);
  expect(sleepPost.status === 200 && sleepPost.body.ok, 'Selin 7 günlük uyku verilerini kaydetti');

  const sleepGet = await mockFetch('GET', '/api/widgets/sleep', null, tokenB);
  expect(sleepGet.status === 200, 'Barış uyku düellosu verilerini aldı');
  expect(sleepGet.body.days && sleepGet.body.days.length === 7, '7 günlük gün etiketleri mevcut');
  expect(sleepGet.body.winner === 'me' || sleepGet.body.winner === 'partner', 'Haftalık uyku galibi (Altın Kupa 🏆) hesaplandı');
  expect(sleepGet.body.advice && typeof sleepGet.body.advice === 'string', 'Şefkatli uyku tavsiyesi üretildi');

  // 5. Duygu Kavanozu (Mood Candy Jar & 2D Fizik Verisi) Testi
  const jarPost = await mockFetch('POST', '/api/widgets/jar/drop', {
    mood: 'love',
    color: '#FF6584',
    emoji: '💖'
  }, tokenA);

  expect(jarPost.status === 200 && jarPost.body.ok, 'Kavanoza duygu şekeri atıldı');
  expect(jarPost.body.candy && jarPost.body.candy.emoji === '💖', 'Atılan şeker objesi doğrulandı');

  const jarGet = await mockFetch('GET', '/api/widgets/jar', null, tokenB);
  expect(jarGet.status === 200 && jarGet.body.candies.length >= 1, 'Barış kavanozdaki duygu şekerlerini gördü');

  // 6. Dosya & Modül Doğrulamaları
  const jarPhysicsPath = path.join(__dirname, '../public/js/candy-jar-physics.js');
  expect(fs.existsSync(jarPhysicsPath), 'public/js/candy-jar-physics.js dosyası mevcut');
  const jarPhysicsCode = fs.readFileSync(jarPhysicsPath, 'utf8');
  expect(jarPhysicsCode.includes('CandyJarPhysics'), 'CandyJarPhysics 2D sınıfı tanımlı');
  expect(jarPhysicsCode.includes('dropCandy'), 'dropCandy fiziksel düşme fonksiyonu mevcut');
  expect(jarPhysicsCode.includes('jiggleJar'), 'jiggleJar sarsma fonksiyonu mevcut');

  const cssPath = path.join(__dirname, '../public/css/styles.css');
  const cssCode = fs.readFileSync(cssPath, 'utf8');
  expect(cssCode.includes('.candy-jar-canvas-box'), '2D Kavanoz canvas stilleri (.candy-jar-canvas-box) tanımlı');
  expect(cssCode.includes('.sleep-weekly-chart'), '7 Günlük Sleep VS çubuk grafik stilleri tanımlı');
  expect(cssCode.includes('.sleep-trophy-badge'), 'Altın Kupa rozet stilleri (.sleep-trophy-badge) tanımlı');
  expect(cssCode.includes('.widget-doodle'), 'Canlı Karalama Widget stilleri (.widget-doodle) tanımlı');
  expect(cssCode.includes('.together-glow-aura'), 'Birlikteyiz parıldama aura stilleri tanımlı');

  console.log('\n🎉 FAZ 4 TÜM TESTLERİ EKSİKSİZ BAŞARIYLA GEÇTİ!');
}

runTests().catch(err => {
  console.error('Test hatası:', err);
  process.exit(1);
});
