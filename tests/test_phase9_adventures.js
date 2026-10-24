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
  console.log('--- FAZ 5: MACERA & KEŞİF, POLAROID & SEYAHAT ALBÜMÜ TESTİ BAŞLIYOR ---');

  const ts = Date.now();
  // 1. Kullanıcı ve evcil hayvan oluştur
  const u1 = await mockFetch('POST', '/api/auth/register', { username: `adv_user_${ts}`, password: 'password123', name: 'Zeynep' });
  const u2 = await mockFetch('POST', '/api/auth/register', { username: `adv_partner_${ts}`, password: 'password123', name: 'Barış' });
  expect(u1.status === 200 && u2.status === 200, 'Zeynep ve Barış kullanıcıları oluşturuldu');
  const token = u1.body.token;
  const token2 = u2.body.token;

  // Yeni ortak yumurta oluştur (partnerli olduğu için henüz çatlamamış)
  const createPetRes = await mockFetch('POST', '/api/pets', { name: 'Mochi', species: 'cat', withUser: `adv_partner_${ts}` }, token);
  expect(createPetRes.status === 200, 'Mochi yumurtası oluşturuldu');
  const petId = createPetRes.body.pet.id;
  expect(createPetRes.body.pet.hatched === false, 'Ortak yumurtanın henüz çatlamadığı doğrulandı');

  // 2. Çatlamamış yumurta ile seyahat denemesi engellenmeli
  const unhatchedAdv = await mockFetch('POST', `/api/pets/${petId}/adventure/start`, { destinationId: 'paris' }, token);
  expect(unhatchedAdv.status === 400, 'Yumurta çatlamadan maceraya çıkılamayacağı doğrulandı');

  // Barış da dokunarak yumurtayı çatlatır
  const hatchRes = await mockFetch('POST', `/api/pets/${petId}/hatch`, null, token2);
  expect(hatchRes.status === 200 && hatchRes.body.pet.hatched, 'Barış dokununca Mochi yumurtadan çıktı 🐣');

  // 3. Destinasyon Listesi Testi
  const destsRes = await mockFetch('GET', `/api/pets/${petId}/adventure`, null, token);
  expect(destsRes.status === 200 && destsRes.body.destinations.length >= 5, 'En az 5 dünya destinasyonu listelendi (Tokyo, Paris, İstanbul, Antalya, NYC)');
  const parisDest = destsRes.body.destinations.find(d => d.id === 'paris');
  expect(parisDest && parisDest.item.includes('Kruvasan'), 'Paris destinasyonu ve hediyesi doğrulandı (Kruvasan)');

  // 4. Uyuyan pet ile seyahat engellenmeli
  await mockFetch('POST', `/api/pets/${petId}/sleep`, null, token);
  const sleepAdv = await mockFetch('POST', `/api/pets/${petId}/adventure/start`, { destinationId: 'paris' }, token);
  expect(sleepAdv.status === 400, 'Canavar uyurken seyahate çıkamayacağı doğrulandı');
  // Uyandır
  await mockFetch('POST', `/api/pets/${petId}/sleep`, null, token);

  // 5. Paris Macerasını Başlat
  const startAdvRes = await mockFetch('POST', `/api/pets/${petId}/adventure/start`, {
    destinationId: 'paris',
    testFast: true
  }, token);

  expect(startAdvRes.status === 200 && startAdvRes.body.ok, 'Paris macerası başarıyla başlatıldı 🎒');
  expect(startAdvRes.body.adventure.destination.id === 'paris', 'Aktif destinasyon Paris olarak kaydedildi');
  expect(startAdvRes.body.adventure.startedBy === `adv_user_${ts}`, 'Macerayı başlatan kullanıcı kaydedildi');

  // Tekrar macera başlatma denemesi (aktifken engellenmeli)
  const duplicateAdv = await mockFetch('POST', `/api/pets/${petId}/adventure/start`, { destinationId: 'tokyo' }, token);
  expect(duplicateAdv.status === 400, 'Canavar zaten seyahatteyken ikinci bir maceraya çıkamaz');

  // Henüz süre dolmadan claim denemesi engellenmeli (eğer süre > 0 ise)
  // Süreyi speedup ile bitir
  const speedupRes = await mockFetch('POST', `/api/pets/${petId}/adventure/speedup`, null, token);
  expect(speedupRes.status === 200 && speedupRes.body.ok, 'Seyahat hızlandırıldı (speedup)');

  // 6. Hatıra Polaroid'ini Al (Claim Souvenir)
  const initialXp = startAdvRes.body.pet.xp || 0;
  const claimRes = await mockFetch('POST', `/api/pets/${petId}/adventure/claim`, null, token);

  expect(claimRes.status === 200 && claimRes.body.ok, 'Hatıra Polaroid ve hediye başarıyla teslim alındı 📸');
  expect(claimRes.body.souvenir && claimRes.body.souvenir.stamp === 'paris', 'Polaroid damgası PARIS olarak üretildi');
  expect(claimRes.body.souvenir.item.includes('Kruvasan'), 'Polaroid hediye öğesi (Kruvasan) kaydedildi');
  expect(claimRes.body.pet.xp > initialXp, 'Macera tamamlama XP ödülü eklendi');
  expect(claimRes.body.pet.adventure === null, 'Aktif macera temizlendi');
  expect(claimRes.body.pet.souvenirs.length === 1, 'Mochi\'nin albümüne ilk hatıra eklendi');

  // 7. İkinci Seyahat: Tokyo'ya Gönder ve Claim Et
  await mockFetch('POST', `/api/pets/${petId}/adventure/start`, { destinationId: 'tokyo', testFast: true }, token);
  await mockFetch('POST', `/api/pets/${petId}/adventure/speedup`, null, token);
  const claimTokyo = await mockFetch('POST', `/api/pets/${petId}/adventure/claim`, null, token);

  expect(claimTokyo.status === 200 && claimTokyo.body.souvenir.stamp === 'tokyo', 'Tokyo Sakura hatırası alındı');
  expect(claimTokyo.body.pet.souvenirs.length === 2, 'Albümde 2 farklı hatıra fotoğrafı birikti');

  // 8. Pasaport ve Albüm Durumunu Sorgula
  const finalAlbumRes = await mockFetch('GET', `/api/pets/${petId}/adventure`, null, token);
  expect(finalAlbumRes.status === 200, 'Albüm ve pasaport verisi başarıyla alındı');
  expect(finalAlbumRes.body.souvenirs.length === 2, 'Albümde 2 polaroid listelendi');
  const stamps = finalAlbumRes.body.souvenirs.map(s => s.stamp);
  expect(stamps.includes('paris') && stamps.includes('tokyo'), 'Paris ve Tokyo pasaport damgaları kazanıldı');

  // 9. Arayüz ve Stil Dosyaları Doğrulamaları
  const htmlPath = path.join(__dirname, '../public/index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  expect(html.includes('id="adventureModal"'), 'HTML: #adventureModal mevcut');
  expect(html.includes('id="souvenirPolaroidModal"'), 'HTML: #souvenirPolaroidModal mevcut');
  expect(html.includes('id="travelAlbumModal"'), 'HTML: #travelAlbumModal mevcut');
  expect(html.includes('id="btnOpenAdventure"'), 'HTML: #btnOpenAdventure butonu mevcut');
  expect(html.includes('id="btnOpenTravelAlbum"'), 'HTML: #btnOpenTravelAlbum butonu mevcut');

  const cssPath = path.join(__dirname, '../public/css/styles.css');
  const css = fs.readFileSync(cssPath, 'utf8');
  expect(css.includes('.polaroid-card-frame'), 'CSS: .polaroid-card-frame Polaroid stili mevcut');
  expect(css.includes('.polaroid-landmark-stamp'), 'CSS: .polaroid-landmark-stamp damga stili mevcut');
  expect(css.includes('.passport-stamps-bar'), 'CSS: .passport-stamps-bar pasaport stili mevcut');
  expect(css.includes('.pet-adventure-banner'), 'CSS: .pet-adventure-banner oda banner stili mevcut');

  const audioPath = path.join(__dirname, '../public/js/audio.js');
  const audio = fs.readFileSync(audioPath, 'utf8');
  expect(audio.includes('soundCameraShutter'), 'Audio: soundCameraShutter deklanşör sesi mevcut');
  expect(audio.includes('soundDoorbell'), 'Audio: soundDoorbell kapı zili sesi mevcut');
  expect(audio.includes('soundAdventureStart'), 'Audio: soundAdventureStart fanfar sesi mevcut');

  const roomGamePath = path.join(__dirname, '../public/js/room-game.js');
  const roomGame = fs.readFileSync(roomGamePath, 'utf8');
  expect(roomGame.includes('petAdvBanner'), 'Room Game: petAdvBanner macera bannerı mevcut');
  expect(roomGame.includes('advTimerSpan'), 'Room Game: advTimerSpan canlı geri sayım sayacı mevcut');

  console.log('\n🎉 FAZ 5 TÜM TESTLERİ EKSİKSİZ BAŞARIYLA GEÇTİ!');
}

runTests().catch(err => {
  console.error('Test hatası:', err);
  process.exit(1);
});