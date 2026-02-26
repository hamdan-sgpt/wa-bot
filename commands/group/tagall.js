// Mention all members in a group
async function tagAll(client, msg, args) {
  const group = await msg.getChat();
  if (!group.isGroup) return msg.reply('❌ Perintah ini hanya bisa digunakan di grup!');

  const customMsg = args.slice(1).join(' ') || '📢 Pengumuman untuk semua member!';
  const participants = group.participants;
  const total = participants.length;

  let mentionIds = [];
  let memberList = '';

  for (let i = 0; i < participants.length; i++) {
    const p = participants[i];
    mentionIds.push(p.id._serialized);
    memberList += `${i + 1}. @${p.id.user}\n`;
  }

  const mentionText =
    `╔══════════════════════╗\n` +
    `║  📢 *TAG ALL MEMBER*  ║\n` +
    `╚══════════════════════╝\n\n` +
    `💬 *Pesan:*\n${customMsg}\n\n` +
    `👥 *Member (${total} orang):*\n` +
    `${memberList}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━`;

  await group.sendMessage(mentionText, { mentions: mentionIds });
}

module.exports = { tagAll };


