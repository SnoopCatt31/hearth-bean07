# Supabase Kurulumu — Adım Adım (Türkçe)

Bu, siparişlerin tüm cihazlar arasında **canlı senkronize** olmasını sağlayan kurulum. Yaklaşık 10 dakika, çoğunlukla kopyala-yapıştır.

---

## 1) Ücretsiz hesap ve proje aç

1. **supabase.com** adresine git → **"Start your project"** → GitHub ile giriş yap.
2. **"New project"** butonuna bas.
3. Şunları doldur:
   - **Name:** `hearth-bean` (ne istersen)
   - **Database Password:** güçlü bir şifre yaz ve **bir yere kaydet** (lazım olabilir).
   - **Region:** sana en yakın bölge (örn. **Frankfurt** veya **London** — Türkiye'ye yakın olur).
4. **"Create new project"** de. Kurulum 1-2 dakika sürer, beklemen yeterli.

---

## 2) Tabloları oluştur (tek tık)

1. Proje açılınca sol menüden **SQL Editor**'e gir → **"New query"**.
2. Sana verdiğim **`supabase-kurulum.sql`** dosyasını bir metin editöründe aç, içindeki her şeyi kopyala.
3. SQL Editor'deki boş kutuya yapıştır → sağ alttaki **"Run"** (veya Cmd/Ctrl+Enter) butonuna bas.
4. Altta "Success. No rows returned" gibi bir yazı görürsen tamamdır. ✅

> Hata alırsan ekran görüntüsü at, bakarız. En sık görülen: betiği iki kez çalıştırmak — sorun değil, "already exists" uyarısı zararsızdır.

---

## 3) Bağlantı anahtarlarını al

1. Sol menüde en altta **Settings** (dişli) → **API**.
2. İki şeye ihtiyacın var:
   - **Project URL** → `https://xxxxxxxx.supabase.co` gibi.
   - **Project API keys** altında **`anon` `public`** anahtarı → uzun bir metin (`eyJ...` ile başlar).
3. Bu ikisini kopyala, bir kenara not et.

---

## 4) Anahtarları koda yapıştır

`src/App.jsx` dosyasının başlarında şu iki satır var:

```js
const SUPABASE_URL = "BURAYA_PROJE_URL";
const SUPABASE_ANON_KEY = "BURAYA_ANON_KEY";
```

Bunları kendi değerlerinle değiştir:

```js
const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJ...senin-uzun-anahtarın...";
```

> Tırnak işaretlerini `"` silme, sadece içindeki `BURAYA_...` yazısını kendi değerinle değiştir.

---

## 5) GitHub'a yükle, Vercel otomatik yayınlasın

1. Güncellediğin `App.jsx`'i daha önce yaptığın gibi GitHub'daki `src/` klasörüne yükle (eskisinin üstüne yazar).
2. Vercel bağlı olduğu için **otomatik** yeni sürümü yayınlar (1 dakika).
3. Bitince test et:
   - İki ayrı cihaz/sekme aç: birinde müşteri (`?table=3`), birinde admin (`?staff`).
   - Müşteride sipariş ver → **admin ekranında kendiliğinden belirmeli**, yenilemeye gerek kalmadan. 🎉

---

## Anahtarlar gizli mi kalmalı?

`anon` anahtarı zaten tarayıcıda kullanılmak için tasarlanmıştır, herkese görünmesi normaldir — gizli (service_role) anahtarı **asla** koda koyma. Veriye kimin yazabileceğini "RLS politikaları" belirler; şu an demo için herkese açık. Gerçek güvenlik (sadece personel yazabilsin) istediğinde bunu birlikte sıkılaştırırız.

## Ücretsiz plan yeter mi?

Küçük-orta bir kafe için fazlasıyla yeter (50.000 aktif kullanıcı/ay, 500MB veritabanı, canlı bağlantı dahil). Kart bilgisi istemez.

## Eski demo verisi ne olacak?

Önemli değil — Supabase'e geçince veriler artık orada, kalıcı olarak tutulur. Admin panelinden menü/galeri/tema neyi değiştirirsen Supabase'e kaydolur ve tüm cihazlarda görünür.
