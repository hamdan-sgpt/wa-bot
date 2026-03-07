const { getGroupData, saveGroupData } = require('./admin');

function initMatches(groupData) {
  if (!groupData.matches) {
    groupData.matches = { 1: [], 2: [], 3: [] };
  }
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
  
  let result = '⚔️ *LIST MATCH CIRCLE WAR* ⚔️\n';
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
  
  // Reset all matches
  groupData.matches = { 1: [], 2: [], 3: [] };
  saveGroupData(chat.id._serialized, groupData);
  
  await msg.reply('🧹 *Semua daftar Match berhasil direset!*');
}

module.exports = { joinMatch, leaveMatch, listMatch, resetMatch };
