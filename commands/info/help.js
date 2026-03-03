const { MessageMedia } = require('whatsapp-web.js');
const config = require('../../config');
const path   = require('path');
const fs     = require('fs');

const BANNER_PATH = path.join(__dirname, '../../assets/banner.png');
const p = config.prefix;

// ── Definisi Menu Per Kategori ──
const MENUS = {
  group: {
    emoji: '🛡️',
    title: 'GROUP MANAGEMENT',
    desc: 'Kelola grup dengan mudah',
    items: [
      [`${p}kick @user`, 'Kick member dari grup'],
      [`${p}add 628xxx`, 'Tambah member ke grup'],
      [`${p}promote @user`, 'Jadikan admin'],
      [`${p}demote @user`, 'Cabut status admin'],
      [`${p}mute`, 'Kunci grup (admin only)'],
      [`${p}unmute`, 'Buka kunci grup'],
      [`${p}setname [nama]`, 'Ubah nama grup'],
      [`${p}setdesc [teks]`, 'Ubah deskripsi grup'],
      [`${p}link`, 'Dapatkan link undangan'],
      [`${p}revoke`, 'Reset link undangan'],
      [`${p}tagall [pesan]`, 'Mention semua member'],
      [`${p}tagadmin [pesan]`, 'Mention semua admin'],
      [`${p}taggroup [pesan]`, 'Broadcast ke semua grup (Owner)'],
      [`${p}antilink on/off`, 'Toggle anti-link'],
      [`${p}antispam on/off`, 'Toggle anti-spam'],
      [`${p}setwelcome [teks]`, 'Set pesan welcome'],
      [`${p}setbye [teks]`, 'Set pesan goodbye'],
      [`${p}welcome on/off`, 'Toggle welcome msg'],
      [`${p}adminonly`, 'Lihat status admin-only'],
      [`${p}adminonly [cmd] on/off`, 'Toggle admin-only'],
    ],
  },
  babu: {
    emoji: '📋',
    title: 'LIST BABU',
    desc: 'Kelola list hewan ternak Vourgood',
    items: [
      [`${p}addbabu [nama]`, 'Tambah babu baru + auto-pin'],
      [`${p}listbabu`, 'Lihat semua list babu'],
      [`${p}delbabu [nomor]`, 'Hapus babu dari list'],
      [`${p}notebabu [no] [catatan]`, 'Tambah catatan ke babu'],
    ],
  },
  games: {
    emoji: '🎮',
    title: 'FUN & GAMES',
    desc: 'Game-game seru buat rame-rame',
    items: [
      [`${p}dice`, 'Lempar dadu 🎲'],
      [`${p}flip`, 'Lempar koin 🪙'],
      [`${p}rps [batu/gunting/kertas]`, 'Suit lawan bot ✊✌️🖐️'],
      [`${p}tebak`, 'Tebak angka 1-100 🔢'],
      [`${p}slot`, 'Mesin slot 🎰'],
      [`${p}trivia`, 'Kuis pengetahuan umum 🧠'],
      [`${p}truth`, 'Pertanyaan jujur 🟢'],
      [`${p}dare`, 'Tantangan berani 🔴'],
      [`${p}tod`, 'Random Truth or Dare 🎲'],
      [`${p}8ball [pertanyaan]`, 'Prediksi Magic 8-Ball 🎱'],
      [`${p}rate [sesuatu]`, 'Rate sesuatu 1-100 📊'],
      [`${p}ship @user1 @user2`, 'Cek kecocokan 2 orang 💕'],
      [`${p}siapakah [pertanyaan]`, 'Random pick orang di grup 🎯'],
      [`${p}meme`, 'Meme/jokes random 😂'],
      [`${p}roast @user`, 'Roasting lucu 🔥'],
      [`${p}puisi`, 'Pantun & puisi random 📝'],
      [`${p}zodiak [nama]`, 'Ramalan zodiak hari ini 🔮'],
      [`${p}quote`, 'Kutipan motivasi 💬'],
    ],
  },
  utility: {
    emoji: '🔧',
    title: 'UTILITY & TOOLS',
    desc: 'Tools berguna sehari-hari',
    items: [
      [`${p}sticker`, 'Gambar/video → sticker'],
      [`${p}toimg`, 'Sticker → gambar'],
      [`${p}brat [teks]`, 'Buat stiker brat 🟢'],
      [`${p}calc [expr]`, 'Kalkulator 🧮'],
      [`${p}ping`, 'Cek latensi bot 🏓'],
      [`${p}qr [teks/link]`, 'Generate QR Code 📱'],
      [`${p}remind [mnt] [pesan]`, 'Pengingat/timer ⏰'],
      [`${p}acak [a], [b], [c]`, 'Random picker 🎲'],
      [`${p}poll [?] | [a] | [b]`, 'Buat polling 📊'],
      [`${p}teks [efek] [teks]`, 'Text effects ✨'],
      [`${p}countdown [tgl]`, 'Hitung mundur 📅'],
      [`${p}cuaca [kota]`, 'Info cuaca real-time 🌤️'],
      [`${p}kbbi [kata]`, 'Cari arti di KBBI 📖'],
      [`${p}short [url]`, 'Persingkat URL 🔗'],
      [`${p}nulis [teks]`, 'Tulisan tangan ✍️'],
    ],
  },
  social: {
    emoji: '👥',
    title: 'SOCIAL & LEVELING',
    desc: 'Sistem sosial interaktif',
    items: [
      [`${p}afk [mnt] [alasan]`, 'Set AFK + timer opsional 💤'],
      [`${p}level`, 'Lihat level & XP kamu 📊'],
      [`${p}leaderboard`, 'Top 10 paling aktif 🏆'],
      [`${p}confess [pesan]`, 'Pesan anonim ke grup 🎭'],
      [`${p}profile @user`, 'Kartu profil user 🪪'],
    ],
  },
  imagetools: {
    emoji: '🖼️',
    title: 'IMAGE TOOLS',
    desc: 'Edit & manipulasi gambar',
    items: [
      [`${p}removebg`, 'Hapus background gambar 🖼️'],
      [`${p}hd`, 'HD enhance / upscale gambar ✨'],
      [`${p}ekspor`, 'Ekspor foto/video view-once 👁️'],
      [`${p}fakechat [teks]`, 'Fake iPhone chat screenshot 📱'],
    ],
  },
  ai: {
    emoji: '🧠',
    title: 'AI CHATBOT',
    desc: 'Chat dengan Gemini AI',
    items: [
      [`${p}ai [teks]`, 'Tanya AI 💳'],
      [`${p}aikredit`, 'Cek saldo kredit AI'],
      [`${p}aicharge @user [n]`, 'Charge kredit (owner)'],
      [`${p}aireset`, 'Reset riwayat AI'],
    ],
  },
  download: {
    emoji: '📥',
    title: 'DOWNLOADER',
    desc: 'Download media dari sosmed',
    items: [
      [`${p}tt [link]`, 'Download video TikTok 🎬'],
      [`${p}ttaudio [link]`, 'Download audio TikTok 🎵'],
    ],
  },
  info: {
    emoji: 'ℹ️',
    title: 'INFO',
    desc: 'Informasi tentang bot',
    items: [
      [`${p}start`, 'Tampilkan intro bot'],
      [`${p}menu`, 'Tampilkan menu ini'],
      [`${p}menu [kategori]`, 'Menu per kategori'],
      [`${p}runtime`, 'Waktu aktif bot'],
      [`${p}info`, 'Info bot'],
    ],
  },
  role: {
    emoji: '🎭',
    title: 'ROLE & VERIFIKASI',
    desc: 'Sistem limit fitur & akses',
    items: [
      [`${p}claim`, 'Verifikasi untuk main bot'],
      [`${p}myrole`, 'Cek role kamu saat ini'],
      [`${p}roleinfo`, 'Lihat seluruh role yang ada'],
      [`${p}addrole [id] [limit] [nama]`, 'Buat role (Owner)'],
      [`${p}delrole [id]`, 'Hapus role (Owner)'],
      [`${p}setrole @user [id]`, 'Beri role (Owner)'],
      [`${p}removerole @user`, 'Cabut role (Owner)'],
    ],
  },
};

/**
 * Format satu kategori menjadi teks
 */
function formatCategory(key) {
  const cat = MENUS[key];
  if (!cat) return null;

  let text = `${cat.emoji} *${cat.title}*\n`;
  text += `_${cat.desc}_\n`;
  text += `┌──────────────────\n`;
  for (const [cmd, desc] of cat.items) {
    text += `│ \`${cmd}\`\n│   ↳ ${desc}\n`;
  }
  text += `└──────────────────`;
  return text;
}

/**
 * Command: !menu / !help
 * Tanpa argumen → menu utama + gambar
 * Dengan argumen → detail kategori tertentu
 */
async function showHelp(msg, args) {
  const sub = args && args[1]?.toLowerCase();

  // ── Sub-menu spesifik ──
  if (sub && MENUS[sub]) {
    const catText = formatCategory(sub);
    const header =
`╔══════════════════════════════╗
║ 🤖 *${config.botName}* — ${MENUS[sub].emoji} ${MENUS[sub].title}
╚══════════════════════════════╝

${catText}

💡 Ketik *${p}menu* untuk kembali ke menu utama`;
    return msg.reply(header);
  }

  // ── Menu utama (semua kategori ringkas) ──
  const chat = await msg.getChat();
  const sender = await msg.getContact();
  const name = sender.pushname || sender.name || 'User';

  const greeting = getGreeting();

  let menuText =
`${greeting}, *${name}*! 👋

╔══════════════════════════════╗
║    🤖 *${config.botName}*
║    ${config.botTagline || 'Asisten WhatsApp Terlengkap'}
║    📌 v${config.botVersion || '1.0.0'}
╚══════════════════════════════╝

┌─── 📂 *KATEGORI MENU* ───\n`;

  for (const [key, cat] of Object.entries(MENUS)) {
    menuText += `│\n`;
    menuText += `│ ${cat.emoji} *${cat.title}*\n`;
    menuText += `│ _${cat.desc}_\n`;
    menuText += `│ ➤ Ketik: \`${p}menu ${key}\`\n`;
  }

  menuText += `│\n└──────────────────────

📊 *Total:* ${Object.values(MENUS).reduce((a, c) => a + c.items.length, 0)} perintah tersedia

💡 _Pilih kategori di atas untuk melihat detail perintah_
⏰ ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}

_Made with ❤️ by hams_bot_`;

  // Kirim dengan gambar banner jika ada
  if (fs.existsSync(BANNER_PATH)) {
    const base64 = fs.readFileSync(BANNER_PATH).toString('base64');
    const media  = new MessageMedia('image/png', base64, 'menu-banner.png');
    await chat.sendMessage(media, { caption: menuText });
  } else {
    await chat.sendMessage(menuText);
  }
}

/**
 * Greeting berdasarkan waktu
 */
function getGreeting() {
  const hour = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', hour: 'numeric', hour12: false });
  const h = parseInt(hour);
  if (h >= 4 && h < 11) return '🌅 Selamat pagi';
  if (h >= 11 && h < 15) return '☀️ Selamat siang';
  if (h >= 15 && h < 18) return '🌇 Selamat sore';
  return '🌙 Selamat malam';
}

module.exports = { showHelp };
