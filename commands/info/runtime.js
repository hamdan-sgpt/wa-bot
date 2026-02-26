const config = require('../../config');

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

async function runtime(msg) {
  const uptime = Date.now() - config.startTime;
  await msg.reply(`⏱️ *${config.botName} Runtime*\n\n🟢 Aktif selama: *${formatUptime(uptime)}*`);
}

async function botInfo(client, msg) {
  const info = await client.info;
  const uptime = Date.now() - config.startTime;

  await msg.reply(
    `🤖 *Info Bot*\n\n` +
    `📛 Nama: *${config.botName}*\n` +
    `📱 Nomor: *${info.wid.user}*\n` +
    `⏱️ Uptime: *${formatUptime(uptime)}*\n` +
    `🔧 Prefix: \`${config.prefix}\`\n` +
    `🧠 AI: ${config.aiEnabled ? '✅ Aktif' : '❌ Nonaktif'}\n\n` +
    `_Ketik ${config.prefix}help untuk melihat perintah_`
  );
}

module.exports = { runtime, botInfo };
