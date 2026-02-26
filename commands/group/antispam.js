const config = require('../../config');
const { saveGroupData } = require('./admin');

// spamTracker: { [groupId]: { [userId]: { count, firstMsg } } }
const spamTracker = {};

async function handleAntiSpam(client, msg, groupData) {
  if (!groupData.antiSpam) return false;

  const group = await msg.getChat();
  const sender = await msg.getContact();
  const senderNumber = sender.id._serialized;
  const groupId = group.id._serialized;
  const now = Date.now();

  // Admin is exempt
  const participants = group.participants;
  const senderParticipant = participants.find(p => p.id._serialized === senderNumber);
  const isAdmin = senderParticipant?.isAdmin || senderParticipant?.isSuperAdmin;
  if (isAdmin) return false;

  // Init tracker
  if (!spamTracker[groupId]) spamTracker[groupId] = {};
  if (!spamTracker[groupId][senderNumber]) {
    spamTracker[groupId][senderNumber] = { count: 0, firstMsg: now };
  }

  const tracker = spamTracker[groupId][senderNumber];

  // Reset if outside time window
  if (now - tracker.firstMsg > config.spam.intervalMs) {
    tracker.count = 0;
    tracker.firstMsg = now;
  }

  tracker.count++;

  if (tracker.count >= config.spam.maxMessages) {
    tracker.count = 0;

    // Increment warns
    if (!groupData.warns) groupData.warns = {};
    if (!groupData.warns[senderNumber]) groupData.warns[senderNumber] = 0;
    groupData.warns[senderNumber]++;

    const warnCount = groupData.warns[senderNumber];
    const maxWarn = config.spam.warnBeforeKick;

    if (warnCount >= maxWarn) {
      await group.sendMessage(
        `⛔ @${sender.id.user} di-kick karena *spam berulang* (${maxWarn} peringatan)!`,
        { mentions: [senderNumber] }
      );
      try {
        await group.removeParticipants([senderNumber]);
      } catch {}
      groupData.warns[senderNumber] = 0;
    } else {
      await group.sendMessage(
        `🚨 Hei @${sender.id.user}! Tolong jangan *spam*!\n` +
        `Peringatan *${warnCount}/${maxWarn}* — setelah ini kamu akan di-kick!`,
        { mentions: [senderNumber] }
      );
    }

    saveGroupData(groupId, groupData);
    return true;
  }

  return false;
}

module.exports = { handleAntiSpam };
