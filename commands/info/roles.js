const { readBin, writeBin } = require('../../utils/jsonbin');
const config = require('../../config');

const ROLES_BIN_ID = process.env.JSONBIN_ROLES_BIN_ID;

const INITIAL_ROLES_DATA = {
  roles: {
    "member": {
      name: "Member Baru",
      dailyLimit: config.aiCredits.defaultCredits,
      isDefaultClaim: true
    }
  },
  users: {}
};

// ── In-memory cache ──
let cachedRoles = null;

async function loadRolesData() {
  if (cachedRoles !== null) return cachedRoles;

  if (!ROLES_BIN_ID) {
    console.warn('⚠️ JSONBIN_ROLES_BIN_ID not set! Using in-memory default roles.');
    cachedRoles = JSON.parse(JSON.stringify(INITIAL_ROLES_DATA));
    return cachedRoles;
  }

  try {
    cachedRoles = await readBin(ROLES_BIN_ID);
    console.log(`📋 Loaded roles data from JSONBin`);
    return cachedRoles;
  } catch (err) {
    console.error('⚠️ Error loading roles from JSONBin:', err.message);
    cachedRoles = JSON.parse(JSON.stringify(INITIAL_ROLES_DATA));
    return cachedRoles;
  }
}

async function saveRolesData(data) {
  cachedRoles = data;

  if (!ROLES_BIN_ID) {
    console.warn('⚠️ JSONBIN_ROLES_BIN_ID not set! Data only in memory.');
    return;
  }

  try {
    await writeBin(ROLES_BIN_ID, data);
  } catch (err) {
    console.error('⚠️ Error saving roles to JSONBin:', err.message);
  }
}

/**
 * Get user's role ID and details
 */
async function getUserRole(userId) {
  const data = await loadRolesData();
  const roleId = data.users[userId];
  if (!roleId || !data.roles[roleId]) return null;
  return { id: roleId, ...data.roles[roleId] };
}

/**
 * Check if a user has claimed any role
 */
async function hasRole(userId) {
  const data = await loadRolesData();
  return !!data.users[userId];
}

// ── COMMANDS ──

/**
 * !claim
 */
async function claimRole(msg) {
  const senderId = (await msg.getContact()).id._serialized;

  if (config.owners.includes(senderId)) {
    return msg.reply('👑 Kamu adalah *Owner Bot*, tidak perlu claim role!');
  }

  const data = await loadRolesData();

  if (data.users[senderId]) {
    const currentRole = data.roles[data.users[senderId]];
    return msg.reply(`⚠️ Kamu sudah mengklaim role *${currentRole ? currentRole.name : data.users[senderId]}*!`);
  }

  let defaultRoleId = Object.keys(data.roles).find(id => data.roles[id].isDefaultClaim);

  if (!defaultRoleId) {
    defaultRoleId = 'member';
    data.roles[defaultRoleId] = {
      name: 'Member Baru',
      dailyLimit: config.aiCredits.defaultCredits,
      isDefaultClaim: true
    };
  }

  data.users[senderId] = defaultRoleId;
  await saveRolesData(data);

  const roleName = data.roles[defaultRoleId].name;
  await msg.reply(`✅ *Selamat!* Kamu berhasil verifikasi dan mendapatkan role *${roleName}*.\n\nSekarang kamu bisa menggunakan semua fitur bot. Ketik \`!help\` untuk melihat menu.`);
}

/**
 * !addrole <role_id> <daily_limit> [name...]
 */
async function addRole(msg, args) {
  const senderId = (await msg.getContact()).id._serialized;
  if (!config.owners.includes(senderId)) return msg.reply('❌ Perintah ini hanya untuk Owner Bot!');

  const roleId = args[1]?.toLowerCase();
  const dailyLimit = parseInt(args[2]);
  const roleName = args.slice(3).join(' ') || roleId;

  if (!roleId || isNaN(dailyLimit)) {
    return msg.reply('❌ Format salah!\nGunakan: `!addrole <role_id> <daily_limit> [Nama Role]`\nContoh: `!addrole premium 100 User Premium`');
  }

  const data = await loadRolesData();
  data.roles[roleId] = {
    name: roleName,
    dailyLimit: dailyLimit,
    features: [],
    isDefaultClaim: false
  };
  await saveRolesData(data);

  await msg.reply(`✅ Role *${roleName}* (${roleId}) berhasil dibuat dengan limit AI harian *${dailyLimit}*.`);
}

/**
 * !delrole <role_id>
 */
async function delRole(msg, args) {
  const senderId = (await msg.getContact()).id._serialized;
  if (!config.owners.includes(senderId)) return msg.reply('❌ Perintah ini hanya untuk Owner Bot!');

  const roleId = args[1]?.toLowerCase();
  if (!roleId) return msg.reply('❌ Masukkan role ID!\nContoh: `!delrole premium`');

  const data = await loadRolesData();
  if (!data.roles[roleId]) return msg.reply('❌ Role tidak ditemukan!');

  if (data.roles[roleId].isDefaultClaim) {
    return msg.reply('❌ Tidak bisa menghapus role default untuk `!claim`.');
  }

  delete data.roles[roleId];
  await saveRolesData(data);

  await msg.reply(`✅ Role *${roleId}* berhasil dihapus.`);
}

/**
 * !setrole @user <role_id>
 */
async function setRole(msg, args) {
  const senderId = (await msg.getContact()).id._serialized;
  if (!config.owners.includes(senderId)) return msg.reply('❌ Perintah ini hanya untuk Owner Bot!');

  const mentioned = await msg.getMentions();
  const roleId = args[args.length - 1]?.toLowerCase();

  if (!mentioned.length || !roleId) {
    return msg.reply('❌ Format salah!\nGunakan: `!setrole @user <role_id>`\nContoh: `!setrole @budy premium`');
  }

  const data = await loadRolesData();
  if (!data.roles[roleId]) {
    return msg.reply('❌ Role tidak ditemukan! Cek list role dengan `!roleinfo`.');
  }

  const target = mentioned[0];
  const targetId = target.id._serialized;

  data.users[targetId] = roleId;
  await saveRolesData(data);

  await msg.reply(`✅ Berhasil memberikan role *${data.roles[roleId].name}* kepada @${target.id.user}.`, undefined, { mentions: [targetId] });
}

/**
 * !removerole @user
 */
async function removeRole(msg, args) {
  const senderId = (await msg.getContact()).id._serialized;
  if (!config.owners.includes(senderId)) return msg.reply('❌ Perintah ini hanya untuk Owner Bot!');

  const mentioned = await msg.getMentions();
  if (!mentioned.length) return msg.reply('❌ Tag user yang ingin dihapus role-nya!\nContoh: `!removerole @budy`');

  const target = mentioned[0];
  const targetId = target.id._serialized;

  const data = await loadRolesData();
  if (!data.users[targetId]) return msg.reply('❌ User tersebut tidak memiliki role.');

  delete data.users[targetId];
  await saveRolesData(data);

  await msg.reply(`✅ Berhasil mencabut role dari @${target.id.user}. Dia harus \`!claim\` ulang untuk menggunakan bot.`, undefined, { mentions: [targetId] });
}

/**
 * !roleinfo
 */
async function roleInfo(msg) {
  const data = await loadRolesData();
  const roleIds = Object.keys(data.roles);

  if (!roleIds.length) {
    return msg.reply('ℹ️ Belum ada role yang dibuat.');
  }

  let text = '📋 *Daftar Role Bot*\n\n';
  roleIds.forEach(id => {
    const r = data.roles[id];
    text += `🔹 *${r.name}* (\`${id}\`) ${r.isDefaultClaim ? '*(Default Claim)*' : ''}\n`;
    text += `   Limit AI: ${r.dailyLimit}\n\n`;
  });

  await msg.reply(text.trim());
}

/**
 * !myrole
 */
async function myRole(msg) {
  const sender = await msg.getContact();
  const senderId = sender.id._serialized;

  if (config.owners.includes(senderId)) {
    return msg.reply('👑 Kamu adalah *Owner Bot*!');
  }

  const role = await getUserRole(senderId);
  if (!role) {
    return msg.reply('Kamu belum klaim role! Silakan ketik `!claim` untuk menggunakan bot.');
  }

  await msg.reply(
    `👤 *Informasi Role Kamu*\n\n` +
    `🏷️ Role: *${role.name}*\n` +
    `⚡ Limit AI Harian: ${role.dailyLimit}`
  );
}

module.exports = {
  getUserRole,
  hasRole,
  claimRole,
  addRole,
  delRole,
  setRole,
  removeRole,
  roleInfo,
  myRole
};
