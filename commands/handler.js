const config = require('../config');
const { adminCommands, getGroupData, saveGroupData } = require('./group/admin');
const { tagAll, tagAdmin, tagGroup } = require('./group/tagall');
const { handleAntiLink } = require('./group/antilink');
const { handleAntiSpam } = require('./group/antispam');
const { addBabu, listBabu, delBabu, addBabuNote } = require('./group/babu');
const { aiChat, aiCharge, aiCredits, aiReset } = require('./fun/ai');
const { dice, flip, randomQuote, calculator, ping } = require('./fun/games');
const { toSticker, toImage } = require('./fun/sticker');
const { tiktokVideo, tiktokAudio } = require('./fun/tiktok');
const { bratSticker } = require('./fun/brat');
const { showHelp } = require('./info/help');
const { showIntro } = require('./info/intro');
const { runtime, botInfo } = require('./info/runtime');
const { hasRole, claimRole, addRole, delRole, setRole, removeRole, roleInfo, myRole } = require('./info/roles');

const prefix = config.prefix;

// Group commands that need special handling
const groupAdminCommands = [
  'kick', 'remove', 'add', 'promote', 'demote', 'mute', 'unmute',
  'setname', 'setdesc', 'link', 'revoke', 'antilink', 'antispam',
  'setwelcome', 'setbye', 'welcome', 'adminonly',
];

async function handleMessage(client, msg) {
  // Ignore status broadcasts
  if (msg.from === 'status@broadcast') return;

  const chat = await msg.getChat();
  const contact = await msg.getContact();
  const isGroup = chat.isGroup;
  const body = msg.body || '';

  // ── AUTO-PROTECTION (runs before command check) ──
  if (isGroup) {
    const groupData = getGroupData(chat.id._serialized);

    // Anti-link check
    if (groupData.antiLink && await handleAntiLink(client, msg, groupData)) return;

    // Anti-spam check
    if (groupData.antiSpam && await handleAntiSpam(client, msg, groupData)) return;
  }

  // ── COMMAND CHECK ──
  if (!body.startsWith(prefix)) return;

  const args = body.slice(prefix.length).trim().split(/\s+/);
  const cmd = args[0]?.toLowerCase();

  if (!cmd) return;

  const senderId = contact.id._serialized;
  const isOwner = require('../config').owners.includes(senderId);

  // ── ROLE CLAIM CHECK ──
  // Commands that can be executed without claiming a role
  const exemptCommands = ['claim', 'claimrole', 'help', 'menu', 'bantuan', 'start', 'intro'];
  
  if (!isOwner && !exemptCommands.includes(cmd)) {
    if (!await hasRole(senderId)) {
      return msg.reply(
        `⛔ *Akses Ditolak!*\n\n` +
        `Kamu belum terdaftar di sistem bot ini.\n` +
        `Silakan ketik \`!claim\` untuk mendapatkan role dan mulai menggunakan bot.`
      );
    }
  }

  const groupData = isGroup ? getGroupData(chat.id._serialized) : null;

  // ── GROUP ADMIN COMMANDS ──
  if (groupAdminCommands.includes(cmd)) {
    if (!isGroup) return msg.reply('❌ Perintah ini hanya bisa digunakan di dalam grup!');
    await adminCommands(client, msg, args, groupData, chat, contact);
    return;
  }

  // ── ADMIN-ONLY CHECK for non-admin commands ──
  if (isGroup && groupData) {
    const adminOnlyList = groupData.adminOnly || [];
    if (adminOnlyList.includes(cmd)) {
      const sender = await msg.getContact();
      const senderParticipant = participants.find(p => p.id._serialized === senderId);
      const isAdmin = senderParticipant?.isAdmin || senderParticipant?.isSuperAdmin || isOwner;

      if (!isAdmin) {
        return msg.reply(`🔒 Command \`!${cmd}\` hanya bisa dipakai oleh *admin*!`);
      }
    }
  }

  // ── TAG ALL ──
  if (cmd === 'tagall' || cmd === 'everyone') {
    if (!isGroup) return msg.reply('❌ Perintah ini hanya bisa digunakan di dalam grup!');
    await tagAll(client, msg, args);
    return;
  }

  // ── TAG ADMIN ──
  if (cmd === 'tagadmin' || cmd === 'admin') {
    if (!isGroup) return msg.reply('❌ Perintah ini hanya bisa digunakan di dalam grup!');
    await tagAdmin(client, msg, args);
    return;
  }

  // ── TAG GROUP (BROADCAST) ──
  if (cmd === 'taggroup' || cmd === 'bcgroup') {
    await tagGroup(client, msg, args);
    return;
  }

  // ── BABU LIST COMMANDS ──
  if (['addbabu', 'listbabu', 'delbabu', 'notebabu'].includes(cmd)) {
    if (!isGroup) return msg.reply('❌ Perintah ini hanya bisa digunakan di dalam grup!');
    switch (cmd) {
      case 'addbabu': await addBabu(client, msg, args); break;
      case 'listbabu': await listBabu(client, msg); break;
      case 'delbabu': await delBabu(client, msg, args); break;
      case 'notebabu': await addBabuNote(client, msg, args); break;
    }
    return;
  }

  // ── FUN COMMANDS ──
  switch (cmd) {
    case 'sticker':
    case 's':
      await toSticker(client, msg);
      break;

    case 'toimg':
    case 'toimage':
      await toImage(client, msg);
      break;

    case 'brat':
      await bratSticker(msg, args);
      break;

    case 'ai':
      await aiChat(msg, args);
      break;

    case 'aireset':
      await aiReset(msg);
      break;

    case 'aicharge':
    case 'aicas':
      await aiCharge(client, msg, args);
      break;

    case 'aikredit':
    case 'aisaldo':
      await aiCredits(msg);
      break;

    case 'dice':
      await dice(msg);
      break;

    case 'flip':
      await flip(msg);
      break;

    case 'quote':
      await randomQuote(msg);
      break;

    case 'calc':
    case 'hitung':
      await calculator(msg, args);
      break;

    case 'ping':
      await ping(client, msg);
      break;

    // ── TIKTOK DOWNLOADER ──
    case 'tt':
    case 'tiktok':
      await tiktokVideo(msg, args);
      break;

    case 'ttaudio':
    case 'tta':
      await tiktokAudio(msg, args);
      break;

    // ── INFO COMMANDS ──
    case 'help':
    case 'menu':
    case 'bantuan':
      await showHelp(msg, args);
      break;

    case 'start':
    case 'intro':
      await showIntro(client, msg);
      break;

    case 'runtime':
    case 'uptime':
      await runtime(msg);
      break;

    case 'info':
      await botInfo(client, msg);
      break;

    // ── ROLE COMMANDS ──
    case 'claim':
    case 'claimrole':
      await claimRole(msg);
      break;
    case 'addrole':
      await addRole(msg, args);
      break;
    case 'delrole':
      await delRole(msg, args);
      break;
    case 'setrole':
      await setRole(msg, args);
      break;
    case 'removerole':
      await removeRole(msg, args);
      break;
    case 'roleinfo':
    case 'roles':
      await roleInfo(msg);
      break;
    case 'myrole':
      await myRole(msg);
      break;

    default:
      // Unknown command — silently ignore or optionally respond
      // await msg.reply(`❓ Perintah tidak dikenal. Ketik ${prefix}help untuk melihat daftar perintah.`);
      break;
  }
}

async function handleGroupJoin(client, notification) {
  try {
    const group = await notification.getChat();
    const groupData = getGroupData(group.id._serialized);

    if (!groupData.welcome) return;

    const addedMembers = notification.recipientIds;
    for (const memberId of addedMembers) {
      const contact = await client.getContactById(memberId);
      const welcomeMsg = groupData.welcomeMsg
        .replace('@user', `@${contact.id.user}`)
        .replace('@group', group.name);

      await group.sendMessage(welcomeMsg, { mentions: [contact.id._serialized] });
    }
  } catch (err) {
    console.error('Welcome error:', err.message);
  }
}

async function handleGroupLeave(client, notification) {
  try {
    const group = await notification.getChat();
    const groupData = getGroupData(group.id._serialized);

    if (!groupData.goodbye) return;

    const removedMembers = notification.recipientIds;
    for (const memberId of removedMembers) {
      const contact = await client.getContactById(memberId);
      const byeMsg = groupData.goodbyeMsg
        .replace('@user', `@${contact.id.user}`)
        .replace('@group', group.name);

      await group.sendMessage(byeMsg, { mentions: [contact.id._serialized] });
    }
  } catch (err) {
    console.error('Goodbye error:', err.message);
  }
}

module.exports = { handleMessage, handleGroupJoin, handleGroupLeave };
