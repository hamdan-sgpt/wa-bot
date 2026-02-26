# 🤖 WA-BOT — WhatsApp Group Bot Full Fitur

Bot WhatsApp grup berbasis **whatsapp-web.js** dengan fitur lengkap.

## 🚀 Cara Menjalankan

### 1. Install dependencies
```bash
npm install
```

### 2. Atur konfigurasi
Edit file `config.js`:
- Ganti `owners` dengan nomor WA kamu (`628xxx@c.us`)
- `geminiApiKey` sudah terisi
- Ubah `prefix` jika mau (default: `!`)

### 3. Jalankan bot
```bash
node index.js
```

### 4. Scan QR Code
QR akan muncul di terminal. Scan menggunakan WhatsApp:
> **WhatsApp → Perangkat Tertaut → Tautkan Perangkat**

---

## 📋 Daftar Perintah

### 🔧 Group Management (Admin only)
| Perintah | Fungsi |
|---|---|
| `!kick @user` | Keluarkan member |
| `!add 628xxx` | Tambah member |
| `!promote @user` | Jadikan admin |
| `!demote @user` | Cabut admin |
| `!mute` | Kunci grup (hanya admin bisa chat) |
| `!unmute` | Buka grup |
| `!setname [nama]` | Ubah nama grup |
| `!setdesc [teks]` | Ubah deskripsi grup |
| `!link` | Dapatkan link undangan |
| `!revoke` | Reset link undangan |
| `!tagall [pesan]` | Mention semua member |
| `!antilink on/off` | Toggle auto-hapus link WA |
| `!antispam on/off` | Toggle anti-flood/spam |
| `!setwelcome [teks]` | Set pesan selamat datang |
| `!setbye [teks]` | Set pesan goodbye |
| `!welcome on/off` | Toggle welcome message |

### 🎮 Fun & Utility
| Perintah | Fungsi |
|---|---|
| `!sticker` | Gambar/GIF → sticker |
| `!toimg` | Sticker → gambar |
| `!ai [teks]` | Chat dengan AI (Gemini) |
| `!aireset` | Reset riwayat AI |
| `!dice` | Lempar dadu 🎲 |
| `!flip` | Lempar koin 🪙 |
| `!quote` | Kutipan acak 💬 |
| `!calc [expr]` | Kalkulator 🧮 |
| `!ping` | Cek latensi bot 🏓 |

### ℹ️ Info
| Perintah | Fungsi |
|---|---|
| `!help` | Daftar perintah |
| `!runtime` | Waktu aktif bot |
| `!info` | Info bot |

---

## 📁 Struktur Folder
```
wa-bot/
├── index.js              # Entry point
├── config.js             # Konfigurasi bot
├── package.json
├── sessions/             # Data sesi WA (auto-generated)
├── data/                 # Setting per-grup (auto-generated)
└── commands/
    ├── handler.js        # Command dispatcher
    ├── group/
    │   ├── admin.js      # Group management commands
    │   ├── tagall.js     # Mention semua member
    │   ├── antilink.js   # Anti-link system
    │   └── antispam.js   # Anti-spam system
    ├── fun/
    │   ├── ai.js         # Gemini AI chat
    │   ├── sticker.js    # Konversi sticker
    │   └── games.js      # Dice, flip, quote, calc, ping
    └── info/
        ├── help.js       # Help menu
        └── runtime.js    # Uptime info
```

---

## ⚙️ Konfigurasi Per-Grup
Setting per grup disimpan otomatis di folder `data/` dalam format JSON.
Setiap grup punya pengaturan independent (antilink, antispam, welcome, dll).

---

## 🛡️ Sistem Peringatan (Warn)
- Anti-link: **3 warn → auto kick**
- Anti-spam: **3 warn → auto kick** (configurable di `config.js`)
- Admin grup tidak kena warn system

---

## 📝 Variabel Welcome/Goodbye
- `@user` → diganti nama member
- `@group` → diganti nama grup
