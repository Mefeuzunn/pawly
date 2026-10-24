const { Readable, Writable } = require('stream');
const express = require('express');
const cors = require('cors');

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
    console.error('❌ HATA:', msg);
    process.exit(1);
  }
  console.log('✅ BAŞARILI:', msg);
}

async function runPhase4Tests() {
  console.log('🚀 --- FAZ 4 WIDGETABLE ÖZEL SOSYAL WIDGET TESTLERİ BAŞLADI ---');

  const ts = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const u1Name = `test_u1_${ts}`;
  const u2Name = `test_u2_${ts}`;

  // 1. İki kullanıcı kaydet
  const r1 = await mockFetch('POST', '/api/auth/register', { username: u1Name, name: 'Selin 💕', password: 'password123' });
  const token1 = r1.body.token;
  const user1 = r1.body.user;

  const r2 = await mockFetch('POST', '/api/auth/register', { username: u2Name, name: 'Kaan 🌟', password: 'password123' });
  const token2 = r2.body.token;
  const user2 = r2.body.user;

  expect(token1 && token2, 'Kullanıcılar başarıyla oluşturuldu');

  // 2. Birbirleriyle eşleş
  const pairRes = await mockFetch('POST', '/api/pair/connect', { code: user1.pairCode, type: 'couple' }, token2);
  expect(pairRes.status === 200, 'Kullanıcılar başarıyla couple olarak eşleşti');

  // 3. MISS YOU WIDGET TESTİ
  const missPost = await mockFetch('POST', '/api/widgets/miss-you', {}, token1);
  expect(missPost.status === 200, 'Miss You POST başarılı (200)');
  expect(typeof missPost.body.count === 'number' && missPost.body.count >= 1, 'Özlem sayacı arttı');

  const missGet = await mockFetch('GET', '/api/widgets/miss-you', null, token2);
  expect(missGet.status === 200, 'Partner Miss You GET başarılı (200)');
  expect(missGet.body.received >= 1, 'Partner özlem bildirimini aldı');

  // 4. DISTANCE & TOGETHER TESTİ
  const distPost = await mockFetch('POST', '/api/widgets/distance', {
    location: { label: 'cafe', name: 'Kafede ☕' },
    distanceKm: 4.8,
    together: false
  }, token1);
  expect(distPost.status === 200, 'Distance POST başarılı');
  expect(distPost.body.distanceKm === 4.8, 'Mesafe 4.8 km kaydedildi');

  const togetherPost = await mockFetch('POST', '/api/widgets/distance', {
    together: true,
    distanceKm: 0
  }, token1);
  expect(togetherPost.body.together === true, 'Birlikteyiz (together: true) başarıyla aktifleştirildi');

  // 5. SLEEP TRACKER TESTİ (Me vs Partner)
  const sleepPost = await mockFetch('POST', '/api/widgets/sleep', {
    hours: 8.5,
    quality: 'Excellent'
  }, token1);
  expect(sleepPost.status === 200, 'Sleep POST başarılı');
  expect(sleepPost.body.sleep.hours === 8.5, 'Uyku süresi 8.5 saat olarak kaydedildi');

  const sleepGet = await mockFetch('GET', '/api/widgets/sleep', null, token2);
  expect(sleepGet.status === 200, 'Partner Sleep GET başarılı');
  expect(sleepGet.body.partner?.hours === 8.5, 'Partner uykusu senkronize edildi');

  // 6. MOOD CANDY JAR TESTİ
  const jarDrop = await mockFetch('POST', '/api/widgets/jar/drop', {
    mood: 'love',
    color: '#FF7B90',
    emoji: '💖'
  }, token1);
  expect(jarDrop.status === 200, 'Kavanoza şeker atma başarılı');
  expect(jarDrop.body.candies.some(c => c.emoji === '💖'), 'Şeker listesinde yeni şeker var');

  const jarGet = await mockFetch('GET', '/api/widgets/jar', null, token2);
  expect(jarGet.status === 200, 'Partner Jar GET başarılı');
  expect(jarGet.body.candies.length >= 1, 'Partner kavanozundaki şekerleri görebiliyor');

  // 7. STATUS BUBBLE TESTİ
  const statusPost = await mockFetch('POST', '/api/widgets/status', {
    status: 'Kahve Molası ☕',
    emoji: '☕',
    text: 'Bir kahve içip geliyorum canım!'
  }, token1);
  expect(statusPost.status === 200, 'Durum balonu güncellendi');
  expect(statusPost.body.statusBubble.status === 'Kahve Molası ☕', 'Durum başlığı doğru');

  // 8. DEMO PARTNER HIZLI BAĞLANTI TESTİ
  const demoUserRes = await mockFetch('POST', '/api/auth/guest', {});
  const demoToken = demoUserRes.body.token;

  const demoPairRes = await mockFetch('POST', '/api/pair/demo', {}, demoToken);
  expect(demoPairRes.status === 200, 'Demo partner bağlantısı başarılı');
  expect(demoPairRes.body.relationship.partner.name.includes('Alex'), 'Demo partner Alex olarak atandı');
  expect(demoPairRes.body.relationship.streakDays === 12, '12 günlük seri hazırlandı');
  expect(demoPairRes.body.pet && demoPairRes.body.pet.species === 'cat', 'Ortak kedi pet Ponçik oluşturuldu');

  console.log('🎉 --- FAZ 4 TESTLERİNİN TÜMÜ EKSİKSİZ BAŞARIYLA GEÇTİ! ---');
}

runPhase4Tests().catch(err => {
  console.error('Test hatası:', err);
  process.exit(1);
});
