# Hearth & Bean — Test ve Yayına Alma Rehberi

## 1) Bilgisayarında çalıştır

```bash
npm install
npm run dev
```

Terminalde iki adres göreceksin:

```
Local:   http://localhost:5173/
Network: http://192.168.x.x:5173/
```

`Network` adresi, **telefonun bilgisayarla aynı Wi-Fi ağındaysa** telefondan da açılabilir demektir. Bunu hemen telefonunda dene — QR koda gerek kalmadan, tarayıcıya bu adresi yazarak masa simülasyonunu görebilirsin:

```
http://192.168.x.x:5173/?table=4
```

Bu, sistemin gerçek bir telefonda nasıl göründüğünü görmenin en hızlı yolu. Ama bu adres sadece aynı Wi-Fi'deyken çalışır, dışarıdan veya mobil veriyle açılamaz.

## 2) Gerçek bir internet adresine yayınla (ücretsiz)

Dışarıdan, herkesin QR kod okutabileceği gerçek bir adres için projeyi yayınlaman gerekiyor. En kolay ve profesyonel yol:

**A. GitHub'a yükle**
1. github.com'da ücretsiz hesap aç (yoksa).
2. Yeni bir repo oluştur (örn. `hearth-and-bean`).
3. Bu klasörü o repoya yükle (GitHub Desktop uygulamasıyla sürükle-bırak yapabilirsin, komut satırı gerekmez).

**B. Vercel ile yayınla**
1. vercel.com'a git, "Continue with GitHub" ile giriş yap.
2. "Add New Project" → GitHub reponu seç.
3. Vercel, bunun bir Vite projesi olduğunu otomatik anlar. Hiçbir ayar değiştirmeden "Deploy" butonuna bas.
4. 1 dakika içinde sana şöyle bir adres verir: `https://hearth-and-bean-xyz.vercel.app`

İşte bu, QR kodlarına gömeceğin gerçek adres.

> Netlify de aynı şekilde çalışır, istersen onu da kullanabilirsin — adımlar neredeyse aynı.

## 3) QR kodlarını üret

Sana ayrıca verdiğim `qr-kod-uretici.html` dosyasını aç (tarayıcıda çift tıklaman yeterli). İçine Vercel'den aldığın adresi yapıştır, masa sayısını seç, "Oluştur" butonuna bas. Her masa için ayrı bir QR kod kartı görünecek — yazdırabilir, masalara koyabilirsin.

Her kod şu formatta bir adrese gider:
```
https://hearth-and-bean-xyz.vercel.app/?table=3
```
Uygulama bu `?table=3` kısmını otomatik okuyup müşteriyi 3. masanın sayfasına yönlendiriyor — manuel masa seçimi yok.

## Müşteri vs. Admin (personel) — nasıl ayrılıyor?

Artık ekranın altında "Customer / Café Admin" geçiş butonu **yok**. Hangi tarafın açılacağı tamamen adrese göre belirleniyor:

- **Müşteri tarafı:** QR kod okutulduğunda gelen normal adres (`.../?table=4`). Müşteri sadece bunu görür, admin tarafına geçmesi mümkün değildir.
- **Personel (admin) tarafı:** Adresin sonuna `?staff` eklenir:
  ```
  https://hearth-and-bean-xyz.vercel.app/?staff
  ```
  Bu adres bir **giriş ekranı** açar. Doğru e-posta ve şifre girilmeden admin paneli görünmez.

### Giriş bilgilerini değiştir (önemli)

`src/App.jsx` dosyasının başında şu iki satır var — yayına almadan önce kendi bilgilerinle değiştir:

```js
const STAFF_EMAIL = "admin@hearthbean.co";
const STAFF_PASSWORD = "cafe1234";
```

Personel telefonuna/tabletine bu `?staff` adresini bir kez yer imi (bookmark) olarak kaydedersen, her seferinde tek dokunuşla giriş ekranına ulaşırlar. Giriş yapıldıktan sonra o cihaz girişi hatırlar; sağ üstteki ⎋ butonu çıkış yapar.

> **Güvenlik notu:** Bu giriş kontrolü tarayıcı tarafında çalışır — yani müşterileri admin panelinden uzak tutmak için yeterlidir, ama profesyonel/banka düzeyinde bir güvenlik değildir. Kararlı biri kodu inceleyerek aşabilir. Gerçek güvenlik için girişin bir sunucuda (backend) doğrulanması gerekir; kalıcı veritabanı kurarken bunu da birlikte ekleyebiliriz.



Bu artifact içindeyken sipariş/menü/müşteri verileri Claude'un kendi depolama sistemini (`window.storage`) kullanıyordu. Gerçek Vercel/Netlify adresinde bu sistem **yoktur** — yani şu an proje gerçek adrese taşındığında veriler tarayıcı hafızasında (geçici) tutulur, sayfa yenilenince sıfırlanır. Bu, test/demo aşaması için sorun değil. Gerçek, kalıcı bir restoran sistemi için bir veritabanı (örn. Supabase, Firebase) bağlamak gerekir — istersen bunu bir sonraki adımda birlikte kurabiliriz.
