const { getGroupData, saveGroupData } = require('./admin');

function initMatches(groupData) {
  if (!groupData.matches) {
    groupData.matches = { 1: [], 2: [], 3: [] };
  }
  if (!groupData.warTitle) {
    groupData.warTitle = '';
  }
}

async function createWar(client, msg, args) {
  const chat = await msg.getChat();
  const groupData = getGroupData(chat.id._serialized);
  
  if (args.length < 2) {
    return msg.reply('❌ Format salah!\nContoh: *!createwar Sparing vs Guild Sebelah*');
  }
  
  const title = args.slice(1).join(' ');
  
  // Reset pertandingan dan simpan judul
  groupData.matches = { 1: [], 2: [], 3: [] };
  groupData.warTitle = title;
  saveGroupData(chat.id._serialized, groupData);
  
  // Siapkan hidetag ke semua member
  const participants = chat.participants;
  let mentionIds = [];
  participants.forEach(p => mentionIds.push(p.id._serialized));
  
  const announcementText = 
    `╔══════════════════════╗\n` +
    `║  📢 *OPEN MATCH: CIRCLE WAR* ║\n` +
    `╚══════════════════════╝\n\n` +
    `⚔️ *${title.toUpperCase()}*\n\n` +
    `Silakan list nama kalian sekarang!\n` +
    `» Ketik \`!joinmatch 1\` untuk Match 1\n` +
    `» Ketik \`!joinmatch 2\` untuk Match 2\n` +
    `» Ketik \`!joinmatch 3\` untuk Match 3\n\n` +
    `Cek status antrean: \`!listmatch\`\n` +
    `━━━━━━━━━━━━━━━━━━━━━━`;
  
  await chat.sendMessage(announcementText, { mentions: mentionIds });
}

async function startWar(client, msg) {
  const chat = await msg.getChat();
  const groupData = getGroupData(chat.id._serialized);
  initMatches(groupData);
  
  let playerIds = new Set(); // Pakai Set untuk menghindari tag ganda
  
  for (let i = 1; i <= 3; i++) {
    groupData.matches[i].forEach(id => playerIds.add(id));
  }
  
  if (playerIds.size === 0) {
    return msg.reply('❌ Belum ada player yang join di match mana pun!');
  }
  
  const titleText = groupData.warTitle ? `*${groupData.warTitle.toUpperCase()}*` : '*WAR*';
  const mentionIds = Array.from(playerIds);
  
  const alertText = 
    `╔══════════════════════╗\n` +
    `║  🔥 *MATCH WILL START!*   ║\n` +
    `╚══════════════════════╝\n\n` +
    `⚔️ ${titleText} akan segera dimulai!\n\n` +
    `Bagi para player yang sudah terdaftar di list, harap segera *login/standby* di in-game sekarang juga!\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━`;
  
  await chat.sendMessage(alertText, { mentions: mentionIds });
}

async function joinMatch(msg, args) {
  const chat = await msg.getChat();
  const contact = await msg.getContact();
  const senderId = contact.id._serialized;
  
  if (!args[1]) {
    return msg.reply('❌ Format salah!\nContoh: *!joinmatch 1* (Pilih match 1, 2, atau 3)');
  }
  
  const matchNum = parseInt(args[1]);
  if (![1, 2, 3].includes(matchNum)) {
    return msg.reply('❌ Pilih Match 1, 2, atau 3!');
  }
  
  const groupData = getGroupData(chat.id._serialized);
  initMatches(groupData);
  
  // Periksa apakah user sudah ada di match tersebut
  if (groupData.matches[matchNum].includes(senderId)) {
    return msg.reply(`⚠️ Kamu sudah join di *Match ${matchNum}*!`);
  }
  
  // Periksa batas maksimal (4)
  if (groupData.matches[matchNum].length >= 4) {
    return msg.reply(`❌ *Match ${matchNum} penuh!* (Sudah ruang 4/4). Coba cari match lain.`);
  }
  
  // Tambahkan user
  groupData.matches[matchNum].push(senderId);
  saveGroupData(chat.id._serialized, groupData);
  
  await msg.reply(`✅ Berhasil join di *Match ${matchNum}*! (${groupData.matches[matchNum].length}/4)`);
}

async function leaveMatch(msg, args) {
  const chat = await msg.getChat();
  const contact = await msg.getContact();
  const senderId = contact.id._serialized;
  
  if (!args[1]) {
    return msg.reply('❌ Format salah!\nContoh: *!leavematch 1* (Pilih match 1, 2, atau 3)');
  }
  
  const matchNum = parseInt(args[1]);
  if (![1, 2, 3].includes(matchNum)) {
    return msg.reply('❌ Pilih Match 1, 2, atau 3!');
  }
  
  const groupData = getGroupData(chat.id._serialized);
  initMatches(groupData);
  
  const index = groupData.matches[matchNum].indexOf(senderId);
  if (index === -1) {
    return msg.reply(`⚠️ Kamu belum join di *Match ${matchNum}*.`);
  }
  
  groupData.matches[matchNum].splice(index, 1);
  saveGroupData(chat.id._serialized, groupData);
  
  await msg.reply(`✅ Berhasil keluar dari *Match ${matchNum}*! (${groupData.matches[matchNum].length}/4)`);
}

async function listMatch(client, msg) {
  const chat = await msg.getChat();
  const groupData = getGroupData(chat.id._serialized);
  initMatches(groupData);
  
  let titleStr = groupData.warTitle ? `*MATCH: ${groupData.warTitle.toUpperCase()}*` : '*LIST MATCH CIRCLE WAR*';
  let result = `⚔️ ${titleStr} ⚔️\n`;
  let mentions = [];
  
  for (let i = 1; i <= 3; i++) {
    result += `\n*Match ${i} (${groupData.matches[i].length}/4)*\n`;
    if (groupData.matches[i].length === 0) {
      result += '  (Kosong)\n';
    } else {
      groupData.matches[i].forEach((id, idx) => {
        result += `  ${idx + 1}. @${id.split('@')[0]}\n`;
        mentions.push(id);
      });
    }
  }
  
  result += '\n💡 _Gunakan !joinmatch <1-3> untuk join_';
  result += '\n💡 _Gunakan !leavematch <1-3> untuk keluar_';
  
  await chat.sendMessage(result, { mentions });
}

async function resetMatch(msg) {
  const chat = await msg.getChat();
  const groupData = getGroupData(chat.id._serialized);
  
  // Reset all matches and title
  groupData.matches = { 1: [], 2: [], 3: [] };
  groupData.warTitle = '';
  saveGroupData(chat.id._serialized, groupData);
  
  await msg.reply('🧹 *Semua daftar Match berhasil direset!*');
}

module.exports = { createWar, joinMatch, leaveMatch, listMatch, startWar, resetMatch };
