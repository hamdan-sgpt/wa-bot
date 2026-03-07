const { getGroupData, saveGroupData } = require('./admin');

function initMatches(groupData) {
  if (!groupData.activeWars) {
    // Migration from old format: ignore old matches structure and start fresh
    groupData.activeWars = {};
  }
  if (typeof groupData.nextWarId !== 'number') {
    groupData.nextWarId = 1;
  }
}

async function createWar(client, msg, args) {
  const chat = await msg.getChat();
  const groupData = getGroupData(chat.id._serialized);
  initMatches(groupData);
  
  if (args.length < 2) {
    return msg.reply('❌ Format salah!\nContoh: *!createwar Sparing vs Guild Sebelah*');
  }
  
  const title = args.slice(1).join(' ');
  const newWarId = groupData.nextWarId;
  
  // Create the new war structure
  groupData.activeWars[newWarId] = {
    title: title,
    matches: { 1: [], 2: [], 3: [] }
  };
  
  // Increment counter for next time
  groupData.nextWarId++;
  saveGroupData(chat.id._serialized, groupData);
  
  // Siapkan hidetag ke semua member
  const participants = chat.participants;
  let mentionIds = [];
  participants.forEach(p => mentionIds.push(p.id._serialized));
  
  const announcementText = 
    `╔══════════════════════╗\n` +
    `║  📢 *OPEN MATCH: CIRCLE WAR* ║\n` +
    `╚══════════════════════╝\n\n` +
    `⚔️ *${title.toUpperCase()}*\n` +
    `ID WAR: *${newWarId}*\n\n` +
    `Silakan list nama kalian sekarang!\n` +
    `» Ketik \`!joinmatch ${newWarId} 1\` untuk Match 1\n` +
    `» Ketik \`!joinmatch ${newWarId} 2\` untuk Match 2\n` +
    `» Ketik \`!joinmatch ${newWarId} 3\` untuk Match 3\n\n` +
    `Cek status antrean: \`!listmatch\`\n` +
    `━━━━━━━━━━━━━━━━━━━━━━`;
  
  await chat.sendMessage(announcementText, { mentions: mentionIds });
}

async function startWar(client, msg, args) {
  const chat = await msg.getChat();
  const groupData = getGroupData(chat.id._serialized);
  initMatches(groupData);
  
  if (!args[1]) {
    return msg.reply('❌ Format salah!\nContoh: *!startwar 1* (Ganti 1 dengan ID War yang ingin di-start)');
  }
  
  const warId = args[1];
  const war = groupData.activeWars[warId];
  
  if (!war) {
    return msg.reply(`❌ War dengan ID *${warId}* tidak ditemukan atau belum dibuat.`);
  }
  
  let playerIds = new Set(); // Pakai Set untuk menghindari tag ganda
  
  for (let i = 1; i <= 3; i++) {
    war.matches[i].forEach(id => playerIds.add(id));
  }
  
  if (playerIds.size === 0) {
    return msg.reply(`❌ Belum ada player yang join di *War ${warId}*!`);
  }
  
  const titleText = `*${war.title.toUpperCase()}*`;
  const mentionIds = Array.from(playerIds);
  
  const alertText = 
    `╔══════════════════════╗\n` +
    `║  🔥 *MATCH WILL START!*   ║\n` +
    `╚══════════════════════╝\n\n` +
    `⚔️ ${titleText}\n` +
    `Akan segera dimulai!\n\n` +
    `Bagi para player yang sudah terdaftar di list War ${warId}, harap segera *login/standby* di in-game sekarang juga!\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━`;
  
  await chat.sendMessage(alertText, { mentions: mentionIds });
}

async function joinMatch(msg, args) {
  const chat = await msg.getChat();
  const contact = await msg.getContact();
  const senderId = contact.id._serialized;
  
  if (!args[1] || !args[2]) {
    return msg.reply('❌ Format salah!\nContoh: *!joinmatch 1 2* (Ikut War 1, di Match 2)');
  }
  
  const groupData = getGroupData(chat.id._serialized);
  initMatches(groupData);
  
  const warId = args[1];
  const matchNum = parseInt(args[2]);
  
  const war = groupData.activeWars[warId];
  if (!war) {
    return msg.reply(`❌ War dengan ID *${warId}* tidak ditemukan! Bikin dulu dengan *!createwar*`);
  }
  
  if (![1, 2, 3].includes(matchNum)) {
    return msg.reply('❌ Pilih Match 1, 2, atau 3 (Argumen ke-2)!');
  }
  
  // Periksa apakah user sudah ada di match tersebut
  if (war.matches[matchNum].includes(senderId)) {
    return msg.reply(`⚠️ Kamu sudah join di *Match ${matchNum} (War ${warId})*!`);
  }
  
  // Periksa batas maksimal (4)
  if (war.matches[matchNum].length >= 4) {
    return msg.reply(`❌ *Match ${matchNum} (War ${warId}) penuh!* (4/4). Coba match lain.`);
  }
  
  // Tambahkan user
  war.matches[matchNum].push(senderId);
  saveGroupData(chat.id._serialized, groupData);
  
  await msg.reply(`✅ Berhasil join di *War ${warId} - Match ${matchNum}*! (${war.matches[matchNum].length}/4)`);
}

async function leaveMatch(msg, args) {
  const chat = await msg.getChat();
  const contact = await msg.getContact();
  const senderId = contact.id._serialized;
  
  if (!args[1] || !args[2]) {
    return msg.reply('❌ Format salah!\nContoh: *!leavematch 1 2* (Keluar War 1, dari Match 2)');
  }
  
  const groupData = getGroupData(chat.id._serialized);
  initMatches(groupData);
  
  const warId = args[1];
  const matchNum = parseInt(args[2]);
  
  const war = groupData.activeWars[warId];
  if (!war) {
    return msg.reply(`❌ War dengan ID *${warId}* tidak ditemukan!`);
  }
  
  if (![1, 2, 3].includes(matchNum)) {
    return msg.reply('❌ Pilih Match 1, 2, atau 3 (Argumen ke-2)!');
  }
  
  const index = war.matches[matchNum].indexOf(senderId);
  if (index === -1) {
    return msg.reply(`⚠️ Kamu belum join di *Match ${matchNum} (War ${warId})*.`);
  }
  
  war.matches[matchNum].splice(index, 1);
  saveGroupData(chat.id._serialized, groupData);
  
  await msg.reply(`✅ Berhasil keluar dari *War ${warId} - Match ${matchNum}*! (${war.matches[matchNum].length}/4)`);
}

async function listMatch(client, msg) {
  const chat = await msg.getChat();
  const groupData = getGroupData(chat.id._serialized);
  initMatches(groupData);
  
  const warIds = Object.keys(groupData.activeWars);
  
  if (warIds.length === 0) {
    return msg.reply('📭 _Belum ada daftar War atau Mabar yang dibuat._\nKetik `!createwar <nama>` untuk memulai.');
  }
  
  let result = '⚔️ *LIST MATCH CIRCLE WAR* ⚔️\n';
  let mentions = [];
  
  for (const warId of warIds) {
    const war = groupData.activeWars[warId];
    result += `\n📍 *ID War: ${warId}*\n`;
    result += `📌 *${war.title.toUpperCase()}*\n`;
    result += `━━━━━━━━━━━━━━━━━━\n`;
    
    for (let i = 1; i <= 3; i++) {
      result += `*Match ${i} (${war.matches[i].length}/4)*\n`;
      if (war.matches[i].length === 0) {
        result += '  (Kosong)\n';
      } else {
        war.matches[i].forEach((id, idx) => {
          result += `  ${idx + 1}. @${id.split('@')[0]}\n`;
          mentions.push(id);
        });
      }
    }
  }
  
  result += '\n💡 _Utk Gabung:_ `!joinmatch <ID> <Match_Num>`\n';
  result += '💡 _Cth Batal:_ `!leavematch 1 2` (Cancel War 1 Match 2)';
  
  await chat.sendMessage(result, { mentions });
}

async function closeWar(msg, args) {
  const chat = await msg.getChat();
  const groupData = getGroupData(chat.id._serialized);
  initMatches(groupData);
  
  if (!args[1]) {
    return msg.reply('❌ Format salah! Pilih ID War yang akan ditutup/dihapus.\nContoh: *!closewar 1*');
  }
  
  const warId = args[1];
  
  if (!groupData.activeWars[warId]) {
    return msg.reply(`❌ War dengan ID *${warId}* tidak ada atau sudah dihapus.`);
  }
  
  delete groupData.activeWars[warId];
  saveGroupData(chat.id._serialized, groupData);
  
  await msg.reply(`🧹 *War dengan ID ${warId} berhasil ditutup dan dihapus dari list.*`);
}

async function resetMatch(msg) {
  const chat = await msg.getChat();
  const groupData = getGroupData(chat.id._serialized);
  
  // Reset all wars completely
  groupData.activeWars = {};
  groupData.nextWarId = 1;
  saveGroupData(chat.id._serialized, groupData);
  
  await msg.reply('🧹 *Semua daftar War berhasil di-reset sepenuhnya!*');
}

module.exports = { createWar, joinMatch, leaveMatch, listMatch, startWar, closeWar, resetMatch };
