const config = require('../../config');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Load or init per-group settings
function getGroupData(groupId) {
  const filePath = path.join(DATA_DIR, `${groupId}.json`);
  if (!fs.existsSync(filePath)) {
    const defaults = {
      antiLink: config.features.antiLink,
      antiSpam: config.features.antiSpam,
      welcome: config.features.welcome,
      goodbye: config.features.goodbye,
      welcomeMsg: '👋 Selamat datang @user di grup *@group*!',
      goodbyeMsg: '👋 Sampai jumpa @user, selamat tinggal!',
      warns: {},
    };
    fs.writeFileSync(filePath, JSON.stringify(defaults, null, 2));
    return defaults;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveGroupData(groupId, data) {
  const filePath = path.join(DATA_DIR, `${groupId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function adminCommands(client, msg, args, groupData, chat, contact) {
  const cmd = args[0].toLowerCase();
  const group = await msg.getChat();
  const sender = await msg.getContact();
  const senderNumber = sender.id._serialized;
  const isOwner = config.owners.includes(senderNumber);

  // Check if sender is admin
  const participants = group.participants;
  const senderParticipant = participants.find(p => p.id._serialized === senderNumber);
  const isAdmin = senderParticipant?.isAdmin || senderParticipant?.isSuperAdmin || isOwner;

  if (!isAdmin) {
    return msg.reply('❌ Perintah ini hanya untuk admin grup!');
  }

  switch (cmd) {
    case 'kick':
    case 'remove': {
      const mentioned = await msg.getMentions();
      if (!mentioned.length) return msg.reply('❌ Tag member yang ingin di-kick!\nContoh: !kick @user');
      for (const m of mentioned) {
        try {
          await group.removeParticipants([m.id._serialized]);
          await msg.reply(`✅ *${m.pushname || m.number}* berhasil di-kick dari grup.`);
        } catch {
          await msg.reply(`❌ Gagal kick *${m.pushname || m.number}*. Pastikan bot adalah admin.`);
        }
      }
      break;
    }
    case 'add': {
      const number = args[1];
      if (!number) return msg.reply('❌ Masukkan nomor!\nContoh: !add 628123456789');
      const formatted = number.includes('@c.us') ? number : `${number.replace(/[^0-9]/g, '')}@c.us`;
      try {
        await group.addParticipants([formatted]);
        await msg.reply(`✅ *${number}* berhasil ditambahkan ke grup.`);
      } catch {
        await msg.reply(`❌ Gagal menambahkan *${number}*. Mungkin nomor tidak valid atau privasi kontaknya diblokir.`);
      }
      break;
    }
    case 'promote': {
      const mentioned = await msg.getMentions();
      if (!mentioned.length) return msg.reply('❌ Tag member yang ingin dijadikan admin!\nContoh: !promote @user');
      for (const m of mentioned) {
        try {
          await group.promoteParticipants([m.id._serialized]);
          await msg.reply(`✅ *${m.pushname || m.number}* sekarang menjadi admin grup.`);
        } catch {
          await msg.reply(`❌ Gagal promote *${m.pushname || m.number}*.`);
        }
      }
      break;
    }
    case 'demote': {
      const mentioned = await msg.getMentions();
      if (!mentioned.length) return msg.reply('❌ Tag member yang ingin dicopot adminnya!\nContoh: !demote @user');
      for (const m of mentioned) {
        try {
          await group.demoteParticipants([m.id._serialized]);
          await msg.reply(`✅ *${m.pushname || m.number}* admin-nya sudah dicabut.`);
        } catch {
          await msg.reply(`❌ Gagal demote *${m.pushname || m.number}*.`);
        }
      }
      break;
    }
    case 'mute': {
      try {
        await group.setMessagesAdminsOnly(true);
        await msg.reply('🔇 Grup berhasil di-*mute*. Hanya admin yang bisa chat.');
      } catch {
        await msg.reply('❌ Gagal mute grup. Pastikan bot adalah admin.');
      }
      break;
    }
    case 'unmute': {
      try {
        await group.setMessagesAdminsOnly(false);
        await msg.reply('🔊 Grup berhasil di-*unmute*. Semua member bisa chat.');
      } catch {
        await msg.reply('❌ Gagal unmute grup. Pastikan bot adalah admin.');
      }
      break;
    }
    case 'setname': {
      const newName = args.slice(1).join(' ');
      if (!newName) return msg.reply('❌ Masukkan nama baru!\nContoh: !setname Nama Grup Baru');
      try {
        await group.setSubject(newName);
        await msg.reply(`✅ Nama grup berhasil diubah menjadi *${newName}*.`);
      } catch {
        await msg.reply('❌ Gagal mengubah nama grup.');
      }
      break;
    }
    case 'setdesc': {
      const newDesc = args.slice(1).join(' ');
      if (!newDesc) return msg.reply('❌ Masukkan deskripsi baru!\nContoh: !setdesc Ini adalah grup kami');
      try {
        await group.setDescription(newDesc);
        await msg.reply(`✅ Deskripsi grup berhasil diubah.`);
      } catch {
        await msg.reply('❌ Gagal mengubah deskripsi grup.');
      }
      break;
    }
    case 'link': {
      try {
        const link = await group.getInviteCode();
        await msg.reply(`🔗 Link undangan grup:\nhttps://chat.whatsapp.com/${link}`);
      } catch {
        await msg.reply('❌ Gagal mendapatkan link grup.');
      }
      break;
    }
    case 'revoke': {
      try {
        await group.revokeInvite();
        await msg.reply('✅ Link undangan grup berhasil di-reset!');
      } catch {
        await msg.reply('❌ Gagal mereset link undangan.');
      }
      break;
    }
    case 'antilink': {
      const toggle = args[1]?.toLowerCase();
      if (!['on', 'off'].includes(toggle)) return msg.reply('❌ Gunakan: !antilink on atau !antilink off');
      groupData.antiLink = toggle === 'on';
      saveGroupData(group.id._serialized, groupData);
      await msg.reply(`🛡️ Anti-link berhasil *${toggle === 'on' ? 'diaktifkan' : 'dinonaktifkan'}*!`);
      break;
    }
    case 'antispam': {
      const toggle = args[1]?.toLowerCase();
      if (!['on', 'off'].includes(toggle)) return msg.reply('❌ Gunakan: !antispam on atau !antispam off');
      groupData.antiSpam = toggle === 'on';
      saveGroupData(group.id._serialized, groupData);
      await msg.reply(`🛡️ Anti-spam berhasil *${toggle === 'on' ? 'diaktifkan' : 'dinonaktifkan'}*!`);
      break;
    }
    case 'setwelcome': {
      const welcomeMsg = args.slice(1).join(' ');
      if (!welcomeMsg) return msg.reply('❌ Masukkan pesan welcome!\nVariabel: @user, @group\nContoh: !setwelcome Halo @user, selamat datang di @group!');
      groupData.welcomeMsg = welcomeMsg;
      saveGroupData(group.id._serialized, groupData);
      await msg.reply(`✅ Pesan welcome diubah:\n${welcomeMsg}`);
      break;
    }
    case 'setbye': {
      const byeMsg = args.slice(1).join(' ');
      if (!byeMsg) return msg.reply('❌ Masukkan pesan goodbye!\nVariabel: @user, @group\nContoh: !setbye Selamat tinggal @user!');
      groupData.goodbyeMsg = byeMsg;
      saveGroupData(group.id._serialized, groupData);
      await msg.reply(`✅ Pesan goodbye diubah:\n${byeMsg}`);
      break;
    }
    case 'welcome': {
      const toggle = args[1]?.toLowerCase();
      if (!['on', 'off'].includes(toggle)) return msg.reply('❌ Gunakan: !welcome on atau !welcome off');
      groupData.welcome = toggle === 'on';
      saveGroupData(group.id._serialized, groupData);
      await msg.reply(`👋 Fitur welcome *${toggle === 'on' ? 'diaktifkan' : 'dinonaktifkan'}*!`);
      break;
    }
    default:
      break;
  }

  return { groupData };
}

module.exports = { adminCommands, getGroupData, saveGroupData };
