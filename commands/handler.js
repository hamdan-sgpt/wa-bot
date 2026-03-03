const config = require('../config');
const { adminCommands, getGroupData, saveGroupData } = require('./group/admin');
const { tagAll, tagAdmin, tagGroup } = require('./group/tagall');
const { handleAntiLink } = require('./group/antilink');
const { handleAntiSpam } = require('./group/antispam');
const { addBabu, listBabu, delBabu, addBabuNote } = require('./group/babu');
const { aiChat, aiCharge, aiCredits, aiReset } = require('./fun/ai');
const { dice, flip, randomQuote, calculator, ping, rps, tebakAngka, truth, dare, tod, eightBall, rate, ship, siapakah, slot, trivia, meme, roast, puisi, zodiak } = require('./fun/games');
const { toSticker, toImage } = require('./fun/sticker');
const { tiktokVideo, tiktokAudio } = require('./fun/tiktok');
const { bratSticker } = require('./fun/brat');
const { generateQR, remind, randomPick, poll, textEffect, countdown, cuaca, kbbi, shortUrl, nulis } = require('./fun/tools');
const { setAfk, checkAfkSender, checkAfkMentions, processXp, showLevel, leaderboard, confess, profileCard } = require('./fun/social');
const { removeBg, hdEnhance, eksporViewOnce } = require('./fun/imagetools');
const { fakeChat } = require('./fun/fakechat');
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

  // ── AFK & LEVELING HOOKS (runs on EVERY message, before command check) ──
  try {
    // Check if sender was AFK → auto-remove AFK
    await checkAfkSender(msg);

    // Check if message mentions someone who is AFK → notify
    await checkAfkMentions(msg);

    // Process XP for leveling (grup only)
    await processXp(msg, chat);
  } catch (err) {
    // Silent fail — don't block message processing
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

    // ── NEW FUN GAMES ──
    case 'rps':
    case 'suit':
      await rps(msg, args);
      break;

    case 'tebak':
      await tebakAngka(msg, args);
      break;

    case 'truth':
      await truth(msg);
      break;

    case 'dare':
      await dare(msg);
      break;

    case 'tod':
      await tod(msg);
      break;

    case '8ball':
      await eightBall(msg, args);
      break;

    case 'rate':
      await rate(msg, args);
      break;

    case 'ship':
    case 'match':
      await ship(msg);
      break;

    case 'siapakah':
      await siapakah(msg, args);
      break;

    case 'slot':
      await slot(msg);
      break;

    case 'trivia':
    case 'quiz':
      await trivia(msg);
      break;

    case 'meme':
    case 'jokes':
      await meme(msg);
      break;

    case 'roast':
      await roast(msg);
      break;

    case 'puisi':
    case 'pantun':
      await puisi(msg);
      break;

    case 'zodiak':
    case 'zodiac':
      await zodiak(msg, args);
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

    // ── UTILITY TOOLS ──
    case 'qr':
    case 'qrcode':
      await generateQR(msg, args);
      break;

    case 'remind':
    case 'ingatkan':
      await remind(client, msg, args);
      break;

    case 'acak':
    case 'random':
      await randomPick(msg, args);
      break;

    case 'poll':
    case 'vote':
      await poll(msg, args);
      break;

    case 'teks':
    case 'text':
      await textEffect(msg, args);
      break;

    case 'countdown':
    case 'hitung-mundur':
      await countdown(msg, args);
      break;

    case 'cuaca':
    case 'weather':
      await cuaca(msg, args);
      break;

    case 'kbbi':
      await kbbi(msg, args);
      break;

    case 'short':
    case 'shorturl':
      await shortUrl(msg, args);
      break;

    case 'nulis':
      await nulis(msg, args);
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

    // ── SOCIAL COMMANDS ──
    case 'afk':
      await setAfk(client, msg, args);
      break;

    case 'level':
    case 'rank':
      await showLevel(msg);
      break;

    case 'leaderboard':
    case 'lb':
    case 'top':
      await leaderboard(msg);
      break;

    case 'confess':
    case 'anon':
      await confess(client, msg, args);
      break;

    case 'profile':
    case 'profil':
      await profileCard(client, msg);
      break;

    // ── IMAGE TOOLS ──
    case 'removebg':
    case 'nobg':
      await removeBg(msg);
      break;

    case 'hd':
    case 'enhance':
      await hdEnhance(msg);
      break;

    case 'ekspor':
    case 'viewonce':
      await eksporViewOnce(msg);
      break;

    // ── FAKE CHAT GENERATOR ──
    case 'fakechat':
    case 'fc':
    case 'iphonechat':
      await fakeChat(msg, args);
      break;

    default:
      // Unknown command — silently ignore
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
      const name = contact.pushname || contact.name || contact.id.user;
      const memberCount = group.participants.length;

      // ── Try Canvas Welcome Card ──
      try {
        const { createCanvas, loadImage } = require('@napi-rs/canvas');
        const axios = require('axios');
        const { MessageMedia } = require('whatsapp-web.js');

        const width = 700;
        const height = 350;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#0f2027');
        gradient.addColorStop(0.5, '#203a43');
        gradient.addColorStop(1, '#2c5364');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Border
        ctx.strokeStyle = '#4ecdc4';
        ctx.lineWidth = 3;
        ctx.roundRect(8, 8, width - 16, height - 16, 16);
        ctx.stroke();

        // Decorative circles
        ctx.globalAlpha = 0.08;
        ctx.beginPath();
        ctx.arc(600, 50, 120, 0, Math.PI * 2);
        ctx.fillStyle = '#4ecdc4';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(100, 300, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // "WELCOME" header
        ctx.fillStyle = '#4ecdc4';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('W E L C O M E', width / 2, 45);

        // Divider line
        ctx.strokeStyle = 'rgba(78, 205, 196, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(200, 55);
        ctx.lineTo(500, 55);
        ctx.stroke();

        // ── Profile Picture ──
        const avatarSize = 100;
        const avatarX = width / 2;
        const avatarY = 125;
        let hasAvatar = false;

        try {
          const ppUrl = await client.getProfilePicUrl(memberId);
          if (ppUrl) {
            const response = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 10000 });
            const avatarImg = await loadImage(Buffer.from(response.data));
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatarImg, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
            ctx.restore();
            hasAvatar = true;
          }
        } catch (e) {}

        if (!hasAvatar) {
          ctx.beginPath();
          ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
          ctx.fillStyle = '#4ecdc4';
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 42px Arial';
          ctx.fillText(name.charAt(0).toUpperCase(), avatarX, avatarY + 14);
        }

        // Avatar ring
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarSize / 2 + 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#4ecdc4';
        ctx.lineWidth = 3;
        ctx.stroke();

        // User name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        const displayName = name.length > 25 ? name.substring(0, 25) + '...' : name;
        ctx.fillText(displayName, width / 2, 210);

        // Phone number
        ctx.fillStyle = '#aaa';
        ctx.font = '14px Arial';
        ctx.fillText(`+${contact.id.user}`, width / 2, 232);

        // Group info
        ctx.fillStyle = '#4ecdc4';
        ctx.font = 'bold 18px Arial';
        const groupName = group.name.length > 35 ? group.name.substring(0, 35) + '...' : group.name;
        ctx.fillText(groupName, width / 2, 270);

        // Member count
        ctx.fillStyle = '#888';
        ctx.font = '14px Arial';
        ctx.fillText(`Member ke-${memberCount}`, width / 2, 295);

        // Bottom message
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px Arial';
        ctx.fillText('Selamat bergabung! Jangan lupa baca rules ya \ud83d\ude0a', width / 2, 330);

        ctx.textAlign = 'left';

        const buffer = canvas.toBuffer('image/png');
        const base64 = buffer.toString('base64');
        const media = new MessageMedia('image/png', base64, 'welcome.png');

        const captionText = groupData.welcomeMsg
          .replace('@user', `@${contact.id.user}`)
          .replace('@group', group.name);

        await group.sendMessage(media, {
          caption: captionText,
          mentions: [contact.id._serialized],
        });
      } catch (canvasErr) {
        // Fallback: text-only welcome
        const welcomeMsg = groupData.welcomeMsg
          .replace('@user', `@${contact.id.user}`)
          .replace('@group', group.name);
        await group.sendMessage(welcomeMsg, { mentions: [contact.id._serialized] });
      }
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
