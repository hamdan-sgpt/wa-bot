const { evaluate } = require('mathjs');

// ═══════════════════════════════════════════════════════════════
//  DATA ARRAYS — Konten lokal Bahasa Indonesia
// ═══════════════════════════════════════════════════════════════

const quotes = [
  '"Hidup adalah perjalanan, bukan tujuan." — Ralph Waldo Emerson',
  '"Kesuksesan adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan." — Colin Powell',
  '"Jangan takut gagal. Takutlah tidak pernah mencoba." — Unknown',
  '"Mulailah dari mana kamu berada. Gunakan apa yang kamu punya. Lakukan apa yang kamu bisa." — Arthur Ashe',
  '"Mimpi bukan yang membuatmu tidur, melainkan yang membuatmu tidak bisa tidur." — A.P.J. Abdul Kalam',
  '"Setiap expert dulunya adalah seorang pemula." — Helen Hayes',
  '"Bukan seberapa keras kamu jatuh, tapi seberapa cepat kamu bangkit." — Unknown',
  '"Satu-satunya cara melakukan pekerjaan luar biasa adalah mencintai apa yang kamu lakukan." — Steve Jobs',
  '"Orang yang berhenti belajar akan menjadi tua, baik pada usia dua puluh maupun delapan puluh." — Henry Ford',
  '"Sukses bukanlah akhir, kegagalan bukanlah fatal. Yang terpenting adalah keberanian untuk melanjutkan." — Winston Churchill',
];

const eightBallAnswers = [
  // Positif
  '✅ Pasti iya dong!',
  '✅ Tanpa keraguan, YA!',
  '✅ Bisa dipastikan, jawabannya iya.',
  '✅ Sepertinya iya, percaya deh!',
  '✅ Kemungkinan besar iya 😎',
  '✅ Tentu saja! Yakin aja!',
  // Netral
  '🤔 Hmm... coba tanya lagi nanti.',
  '🤔 Belum bisa dipastikan, coba lagi.',
  '🤔 Terlalu kabur untuk dijawab sekarang.',
  '🤔 Konsentrasi dulu, terus tanya lagi.',
  // Negatif
  '❌ Jangan berharap deh...',
  '❌ Jawabannya... TIDAK.',
  '❌ Kayaknya nggak tuh.',
  '❌ Sumber saya bilang tidak.',
  '❌ Sangat meragukan. Maaf ya 😬',
];

const truthQuestions = [
  'Siapa crush kamu sekarang? 👀',
  'Apa rahasia terbesar yang belum pernah kamu ceritakan ke siapapun?',
  'Pernah stalking mantan? Sejauh apa? 🕵️',
  'Apa hal paling memalukan yang pernah terjadi di sekolah/kampus?',
  'Siapa orang di grup ini yang paling kamu suka? 😏',
  'Pernah bohong ke orang tua soal apa?',
  'Apa kebiasaan aneh yang kamu lakuin pas sendirian?',
  'Pernah cemburu sama siapa? Kenapa?',
  'Kalau bisa hapus satu chat dari HP, chat siapa yang bakal kamu hapus?',
  'Apa yang kamu lakuin kalau tahu besok dunia kiamat?',
  'Siapa mantan yang paling susah dilupain? 💔',
  'Pernah nangis gara-gara film/lagu apa?',
  'Apa hal yang kamu mau ubah dari diri kamu?',
  'Kapan terakhir kali kamu bohong? Tentang apa?',
  'Siapa orang yang kamu benci tapi pura-pura suka?',
  'Apa username/akun sosmed kamu yang paling rahasia?',
  'Pernah menyesal nggak jadian sama siapa?',
  'Hal apa yang bikin kamu insecure?',
  'Apa mimpi terliar yang pernah kamu impikan? 🌙',
  'Pernahkah kamu baca chat orang lain diam-diam?',
];

const dareChallenges = [
  'Kirim voice note nyanyi lagu galau ke grup ini 🎤',
  'Ganti foto profil jadi foto terjelek kamu selama 1 jam 📸',
  'Kirim chat "aku kangen kamu" ke kontak terakhir yang kamu chat 💬',
  'Story WA pake foto yang udah 2 tahun lalu selama 1 jam',
  'Tulis puisi cinta untuk orang di atas chat kamu 📝',
  'Kirim emoji ❤️ ke 5 orang random di kontak',
  'Voice note selama 30 detik bilang "aku sayang kalian semua" di grup ini',
  'Screenshot lockscreen HP kamu dan kirim di sini 📱',
  'Tulis 3 hal yang kamu suka dari kamu sendiri',
  'Kirim foto selfie tanpa filter sekarang juga! 🤳',
  'Telpon orang yang terakhir kamu chat, speaker mode di sini 📞',
  'Bikin status WA pake quote alay selama 2 jam',
  'Follow/add orang random di Instagram dan kasih liat hasilnya',
  'Ganti bio WA jadi "aku butuh pacar" selama 1 jam',
  'Kirim stiker yang paling cringe yang kamu punya',
  'Record video 10 detik joget random dan kirim di sini 💃',
  'Chat mantan kamu bilang "halo, apa kabar?" 😈',
  'Tulis nama crush kamu di sini (pake inisial boleh)',
  'Kirim foto galeri pertama kamu di sini 🖼️',
  'Ceritain hal paling memalukan yang pernah terjadi minggu ini',
];

const memeTexts = [
  '🧑‍💻 Programmer: "Ini gampang, 5 menit doang"\n*3 jam kemudian*\n"Ternyata titik komanya kurang satu."',
  '📱 Buka HP bentar mau liat jam\n*2 jam kemudian*\n...tetep gatau jam berapa',
  '🍜 "Mau diet mulai besok"\n*Besok*\n"Ya udah mulai besok lagi aja"',
  '🛏️ Alarm jam 6:\n*Snooze*\nAlarm jam 6:05:\n*Snooze*\nAlarm jam 6:10:\n"YA ALLAH UDAH JAM 9!"',
  '💬 "Gue balas chat lo ntar ya"\n*3 hari kemudian*\n"Eh sori baru baca"',
  '🎮 "Main game bentar 30 menit"\n*Jam 3 pagi*\n"Satu round lagi..."',
  '📚 Sebelum ujian: "Santai, masih banyak waktu"\nH-1 ujian: *panik.jpg*\nPas ujian: "Yang penting isi semua"',
  '🛒 "Belanja kebutuhan aja"\n*Di kasir*\nTotal: Rp 500.000\n"...kebutuhan batiniah juga kan"',
  '😴 Senin: pengen cepet weekend\nJumat malam: YEAYYY\nSabtu sore: waduh besok udah Minggu\nMinggu malam: 💀',
  '🤝 Introvert dipaksa kenalan:\n"Hai..." *awkward silence 10 detik* "...cuacanya bagus ya"',
  '📞 Telpon dari nomor nggak dikenal:\n*Let it ring*\n*Google nomornya*\n*Tunggu mereka tinggalin voice mail*\n*Anxiety*',
  '💻 "Laptop gue lemot banget"\n*Buka task manager*\nChrome: 47 tabs 🗿',
  '🧹 Mau beresin kamar:\n*Nemuin album foto lama*\n*3 jam kemudian masih nostalgia*\nKamar tetep berantakan',
  '🤔 Group chat: 200 unread messages\n*Scroll up*\nTernyata cuma debat pake meme\n"Gue skip aja deh"',
  '🏃 "Mulai rutin olahraga"\nHari 1: Semangat 💪\nHari 2: Oke masih bisa\nHari 3: *Otot semua sakit*\nHari 4-∞: "Minggu depan lah"',
];

const roastTexts = [
  'kamu tuh kayak WiFi gratisan, ada sih tapi nggak bisa diandalkan 📶',
  'mukamu kayak error 404 — kegantengan/kecantikan not found 💀',
  'kamu tuh kayak JavaScript — semua orang pake tapi nggak ada yang beneran suka 😂',
  'otakmu kayak RAM 512MB — baru mikir dikit udah nge-lag 🧠',
  'kamu tuh kayak charger KW — keliatan berguna tapi bikin masalah doang ⚡',
  'wajahmu kayak foto yang di-compress 100 kali — makin diliat makin buram 📸',
  'kamu kayak tab Chrome yang ke-48 — nggak ada gunanya tapi tetep nggak ditutup 🗿',
  'intronya bagus, tapi endingnya mengecewakan — kayak hidup kamu 🎬',
  'kamu tuh kayak printer kantor — cuma jalan kalau ada yang mukul 🖨️',
  'kamu mirip Senin pagi — semua orang pengen skip kamu ☀️',
  'kamu kayak password WiFi yang dikasih ke tamu — dipake sekali terus dilupain 🔒',
  'storytelling kamu kayak buffering — lambat dan bikin orang ninggalin 📺',
  'kamu kayak Excel — banyak yang pake tapi nggak ada yang paham sepenuhnya 📊',
  'keberadaanmu kayak watermark — ada tapi ganggu pemandangan 💧',
  'kamu tuh kayak notifikasi update — muncul terus padahal nggak ada yang mau 🔔',
];

const puisiTexts = [
  '🌹 *Pantun Receh*\n\nPergi ke pasar beli rambutan,\nDi jalan ketemu sama Pak RT,\nHidup ini penuh perjuangan,\nTapi rebahan tetap prioritas nomer satu. 🛋️',
  '🎋 *Pantun Galau*\n\nBeli mangga di pinggir jalan,\nPulang-pulang hujan deras,\nCinta ini memang bukan mainan,\nTapi kok yang main perasaan cuma gue sendiri ya? 💔',
  '📖 *Pantun Motivasi*\n\nIkan lele di kolam ikan,\nDipancing pake umpan cacing,\nJangan cuma jadi penonton,\nAyo bangun, jangan mageran! 💪',
  '🌙 *Pantun Malam*\n\nBulan bersinar di atas atap,\nBintang berkedip terang menyala,\nSudah malam masih belum tidur,\nGara-gara scroll HP nggak berasa. 📱',
  '🍜 *Pantun Makanan*\n\nMakan bakso di pinggir jalan,\nPake sambal tambahin kecap,\nHidup memang penuh masalah,\nTapi perut kosong lebih mendesak. 😂',
  '🎭 *Pantun Bucin*\n\nBeli roti di toko kue,\nRotinya enak ada coklatnya,\nAku sayang kamu banget tau,\nTapi sayang kamu nggak peka-pekanya. 😭',
  '🌊 *Pantun Bijak*\n\nPerahu layar di tengah laut,\nNelayan pulang membawa ikan,\nJangan suka bicara ngawur,\nNtar yang rugi diri sendiri kan. 🤷',
  '🎪 *Pantun Gaje*\n\nKe Bandung naik kereta,\nSinggah dulu di Cimahi,\nHidup ini jangan terlalu serius,\nKadang-kadang perlu receh sendiri. 🤡',
  '☕ *Pantun Pagi*\n\nMinum kopi di pagi hari,\nDitemani roti bakar mentega,\nSemangat pagi buat semua,\nWalau sebenarnya masih ngantuk berat. 😴',
  '🎓 *Pantun Anak Kos*\n\nBeli indomie dua bungkus,\nDimasak pake kompor kecil,\nTanggal tua memang sadis,\nTapi Indomie selalu setia. 🍜',
];

const zodiacData = {
  aries: { emoji: '♈', periode: '21 Mar - 19 Apr', elemen: 'Api 🔥' },
  taurus: { emoji: '♉', periode: '20 Apr - 20 Mei', elemen: 'Tanah 🌍' },
  gemini: { emoji: '♊', periode: '21 Mei - 20 Jun', elemen: 'Udara 💨' },
  cancer: { emoji: '♋', periode: '21 Jun - 22 Jul', elemen: 'Air 💧' },
  leo: { emoji: '♌', periode: '23 Jul - 22 Agu', elemen: 'Api 🔥' },
  virgo: { emoji: '♍', periode: '23 Agu - 22 Sep', elemen: 'Tanah 🌍' },
  libra: { emoji: '♎', periode: '23 Sep - 22 Okt', elemen: 'Udara 💨' },
  scorpio: { emoji: '♏', periode: '23 Okt - 21 Nov', elemen: 'Air 💧' },
  sagittarius: { emoji: '♐', periode: '22 Nov - 21 Des', elemen: 'Api 🔥' },
  capricorn: { emoji: '♑', periode: '22 Des - 19 Jan', elemen: 'Tanah 🌍' },
  aquarius: { emoji: '♒', periode: '20 Jan - 18 Feb', elemen: 'Udara 💨' },
  pisces: { emoji: '♓', periode: '19 Feb - 20 Mar', elemen: 'Air 💧' },
};

const zodiacFortunes = {
  cinta: [
    'Hari ini cocok buat pdkt sama gebetan 💕',
    'Jaga perasaan pasangan, jangan bikin baper 😌',
    'Ada yang diam-diam perhatiin kamu lho 👀',
    'Hari ini mending fokus self-love dulu 💖',
    'Jomblo? Sabar, jodoh nggak kemana 😤',
    'Sinyalin perasaan kamu, jangan pendam terus!',
    'Hari yang romantis! Ajak dinner atau nonton 🎬',
    'Hati-hati, jangan baper sama yang PHP!',
  ],
  karir: [
    'Produktivitas lagi tinggi, manfaatin! 📈',
    'Jangan males-malesan, bos lagi merhatiin 👁️',
    'Ada peluang bagus datang, siap-siap! 🎯',
    'Hari ini mending santai dulu, jangan dipaksain 😮‍💨',
    'Fokus sama deadline yang paling deket!',
    'Kerja tim bakal lancar hari ini 🤝',
    'Hindari konflik sama rekan kerja ya',
    'Ide cemerlang bakal muncul, catat semua! 💡',
  ],
  keuangan: [
    'Jangan boros hari ini, nabung aja 💰',
    'Ada rezeki nggak terduga datang! 🎉',
    'Hindari pinjam-meminjam uang hari ini',
    'Waktu yang tepat buat investasi kecil 📊',
    'Pengeluaran banyak, atur budgetmu!',
    'Rezeki lancar, tapi tetap bijak ya 🙏',
    'Cek saldo dulu sebelum checkout! 🛒',
    'Hari ini cocok buat review keuangan',
  ],
  kesehatan: [
    'Jangan skip makan, kesehatan penting! 🥗',
    'Luangin waktu olahraga walau 15 menit 🏃',
    'Tidur cukup ya, jangan begadang terus 😴',
    'Minum air putih yang banyak hari ini 💧',
    'Energi lagi oke, manfaatin buat gerak!',
    'Stres? Coba meditasi atau jalan-jalan sebentar 🧘',
    'Jaga pola makan, jangan kebanyakan junk food',
    'Mood bagus hari ini, sebarkan vibes positif! ✨',
  ],
};

const triviaQuestions = [
  { q: 'Apa ibukota Australia?', choices: ['A. Sydney', 'B. Melbourne', 'C. Canberra', 'D. Perth'], answer: 'C' },
  { q: 'Planet apa yang paling dekat dengan matahari?', choices: ['A. Venus', 'B. Merkurius', 'C. Mars', 'D. Bumi'], answer: 'B' },
  { q: 'Berapa jumlah provinsi di Indonesia (2024)?', choices: ['A. 34', 'B. 37', 'C. 38', 'D. 40'], answer: 'C' },
  { q: 'Siapa penemu telepon?', choices: ['A. Thomas Edison', 'B. Nikola Tesla', 'C. Alexander Graham Bell', 'D. Guglielmo Marconi'], answer: 'C' },
  { q: 'Apa hewan nasional Indonesia?', choices: ['A. Harimau', 'B. Komodo', 'C. Garuda', 'D. Orangutan'], answer: 'B' },
  { q: 'Gunung tertinggi di dunia?', choices: ['A. K2', 'B. Kangchenjunga', 'C. Everest', 'D. Kilimanjaro'], answer: 'C' },
  { q: 'Tahun berapa Indonesia merdeka?', choices: ['A. 1944', 'B. 1945', 'C. 1946', 'D. 1950'], answer: 'B' },
  { q: 'Apa bahasa pemrograman yang dibuat oleh Brendan Eich?', choices: ['A. Python', 'B. Java', 'C. JavaScript', 'D. C++'], answer: 'C' },
  { q: 'Sungai terpanjang di dunia?', choices: ['A. Amazon', 'B. Nil', 'C. Mississippi', 'D. Yangtze'], answer: 'B' },
  { q: 'Organ manusia yang paling besar?', choices: ['A. Hati', 'B. Otak', 'C. Kulit', 'D. Paru-paru'], answer: 'C' },
  { q: 'Apa nama mata uang Jepang?', choices: ['A. Won', 'B. Yuan', 'C. Yen', 'D. Ringgit'], answer: 'C' },
  { q: 'Berapa jumlah tulang dalam tubuh manusia dewasa?', choices: ['A. 186', 'B. 206', 'C. 226', 'D. 256'], answer: 'B' },
  { q: 'Siapa presiden pertama Indonesia?', choices: ['A. Suharto', 'B. Sukarno', 'C. Habibie', 'D. Hatta'], answer: 'B' },
  { q: 'Planet yang dikenal sebagai planet merah?', choices: ['A. Jupiter', 'B. Venus', 'C. Mars', 'D. Saturnus'], answer: 'C' },
  { q: 'Berapa lama cahaya matahari sampai ke bumi?', choices: ['A. 4 menit', 'B. 8 menit', 'C. 12 menit', 'D. 1 jam'], answer: 'B' },
  { q: 'Apa nama ibu kota Thailand?', choices: ['A. Hanoi', 'B. Manila', 'C. Bangkok', 'D. Kuala Lumpur'], answer: 'C' },
  { q: 'Hewan apa yang bisa terbang mundur?', choices: ['A. Elang', 'B. Kolibri', 'C. Burung Hantu', 'D. Kalong'], answer: 'B' },
  { q: 'Berapa derajat sudut dalam segitiga?', choices: ['A. 90°', 'B. 180°', 'C. 270°', 'D. 360°'], answer: 'B' },
  { q: 'Apa nama selat yang memisahkan Jawa dan Sumatera?', choices: ['A. Selat Malaka', 'B. Selat Sunda', 'C. Selat Bali', 'D. Selat Lombok'], answer: 'B' },
  { q: 'Negara manakah yang mempunyai jumlah pulau terbanyak?', choices: ['A. Filipina', 'B. Indonesia', 'C. Swedia', 'D. Jepang'], answer: 'C' },
];

// ═══════════════════════════════════════════════════════════════
//  GAME STATE (in-memory, per-chat tebak angka sessions)
// ═══════════════════════════════════════════════════════════════
const tebakSessions = new Map(); // chatId => { number, attempts, maxAttempts }

// ═══════════════════════════════════════════════════════════════
//  ORIGINAL COMMANDS (existing)
// ═══════════════════════════════════════════════════════════════

async function dice(msg) {
  const result = Math.floor(Math.random() * 6) + 1;
  const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  await msg.reply(`🎲 Hasil dadu: *${result}* ${faces[result - 1]}`);
}

async function flip(msg) {
  const result = Math.random() < 0.5 ? 'HEADS 🦅' : 'TAILS 🌑';
  await msg.reply(`🪙 Hasil lempar koin: *${result}*`);
}

async function randomQuote(msg) {
  const q = quotes[Math.floor(Math.random() * quotes.length)];
  await msg.reply(`💬 *Quote Hari Ini:*\n\n${q}`);
}

async function calculator(msg, args) {
  const expr = args.slice(1).join(' ');
  if (!expr) return msg.reply('❌ Masukkan ekspresi matematika!\nContoh: !calc 2+2*3\nOr: !calc sqrt(16)');
  try {
    const result = evaluate(expr);
    await msg.reply(`🧮 *Kalkulator*\n\n📝 Ekspresi: \`${expr}\`\n✅ Hasil: *${result}*`);
  } catch {
    await msg.reply('❌ Ekspresi tidak valid. Contoh: !calc 2+2, !calc sqrt(144), !calc 5^3');
  }
}

async function ping(client, msg) {
  const start = Date.now();
  const reply = await msg.reply('🏓 Pinging...');
  const latency = Date.now() - start;
  await reply.edit(`🏓 *Pong!*\n⚡ Latensi: *${latency}ms*`);
}

// ═══════════════════════════════════════════════════════════════
//  NEW GAMES 🎮
// ═══════════════════════════════════════════════════════════════

// ── 1. Rock Paper Scissors ──
async function rps(msg, args) {
  const choices = ['batu', 'gunting', 'kertas'];
  const emojis = { batu: '🪨', gunting: '✂️', kertas: '📄' };
  const userChoice = args[1]?.toLowerCase();

  if (!userChoice || !choices.includes(userChoice)) {
    return msg.reply(
      `✊✌️🖐️ *SUIT / RPS*\n\n` +
      `Cara main: \`!rps [batu/gunting/kertas]\`\n\n` +
      `Contoh: \`!rps batu\``
    );
  }

  const botChoice = choices[Math.floor(Math.random() * choices.length)];
  let result;

  if (userChoice === botChoice) {
    result = '🟡 *SERI!*';
  } else if (
    (userChoice === 'batu' && botChoice === 'gunting') ||
    (userChoice === 'gunting' && botChoice === 'kertas') ||
    (userChoice === 'kertas' && botChoice === 'batu')
  ) {
    result = '🟢 *KAMU MENANG!* 🎉';
  } else {
    result = '🔴 *KAMU KALAH!* 😭';
  }

  await msg.reply(
    `✊✌️🖐️ *SUIT / RPS*\n\n` +
    `Kamu: ${emojis[userChoice]} ${userChoice.toUpperCase()}\n` +
    `Bot: ${emojis[botChoice]} ${botChoice.toUpperCase()}\n\n` +
    `${result}`
  );
}

// ── 2. Tebak Angka ──
async function tebakAngka(msg, args) {
  const chatId = msg.from;
  const guess = parseInt(args[1]);

  // Start new game
  if (!args[1] || args[1]?.toLowerCase() === 'start') {
    const number = Math.floor(Math.random() * 100) + 1;
    tebakSessions.set(chatId, { number, attempts: 0, maxAttempts: 7 });
    return msg.reply(
      `🔢 *TEBAK ANGKA*\n\n` +
      `Aku udah pilih angka antara *1 - 100*\n` +
      `Kamu punya *7 kesempatan* untuk nebak!\n\n` +
      `Kirim: \`!tebak [angka]\`\n` +
      `Contoh: \`!tebak 50\`\n\n` +
      `Ketik \`!tebak nyerah\` untuk menyerah`
    );
  }

  const session = tebakSessions.get(chatId);
  if (!session) {
    return msg.reply('❌ Belum ada game aktif! Ketik `!tebak start` untuk mulai.');
  }

  // Give up
  if (args[1]?.toLowerCase() === 'nyerah' || args[1]?.toLowerCase() === 'giveup') {
    const answer = session.number;
    tebakSessions.delete(chatId);
    return msg.reply(`😞 *Menyerah!*\n\nJawabannya adalah: *${answer}*\nCoba lagi dengan \`!tebak start\`!`);
  }

  if (isNaN(guess) || guess < 1 || guess > 100) {
    return msg.reply('❌ Masukkan angka antara 1-100!');
  }

  session.attempts++;
  const remaining = session.maxAttempts - session.attempts;

  if (guess === session.number) {
    tebakSessions.delete(chatId);
    const stars = session.attempts <= 3 ? '⭐⭐⭐' : session.attempts <= 5 ? '⭐⭐' : '⭐';
    return msg.reply(
      `🎉 *BENAR!*\n\n` +
      `Angkanya memang *${session.number}*!\n` +
      `Kamu berhasil dalam *${session.attempts} percobaan*\n` +
      `Rating: ${stars}`
    );
  }

  if (remaining <= 0) {
    const answer = session.number;
    tebakSessions.delete(chatId);
    return msg.reply(
      `💀 *GAME OVER!*\n\n` +
      `Kesempatan habis! Jawabannya: *${answer}*\n` +
      `Coba lagi dengan \`!tebak start\`!`
    );
  }

  const hint = guess < session.number ? '⬆️ *Lebih tinggi!*' : '⬇️ *Lebih rendah!*';
  const diff = Math.abs(guess - session.number);
  let heatHint = '';
  if (diff <= 5) heatHint = '🔥🔥🔥 PANAS BANGET!';
  else if (diff <= 15) heatHint = '🔥🔥 Panas!';
  else if (diff <= 30) heatHint = '🔥 Hangat...';
  else heatHint = '🧊 Dingin...';

  await msg.reply(
    `🔢 *TEBAK ANGKA*\n\n` +
    `Tebakan: *${guess}*\n${hint}\n${heatHint}\n\n` +
    `Sisa kesempatan: *${remaining}*`
  );
}

// ── 3. Truth ──
async function truth(msg) {
  const q = truthQuestions[Math.floor(Math.random() * truthQuestions.length)];
  await msg.reply(`🟢 *TRUTH*\n\n${q}\n\n_Jawab dengan jujur ya! 😏_`);
}

// ── 4. Dare ──
async function dare(msg) {
  const d = dareChallenges[Math.floor(Math.random() * dareChallenges.length)];
  await msg.reply(`🔴 *DARE*\n\n${d}\n\n_Harus dilakuin, nggak boleh nolak! 😈_`);
}

// ── 5. Truth or Dare ──
async function tod(msg) {
  if (Math.random() < 0.5) {
    await truth(msg);
  } else {
    await dare(msg);
  }
}

// ── 6. Magic 8-Ball ──
async function eightBall(msg, args) {
  const question = args.slice(1).join(' ');
  if (!question) {
    return msg.reply('🎱 Tulis pertanyaanmu!\nContoh: `!8ball apakah aku ganteng?`');
  }
  const answer = eightBallAnswers[Math.floor(Math.random() * eightBallAnswers.length)];
  await msg.reply(
    `🎱 *MAGIC 8-BALL*\n\n` +
    `❓ Pertanyaan: _${question}_\n\n` +
    `${answer}`
  );
}

// ── 7. Rate ──
async function rate(msg, args) {
  const thing = args.slice(1).join(' ');
  if (!thing) return msg.reply('❌ Rate apa?\nContoh: `!rate masakan ibu`');

  const score = Math.floor(Math.random() * 101);
  let reaction;
  if (score <= 20) reaction = '💩 Ampun deh...';
  else if (score <= 40) reaction = '😐 Biasa aja sih...';
  else if (score <= 60) reaction = '🙂 Lumayan lah!';
  else if (score <= 80) reaction = '😍 Wah bagus!';
  else if (score <= 95) reaction = '🔥 Mantap banget!';
  else reaction = '👑 LEGENDARY! Sempurna!';

  const bar = '█'.repeat(Math.floor(score / 10)) + '░'.repeat(10 - Math.floor(score / 10));

  await msg.reply(
    `📊 *RATE*\n\n` +
    `📝 *${thing}*\n\n` +
    `[${bar}] *${score}/100*\n\n` +
    `${reaction}`
  );
}

// ── 8. Ship ──
async function ship(msg) {
  const chat = await msg.getChat();
  const mentions = await msg.getMentions();

  if (mentions.length < 2) {
    return msg.reply(
      `💕 *SHIP / MATCH*\n\n` +
      `Tag 2 orang untuk dicek kecocokannya!\n` +
      `Contoh: \`!ship @orang1 @orang2\``
    );
  }

  const name1 = mentions[0].pushname || mentions[0].name || mentions[0].id.user;
  const name2 = mentions[1].pushname || mentions[1].name || mentions[1].id.user;

  const percentage = Math.floor(Math.random() * 101);
  let hearts, status;
  if (percentage <= 20) {
    hearts = '💔';
    status = 'Wah... kayaknya nggak cocok 😅';
  } else if (percentage <= 40) {
    hearts = '❤️‍🩹';
    status = 'Hmm... perlu usaha lebih lagi!';
  } else if (percentage <= 60) {
    hearts = '💛';
    status = 'Lumayan ada chemistry! 👀';
  } else if (percentage <= 80) {
    hearts = '💖';
    status = 'Wih cocok banget! Ada potential nih 😏';
  } else if (percentage <= 95) {
    hearts = '💕';
    status = 'MATCH BANGET! Kapan jadian?! 🔥';
  } else {
    hearts = '💘';
    status = 'SOULMATE DETECTED! Langsung nikah aja! 💍';
  }

  const bar = '❤️'.repeat(Math.floor(percentage / 10)) + '🤍'.repeat(10 - Math.floor(percentage / 10));

  await msg.reply(
    `💕 *SHIP / MATCH*\n\n` +
    `${hearts} *${name1}* × *${name2}* ${hearts}\n\n` +
    `[${bar}]\n` +
    `Kecocokan: *${percentage}%*\n\n` +
    `${status}`
  );
}

// ── 9. Siapakah ──
async function siapakah(msg, args) {
  const question = args.slice(1).join(' ');
  if (!question) {
    return msg.reply('❓ Tulis pertanyaannya!\nContoh: `!siapakah yang paling ganteng di grup ini?`');
  }

  const chat = await msg.getChat();
  if (!chat.isGroup) {
    return msg.reply('❌ Command ini hanya bisa dipakai di grup!');
  }

  const participants = chat.participants;
  const randomParticipant = participants[Math.floor(Math.random() * participants.length)];

  await msg.reply(
    `🎯 *SIAPAKAH...*\n\n` +
    `❓ _${question}_\n\n` +
    `Jawabannya adalah... 🥁🥁🥁\n\n` +
    `👉 *@${randomParticipant.id.user}* 👈`,
    undefined,
    { mentions: [randomParticipant.id._serialized] }
  );
}

// ── 10. Slot Machine ──
async function slot(msg) {
  const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '🍀', '⭐'];
  const spin = () => symbols[Math.floor(Math.random() * symbols.length)];

  const row1 = [spin(), spin(), spin()];
  const row2 = [spin(), spin(), spin()];
  const row3 = [spin(), spin(), spin()];

  // Check middle row for win
  const isJackpot = row2[0] === row2[1] && row2[1] === row2[2];
  const isTwoMatch = row2[0] === row2[1] || row2[1] === row2[2] || row2[0] === row2[2];

  let result;
  if (isJackpot && row2[0] === '7️⃣') {
    result = '🏆 *MEGA JACKPOT!!!* 🏆\n💰 Kamu menang BESAR! 💰';
  } else if (isJackpot && row2[0] === '💎') {
    result = '💎 *DIAMOND JACKPOT!* 💎\n✨ Luar biasa!';
  } else if (isJackpot) {
    result = '🎉 *JACKPOT!* 🎉\n🤑 Triple match! Hoki banget!';
  } else if (isTwoMatch) {
    result = '😊 *Dapet 2 sama!*\nLumayan, coba lagi! 🎰';
  } else {
    result = '😤 *Zonk!*\nNasib... coba lagi yuk! 💪';
  }

  await msg.reply(
    `🎰 *SLOT MACHINE*\n\n` +
    `┌──────────┐\n` +
    `│ ${row1[0]} │ ${row1[1]} │ ${row1[2]} │\n` +
    `│──────────│\n` +
    `│ ${row2[0]} │ ${row2[1]} │ ${row2[2]} │ ◀️\n` +
    `│──────────│\n` +
    `│ ${row3[0]} │ ${row3[1]} │ ${row3[2]} │\n` +
    `└──────────┘\n\n` +
    `${result}`
  );
}

// ── 11. Trivia ──
async function trivia(msg) {
  const q = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
  const choiceText = q.choices.join('\n');

  await msg.reply(
    `🧠 *TRIVIA QUIZ*\n\n` +
    `❓ ${q.q}\n\n` +
    `${choiceText}\n\n` +
    `_Balas dengan huruf jawabannya (A/B/C/D)_\n\n` +
    `||Jawaban: *${q.answer}* — ${q.choices.find(c => c.startsWith(q.answer)).slice(3)}||`
  );
}

// ── 12. Meme / Jokes ──
async function meme(msg) {
  const m = memeTexts[Math.floor(Math.random() * memeTexts.length)];
  await msg.reply(`😂 *MEME HARI INI*\n\n${m}`);
}

// ── 13. Roast ──
async function roast(msg) {
  const mentions = await msg.getMentions();
  const r = roastTexts[Math.floor(Math.random() * roastTexts.length)];

  if (mentions.length > 0) {
    const target = mentions[0];
    const name = target.pushname || target.name || target.id.user;
    await msg.reply(
      `🔥 *ROAST*\n\n` +
      `@${target.id.user}, ${r}\n\n` +
      `_⚠️ Cuma bercanda ya, jangan baper! 😂_`,
      undefined,
      { mentions: [target.id._serialized] }
    );
  } else {
    await msg.reply(
      `🔥 *ROAST*\n\n` +
      `${r}\n\n` +
      `_💡 Tip: Tag seseorang buat roast! \`!roast @orangnya\`_`
    );
  }
}

// ── 14. Puisi / Pantun ──
async function puisi(msg) {
  const p = puisiTexts[Math.floor(Math.random() * puisiTexts.length)];
  await msg.reply(p);
}

// ── 15. Zodiak ──
async function zodiak(msg, args) {
  const sign = args[1]?.toLowerCase();

  if (!sign || !zodiacData[sign]) {
    const list = Object.entries(zodiacData)
      .map(([k, v]) => `${v.emoji} \`!zodiak ${k}\``)
      .join('\n');
    return msg.reply(
      `🔮 *RAMALAN ZODIAK*\n\n` +
      `Pilih zodiakmu:\n\n${list}`
    );
  }

  const data = zodiacData[sign];
  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const cinta = pickRandom(zodiacFortunes.cinta);
  const karir = pickRandom(zodiacFortunes.karir);
  const uang = pickRandom(zodiacFortunes.keuangan);
  const sehat = pickRandom(zodiacFortunes.kesehatan);

  const luckyNum = Math.floor(Math.random() * 100) + 1;
  const luckyColors = ['Merah', 'Biru', 'Hijau', 'Kuning', 'Ungu', 'Pink', 'Emas', 'Putih'];
  const luckyColor = luckyColors[Math.floor(Math.random() * luckyColors.length)];
  const moodLevel = Math.floor(Math.random() * 5) + 1;
  const moodBar = '⭐'.repeat(moodLevel) + '☆'.repeat(5 - moodLevel);

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'Asia/Jakarta'
  });

  await msg.reply(
    `🔮 *RAMALAN ZODIAK*\n\n` +
    `${data.emoji} *${sign.toUpperCase()}*\n` +
    `📅 ${data.periode} | ${data.elemen}\n` +
    `🗓️ _${today}_\n\n` +
    `❤️ *Cinta:* ${cinta}\n\n` +
    `💼 *Karir:* ${karir}\n\n` +
    `💰 *Keuangan:* ${uang}\n\n` +
    `🏥 *Kesehatan:* ${sehat}\n\n` +
    `───────────────\n` +
    `🔢 Angka keberuntungan: *${luckyNum}*\n` +
    `🎨 Warna keberuntungan: *${luckyColor}*\n` +
    `😊 Mood: [${moodBar}]`
  );
}

// ═══════════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
  // Original
  dice, flip, randomQuote, calculator, ping,
  // New games
  rps, tebakAngka, truth, dare, tod, eightBall, rate, ship,
  siapakah, slot, trivia, meme, roast, puisi, zodiak,
};
