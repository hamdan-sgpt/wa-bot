const { evaluate } = require('mathjs');

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

module.exports = { dice, flip, randomQuote, calculator, ping };
