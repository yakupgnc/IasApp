# 🏠 İaşApp

Öğrenci evinde ortak harcamaları, aylık iaşe bütçesini, alışveriş listesini ve ay sonu hesaplaşmalarını kolayca yönetmek için geliştirilmiş **Progressive Web App (PWA)** uygulaması.

---

## ✨ Özellikler

- **🔐 Kullanıcı & Ev Yönetimi:** Firebase Authentication ile giriş/kayıt; yeni ev oluşturma veya 6 haneli davet koduyla mevcut bir eve katılma.
- **📊 Aylık İaşe Bütçesi:** Kişi başı belirlenen bütçe üzerinden evin toplam harcamasını ve ilerleme yüzdesini anlık takip etme.
- **💸 Harcama & Fiş Takibi:** Harcamaları tarih ve açıklama ile kaydetme, **Cloudinary** entegrasyonu sayesinde fatura/fiş fotoğrafı yükleyip görüntüleme.
- **🛒 Ortak Alışveriş Listesi:** Ev arkadaşlarıyla paylaşılan gerçek zamanlı alışveriş listesi, ürün önerileri ve tamamlananları yönetme.
- **📈 Ay Sonu Hesaplama:** Toplam harcama, kişi başı düşen pay ve kim kime ne kadar transfer yapmalı bilgisini otomatik hesaplama + geçmiş dönem arşivi.
- **🎨 Tema & Mobil Deneyim:** Karanlık/Aydınlık mod desteği ve mobil cihazlara kurulabilir **PWA** (`manifest.json` & `sw.js`) yapısı.

---

## 🛠️ Kullanılan Teknolojiler

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend / Veritabanı:** Firebase Authentication & Cloud Firestore
- **Görsel Depolama:** Cloudinary (Profil ve fiş fotoğrafları)
- **PWA:** Service Worker (`sw.js`) & Web App Manifest (`manifest.json`)

---

## 📁 Proje Yapısı

```text
IasApp/
├── index.html            # Ana uygulama arayüzü ve ekranlar
├── manifest.json         # PWA yapılandırması
├── sw.js                 # Service Worker (çevrimdışı/önbellek desteği)
├── css/
│   └── style.css         # Uygulama stilleri ve tema değişkenleri
├── icons/                # PWA uygulama ikonları (192x192, 512x512)
└── js/
    ├── firebase-config.js # Firebase başlatma ayarları
    ├── cloudinary.js      # Cloudinary fotoğraf yükleme modülü
    ├── auth.js            # Giriş, kayıt ve şifre sıfırlama
    ├── house.js           # Ev oluşturma, katılma ve üye yönetimi
    ├── expenses.js        # Harcama ekleme, filtreleme ve listeleme
    ├── shopping.js        # Ortak alışveriş listesi
    ├── calculate.js       # Ay sonu borç/transfer hesaplama ve arşivleme
    └── app.js             # Genel uygulama akışı, sekmeler ve tema yönetimi
```

---

## 🚀 Çalıştırma

Statik bir web uygulaması olduğu için herhangi bir yerel sunucu ile doğrudan çalıştırılabilir:

```bash
# Örnek: VS Code Live Server veya Node/Python ile yerel sunucu
npx serve .
```

> **Not:** Service Worker (`/sw.js`) ve PWA özelliklerinin tam çalışması için uygulamanın `localhost` veya `HTTPS` (ör. GitHub Pages) üzerinden sunulması gerekir.
