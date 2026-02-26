const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../../config');
const fs   = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

// ── Riwayat chat per user ──
const chatHistory = {};

// ── File kredit ──
const CREDIT_FILE = path.join(__dirname, '../../data/ai_credits.json');

function loadCredits() {
  if (!fs.existsSync(CREDIT_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(CREDIT_FILE, 'utf8')); } catch { return {}; }
}

function saveCredits(data) {
  fs.writeFileSync(CREDIT_FILE, JSON.stringify(data, null, 2));
}

function getUser(credits, userId) {
  if (!credits[userId]) {
    credits[userId] = {
      balance: config.aiCredits.defaultCredits,
      lastReset: new Date().toDateString(),
      totalUsed: 0,
    };
  }
  return credits[userId];
}

function checkDailyReset(user) {
  if (!config.aiCredits.dailyReset) return;
  const today = new Date().toDateString();
  if (user.lastReset !== today) {
    user.balance   = config.aiCredits.defaultCredits;
    user.lastReset = today;
  }
}

// ─────────────────────────────────────────
async function aiChat(msg, args) {
  if (!config.aiEnabled) {
    return msg.reply('❌ Fitur AI belum diaktifkan.');
  }

  const sender   = await msg.getContact();
  const userId   = sender.id._serialized;
  const isOwner  = config.owners.includes(userId);
  
  // Cek apakah user adalah admin jika di dalam grup
  const chat = await msg.getChat();
  let isAdmin = false;
  if (chat.isGroup) {
    const participant = chat.participants.find(p => p.id._serialized === userId);
    isAdmin = participant?.isAdmin || participant?.isSuperAdmin;
  }
  
  const isUnlimited = isOwner || isAdmin;
  
  const prompt   = args.slice(1).join(' ').trim();

  if (!prompt) {
    return msg.reply('❌ Masukkan pertanyaan!\nContoh: `!ai siapa presiden Indonesia?`');
  }

  // ── Cek & kurangi kredit ──
  if (config.aiCredits.enabled && !isUnlimited) {
    const credits = loadCredits();
    const user    = getUser(credits, userId);
    checkDailyReset(user);

    if (user.balance <= 0) {
      return msg.reply(
        `❌ *Kredit AI kamu habis!*\n\n` +
        `💳 Kredit: *0*\n` +
        `📅 Reset otomatis setiap hari\n\n` +
        `_Hubungi admin untuk charge kredit:_\n` +
        `_!aicharge @kamu [jumlah]_`
      );
    }

    user.balance--;
    user.totalUsed++;
    saveCredits(credits);

    // Sisa kredit sedikit → warning
    if (user.balance === 3) {
      await msg.reply(`⚠️ Kredit AI kamu tinggal *3* lagi!`);
    }
  }

  // ── Kirim ke Gemini ──
  if (!chatHistory[userId]) chatHistory[userId] = [];

  try {
    await msg.reply('🤖 Sedang memproses...');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    chatHistory[userId].push({ role: 'user', parts: [{ text: prompt }] });

    const chat = model.startChat({
      history: chatHistory[userId].slice(0, -1),
      systemInstruction: {
        role: 'system',
        parts: [{ text: `Kamu adalah asisten AI yang helpful, ramah, dan berbicara dalam bahasa Indonesia. Nama kamu adalah ${config.botName}. Jawab informatif tapi singkat dan mudah dipahami. Tolak pertanyaan berbahaya dengan sopan.` }],
      },
    });

    // Retry logic untuk rate limit (429)
    let result;
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        result = await chat.sendMessage(prompt);
        break; // berhasil, keluar loop
      } catch (retryErr) {
        const is429 = retryErr.message?.includes('429') || retryErr.status === 429;
        if (is429 && attempt < maxRetries) {
          const waitSec = attempt * 15; // 15s, 30s, 45s
          console.log(`Rate limited, retry ${attempt}/${maxRetries} in ${waitSec}s...`);
          await new Promise(r => setTimeout(r, waitSec * 1000));
        } else {
          throw retryErr; // lempar ke catch utama
        }
      }
    }

    const response = result.response.text();

    chatHistory[userId].push({ role: 'model', parts: [{ text: response }] });
    if (chatHistory[userId].length > 20) {
      chatHistory[userId] = chatHistory[userId].slice(-20);
    }

    // Tampilkan sisa kredit di response (kecuali owner/admin)
    let creditInfo = '';
    if (config.aiCredits.enabled && !isUnlimited) {
      const credits = loadCredits();
      const user    = getUser(credits, userId);
      creditInfo    = `\n\n_💳 Kredit tersisa: ${user.balance}_`;
    }

    await msg.reply(`🤖 *${config.botName} AI:*\n\n${response}${creditInfo}`);

  } catch (err) {
    console.error('AI Error:', err.message);
    // Kembalikan kredit jika error
    if (config.aiCredits.enabled && !isUnlimited) {
      const credits = loadCredits();
      const user    = getUser(credits, userId);
      user.balance++;
      user.totalUsed = Math.max(0, user.totalUsed - 1);
      saveCredits(credits);
    }
    delete chatHistory[userId];

    // Pesan error yang ramah untuk rate limit / kuota habis
    const is429 = err.message?.includes('429') || err.message?.includes('quota');
    if (is429) {
      await msg.reply(
        `⏳ *Kuota API AI sedang habis!*\n\n` +
        `Coba lagi nanti dalam beberapa menit.\n` +
        `_Jika terus error, hubungi admin bot._`
      );
    } else {
      await msg.reply(`❌ AI Error: _${err.message}_`);
    }
  }
}

// ── Charge kredit user (owner only) ──
async function aiCharge(client, msg, args) {
  const sender  = await msg.getContact();
  const isOwner = config.owners.includes(sender.id._serialized);
  if (!isOwner) return msg.reply('❌ Perintah ini hanya untuk owner bot!');

  const mentioned = await msg.getMentions();
  const amount    = parseInt(args[2]) || parseInt(args[1]);

  if (!mentioned.length || !amount || amount <= 0) {
    return msg.reply(
      '❌ Format salah!\n\n' +
      'Gunakan: `!aicharge @user [jumlah]`\n' +
      'Contoh: `!aicharge @julia 20`'
    );
  }

  const credits = loadCredits();
  for (const target of mentioned) {
    const targetId = target.id._serialized;
    const user     = getUser(credits, targetId);
    checkDailyReset(user);
    user.balance = Math.min(user.balance + amount, config.aiCredits.maxCredits);
    await msg.reply(
      `✅ *Kredit AI berhasil di-charge!*\n\n` +
      `👤 User: @${target.id.user}\n` +
      `💳 Ditambahkan: +${amount}\n` +
      `💰 Total sekarang: *${user.balance}*`,
      undefined,
      { mentions: [targetId] }
    );
  }
  saveCredits(credits);
}

// ── Cek kredit sendiri ──
async function aiCredits(msg) {
  const sender  = await msg.getContact();
  const userId  = sender.id._serialized;
  const isOwner = config.owners.includes(userId);

  if (isOwner) return msg.reply('👑 Kamu adalah *owner bot* — tidak ada limit kredit!');

  const credits = loadCredits();
  const user    = getUser(credits, userId);
  checkDailyReset(user);
  saveCredits(credits);

  await msg.reply(
    `💳 *Info Kredit AI Kamu*\n\n` +
    `💰 Kredit tersisa: *${user.balance}*\n` +
    `📊 Total digunakan: ${user.totalUsed}x\n` +
    `📅 Reset: Setiap hari otomatis\n\n` +
    `_Kredit habis? Minta admin: !aicharge @kamu [jumlah]_`
  );
}

// ── Reset riwayat chat ──
async function aiReset(msg) {
  const sender = await msg.getContact();
  delete chatHistory[sender.id._serialized];
  await msg.reply('✅ Riwayat percakapan AI kamu sudah di-reset!');
}

module.exports = { aiChat, aiCharge, aiCredits, aiReset };
