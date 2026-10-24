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
  console.log('--- WIDGETABLE GÜNÜN ÇİFT SORUSU (DAILY Q&A) TESTİ BAŞLIYOR ---');

  const ts = Date.now();
  // 1. İki kullanıcı oluştur ve eşleştir
  const u1 = await mockFetch('POST', '/api/auth/register', { username: `qa_user_a_${ts}`, password: 'password123', name: 'Can' });
  const u2 = await mockFetch('POST', '/api/auth/register', { username: `qa_user_b_${ts}`, password: 'password123', name: 'Duygu' });
  expect(u1.status === 200 && u2.status === 200, 'Can ve Duygu kullanıcıları oluşturuldu');
  const tokenA = u1.body.token;
  const tokenB = u2.body.token;

  const codeRes = await mockFetch('GET', '/api/pair/my-code', null, tokenA);
  await mockFetch('POST', '/api/pair/connect', { code: codeRes.body.pairCode, type: 'couple' }, tokenB);

  // Ortak evcil hayvan oluştur
  const petRes = await mockFetch('POST', '/api/pets', { name: 'Pamuk', species: 'bunny', withUser: `qa_user_b_${ts}` }, tokenA);
  await mockFetch('POST', `/api/pets/${petRes.body.pet.id}/hatch`, null, tokenB);

  // 2. Günün Sorusunu Sorgula (GET)
  const qaInitial = await mockFetch('GET', '/api/widgets/daily-qa', null, tokenA);
  expect(qaInitial.status === 200, 'Günün sorusu GET başarılı');
  expect(qaInitial.body.question && typeof qaInitial.body.question === 'string', 'Günün sorusu metni mevcut');
  expect(qaInitial.body.revealed === false, 'Henüz cevaplar açılmamış (revealed: false)');

  // 3. Can İlk Cevabı Gönderir
  const canAns = await mockFetch('POST', '/api/widgets/daily-qa', {
    answer: 'Birlikte Tokyo kiraz çiçekleri altında yürümek! 🌸'
  }, tokenA);
  expect(canAns.status === 200 && canAns.body.ok, 'Can cevabını kaydetti');
  expect(canAns.body.myAnswer.includes('Tokyo'), 'Can\'ın cevabı doğru kaydedildi');
  expect(canAns.body.revealed === false, 'Duygu henüz cevaplamadığı için cevaplar hala kilitli');

  // 4. Duygu Durumu Sorgular (Maskeli Cevap Görünmeli)
  const duyguGet = await mockFetch('GET', '/api/widgets/daily-qa', null, tokenB);
  expect(duyguGet.status === 200, 'Duygu Q&A durumunu aldı');
  expect(duyguGet.body.partnerAnswer && duyguGet.body.partnerAnswer.answered === true, 'Can\'ın cevapladığı ama içeriğin gizli olduğu doğrulandı');
  expect(duyguGet.body.revealed === false, 'Cevaplar henüz açılmadı');

  // 5. Duygu Kendi Cevabını Gönderir (Kilit Açılmalı)
  const duyguAns = await mockFetch('POST', '/api/widgets/daily-qa', {
    answer: 'Tokyo ve tren yolculuğu! Kesinlikle! 🍣'
  }, tokenB);
  expect(duyguAns.status === 200 && duyguAns.body.ok, 'Duygu cevabını kaydetti');
  expect(duyguAns.body.revealed === true, 'İki taraf da cevapladığı için kilit açıldı (revealed: true) ✨');
  expect(duyguAns.body.partnerAnswer.includes('Tokyo kiraz çiçekleri'), 'Can\'ın cevabı Duygu\'ya açık olarak iletildi');

  // 6. Can Tekrar Sorguladığında da Açık Olmalı
  const canFinalGet = await mockFetch('GET', '/api/widgets/daily-qa', null, tokenA);
  expect(canFinalGet.status === 200 && canFinalGet.body.revealed === true, 'Can için de cevaplar açık');
  expect(canFinalGet.body.partnerAnswer.includes('tren yolculuğu'), 'Duygu\'nun cevabı Can\'a iletildi');

  // 7. Arayüz ve Stil Dosyası Doğrulamaları
  const cssPath = path.join(__dirname, '../public/css/styles.css');
  const css = fs.readFileSync(cssPath, 'utf8');
  expect(css.includes('.widget-qa'), 'CSS: .widget-qa sınıfı tanımlı');
  expect(css.includes('.qa-question-box'), 'CSS: .qa-question-box soru kutusu stilleri tanımlı');
  expect(css.includes('.qa-answers-revealed-grid'), 'CSS: .qa-answers-revealed-grid açılan cevap ızgarası stilleri tanımlı');

  console.log('\n🎉 GÜNÜN ÇİFT SORUSU (DAILY Q&A) TÜM TESTLERİ BAŞARIYLA GEÇTİ!');
}

runTests().catch(err => {
  console.error('Test hatası:', err);
  process.exit(1);
});