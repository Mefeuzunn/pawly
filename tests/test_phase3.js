const express = require('express');
const cors = require('cors');
const { Readable, Writable } = require('stream');
const fs = require('fs');
const path = require('path');

process.env.JWT_SECRET = 'test-secret-2026';

const { load, get, save } = require('../server/db');

// Uygulamayı başlat
const app = express();
app.use(cors());
app.use(express.json());

load();

app.use('/api/auth', require('../server/auth').router);
app.use('/api/widgets', require('../server/widgets'));
app.use('/api/pair', require('../server/pair'));

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

async function runPhase3Tests() {
  console.log('🚀 --- FAZ 3 UI/UX TASARIM SİSTEMİ & BENTO GRID TESTİ BAŞLADI ---');

  // 1. Kullanıcı Oluştur
  const reg = await mockFetch('POST', '/api/auth/register', {
    username: `bento_user_${Date.now()}`,
    name: 'Can',
    password: 'password123'
  });
  const token = reg.body.token;

  // 2. Bento Panosu Verisini Getir
  const widgetRes = await mockFetch('GET', '/api/widgets', null, token);
  assert(widgetRes.status === 200, 'Panoyu getirme başarılı (200)');
  assert(Array.isArray(widgetRes.body.widget.layout), 'Bento yerleşim listesi (layout) dönmeli');
  assert(Array.isArray(widgetRes.body.moods), 'Ruh halleri listesi dönmeli');

  // 3. Bento Yerleşimini Kaydet (Layout Reordering)
  const newLayout = ['streak', 'pet', 'todos', 'mood', 'note', 'countdown', 'stamps'];
  const layoutRes = await mockFetch('PUT', '/api/widgets/layout', { layout: newLayout }, token);
  assert(layoutRes.status === 200, 'Bento yerleşimi kaydedildi (200)');
  assert(layoutRes.body.layout[0] === 'streak', 'Yeni sıralama layout içinde güncellendi');

  // 4. Günlük Ruh Hali Kaydetme
  const moodRes = await mockFetch('POST', '/api/widgets/mood', { mood: '🥰' }, token);
  assert(moodRes.status === 200, 'Ruh hali kaydedildi (200)');
  assert(moodRes.body.mood === '🥰', 'Seçilen emoji doğru döndü');

  // 5. Hızlı Not Güncelleme
  const noteRes = await mockFetch('PUT', '/api/widgets/note', { note: 'Bento sticky note notu!' }, token);
  assert(noteRes.status === 200, 'Hızlı not güncellendi (200)');
  assert(noteRes.body.note === 'Bento sticky note notu!', 'Not içeriği doğrulandı');

  // 6. Görev Ekleme ve Tamamlama
  const todoAddRes = await mockFetch('POST', '/api/widgets/todos', { text: 'Canavara çilek al 🍓' }, token);
  assert(todoAddRes.status === 200, 'Görev eklendi (200)');
  assert(todoAddRes.body.todos.length > 0, 'Görev listesi dolu');
  const todoId = todoAddRes.body.todos[0].id;

  const todoToggleRes = await mockFetch('PUT', `/api/widgets/todos/${todoId}`, {}, token);
  assert(todoToggleRes.status === 200, 'Görev durumu güncellendi (200)');
  assert(todoToggleRes.body.todos.find(t => t.id === todoId).done === true, 'Görev tamamlandı (done: true)');

  // 7. Geri Sayım Ekleme
  const cdRes = await mockFetch('POST', '/api/widgets/countdowns', {
    title: 'Doğum Günü Partisi 🎂',
    date: '2026-11-15'
  }, token);
  assert(cdRes.status === 200, 'Geri sayım eklendi (200)');
  assert(cdRes.body.countdowns.length > 0, 'Geri sayım listesi dolu');

  // 8. Pasaport Damgası Basma
  const stampRes = await mockFetch('POST', '/api/widgets/stamps', { id: 'tokyo' }, token);
  assert(stampRes.status === 200, 'Pasaport damgası basıldı (200)');
  assert(stampRes.body.stamps.some(s => s.id === 'tokyo'), 'Tokyo damgası pasaporta eklendi');

  // 9. CSS Dosyası Tasarım Sistemi Kontrolü (Token Hierarchy & Typography)
  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'public', 'css', 'styles.css'), 'utf8');
  assert(cssContent.includes('--font-display: \'Fredoka\''), 'Fredoka Display font token tanımlı olmalı');
  assert(cssContent.includes('--font-body: \'Nunito\''), 'Nunito Body font token tanımlı olmalı');
  assert(cssContent.includes('--touch-min: 44px'), 'Erişilebilirlik için min touch target 44px kuralı tanımlı olmalı');
  assert(cssContent.includes('.bento-grid'), '.bento-grid sınıfı tanımlı olmalı');
  assert(cssContent.includes('--shadow-clay-card'), 'Claymorphic gölge token tanımlı olmalı');

  // 10. HTML Dosyası Bento Grid & Font Bağlantı Kontrolü
  const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  assert(htmlContent.includes('fonts.googleapis.com/css2?family=Fredoka'), 'Fredoka fontu Google Fonts üzerinden yüklenmeli');
  assert(htmlContent.includes('id="bentoGrid"'), 'Ana ekranda bentoGrid taşıyıcısı yer almalı');

  console.log('🎉 --- FAZ 3 TESTLERİNİN TÜMÜ EKSİKSİZ BAŞARIYLA GEÇTİ! ---');
}

runPhase3Tests().catch(err => {
  console.error('Test hatası:', err);
  process.exit(1);
});
