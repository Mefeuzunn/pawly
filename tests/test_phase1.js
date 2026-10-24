const express = require('express');
const cors = require('cors');
const { Readable, Writable } = require('stream');
const path = require('path');
const fs = require('fs');

process.env.JWT_SECRET = 'test-secret-2026';

const { load, get, save } = require('../server/db');

// Uygulamayı başlat
const app = express();
app.use(cors());
app.use(express.json());

load();

app.use('/api/auth', require('../server/auth').router);
app.use('/api/pair', require('../server/pair'));
app.use('/api/friends', require('../server/friends'));

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

async function runTests() {
  console.log('🚀 --- FAZ 1 KAPSAMLI TEST BAŞLADI ---');

  // 1. Kayıt Testi
  const userAName = `user_a_${Date.now()}`;
  const regRes = await mockFetch('POST', '/api/auth/register', {
    username: userAName,
    name: 'Alice',
    password: 'password123'
  });
  assert(regRes.status === 200, 'Kayıt başarılı olmalı (200)');
  assert(regRes.body.token, 'Token dönmeli');
  assert(regRes.body.user.pairCode && regRes.body.user.pairCode.length === 6, 'Kullanıcıya 6 haneli pairCode atanmalı');
  const tokenA = regRes.body.token;
  const userA = regRes.body.user;

  // 2. Misafir (Guest) Kullanıcı Testi
  const guestRes = await mockFetch('POST', '/api/auth/guest');
  assert(guestRes.status === 200, 'Misafir girişi başarılı olmalı (200)');
  assert(guestRes.body.user.isGuest === true, 'isGuest bayrağı true olmalı');
  assert(guestRes.body.user.pairCode && guestRes.body.user.pairCode.length === 6, 'Misafire de pairCode atanmalı');
  const tokenGuest = guestRes.body.token;

  // 3. Misafir Hesabı Gerçek Hesaba Dönüştürme
  const userBName = `user_b_${Date.now()}`;
  const convertRes = await mockFetch('POST', '/api/auth/convert-guest', {
    username: userBName,
    name: 'Bob',
    password: 'secretbob123'
  }, tokenGuest);
  assert(convertRes.status === 200, 'Misafir hesabı normale dönüştürülebilmeli (200)');
  assert(convertRes.body.user.isGuest === false, 'isGuest false olmalı');
  assert(convertRes.body.user.name === 'Bob', 'İsim güncellenmiş olmalı');
  const tokenB = convertRes.body.token;
  const userB = convertRes.body.user;

  // 4. Eşleşme Kodu Görüntüleme
  const codeRes = await mockFetch('GET', '/api/pair/my-code', null, tokenA);
  assert(codeRes.status === 200, 'Kendi eşleşme kodu alınabilmeli');
  assert(codeRes.body.pairCode === userA.pairCode, 'Kod eşleşmeli');
  assert(codeRes.body.shareText.includes(userA.pairCode), 'Paylaşım metni kodu içermeli');

  // 5. Eşleşme Kodu Önizleme
  const previewRes = await mockFetch('GET', `/api/pair/preview/${userA.pairCode}`, null, tokenB);
  assert(previewRes.status === 200, 'Kod önizleme çalışmalı');
  assert(previewRes.body.target.name === 'Alice', 'Hedef kullanıcı adı doğru görünmeli');

  // 6. Kendine Kod Girme Engeli
  const selfPairRes = await mockFetch('POST', '/api/pair/connect', { code: userA.pairCode }, tokenA);
  assert(selfPairRes.status === 400, 'Kendinle eşleşme engellenmeli (400)');

  // 7. Geçersiz Kod Engeli
  const badCodeRes = await mockFetch('POST', '/api/pair/connect', { code: 'INVALID' }, tokenB);
  assert(badCodeRes.status === 404, 'Geçersiz kod reddedilmeli (404)');

  // 8. Başarılı Eşleşme (Alice ve Bob 'couple' olarak eşleşiyor)
  const pairRes = await mockFetch('POST', '/api/pair/connect', {
    code: userA.pairCode,
    type: 'couple'
  }, tokenB);
  assert(pairRes.status === 200, 'Eşleşme başarılı olmalı (200)');
  assert(pairRes.body.relationship.type === 'couple', 'İlişki türü couple olmalı');
  assert(pairRes.body.relationship.partner.username === userA.username, 'Partner Alice olmalı');
  const relId = pairRes.body.relationship.id;

  // 9. Çift Eşleşme (Tekrar Eşleşme) Engeli
  const rePairRes = await mockFetch('POST', '/api/pair/connect', { code: userA.pairCode }, tokenB);
  assert(rePairRes.status === 400, 'Mevcut ilişki varken tekrar eşleşme engellenmeli');

  // 10. Eşleşmeleri Listeleme
  const listRes = await mockFetch('GET', '/api/pair/relationships', null, tokenA);
  assert(listRes.status === 200, 'Eşleşmeler listelenebilmeli');
  assert(listRes.body.relationships.length === 1, '1 adet ilişki listelenmeli');
  assert(listRes.body.relationships[0].partner.username === userB.username, 'Partner Bob olmalı');
  assert(listRes.body.relationships[0].streakDays === 1, 'Başlangıç serisi (streak) 1 olmalı');

  // 11. İlişki Tipini Güncelleme ('couple' -> 'best_friend')
  const updateRelRes = await mockFetch('PUT', `/api/pair/relationship/${relId}`, {
    type: 'best_friend'
  }, tokenA);
  assert(updateRelRes.status === 200, 'İlişki türü güncellenebilmeli (200)');
  assert(updateRelRes.body.relationship.type === 'best_friend', 'Yeni tür best_friend olmalı');

  // 12. Eşleşme Kodunu Yenileme
  const regenRes = await mockFetch('POST', '/api/pair/regenerate-code', null, tokenA);
  assert(regenRes.status === 200, 'Kod yenileme başarılı olmalı');
  assert(regenRes.body.pairCode !== userA.pairCode, 'Yeni kod eskiden farklı olmalı');

  // 13. İlişkiyi Sonlandırma
  const deleteRelRes = await mockFetch('DELETE', `/api/pair/relationship/${relId}`, null, tokenB);
  assert(deleteRelRes.status === 200, 'İlişki sonlandırılabilmeli');

  const finalListRes = await mockFetch('GET', '/api/pair/relationships', null, tokenA);
  assert(finalListRes.body.relationships.length === 0, 'Aktif ilişki kalmamalı');

  console.log('🎉 --- FAZ 1 TESTLERİNİN TÜMÜ EKSİKSİZ BAŞARIYLA GEÇTİ! ---');
}

runTests().catch(err => {
  console.error('Test hatası:', err);
  process.exit(1);
});
