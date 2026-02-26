// Anti-link: deteksi & hapus pesan berisi link undangan WA
const { saveGroupData } = require('./admin');

const WA_LINK_REGEX = /chat\.whatsapp\.com\/[A-Za-z0-9]+/i;

async function handleAntiLink(client, msg, groupData) {
  if (!groupData.antiLink) return false;

  const body = msg.body || '';
  if (!WA_LINK_REGEX.test(body)) return false;

  const group = await msg.getChat();
  const sender = await msg.getContact();
  const senderNumber = sender.id._serialized;

  // Cek apakah sender adalah admin — jika admin, skip
  const participants = group.participants;
  const senderParticipant = participants.find(p => p.id._serialized === senderNumber);
  const isAdmin = senderParticipant?.isAdmin || senderParticipant?.isSuperAdmin;
  if (isAdmin) return false;

  try {
    await msg.delete(true); // delete for everyone
  } catch {}

  await group.sendMessage(
    `⚠️ @${sender.id.user} dilarang mengirim link grup!\n` +
    `Pesan telah dihapus oleh bot.`,
    { mentions: [senderNumber] }
  );

  // Tambah warn
  if (!groupData.warns) groupData.warns = {};
  if (!groupData.warns[senderNumber]) groupData.warns[senderNumber] = 0;
  groupData.warns[senderNumber]++;

  const warnCount = groupData.warns[senderNumber];
  const maxWarn = 3;

  if (warnCount >= maxWarn) {
    await group.sendMessage(
      `⛔ @${sender.id.user} telah mendapat *${maxWarn} peringatan* karena mengirim link!\nMember di-kick dari grup.`,
      { mentions: [senderNumber] }
    );
    try {
      await group.removeParticipants([senderNumber]);
    } catch {}
    groupData.warns[senderNumber] = 0;
  } else {
    await group.sendMessage(
      `⚠️ Peringatan *${warnCount}/${maxWarn}* untuk @${sender.id.user}`,
      { mentions: [senderNumber] }
    );
  }

  saveGroupData(group.id._serialized, groupData);
  return true;
}

module.exports = { handleAntiLink };
