const fs = require('fs');
const path = require('path');
const config = require('../../config');

// Use config.dataPath instead of hardcoded relative path
const DATA_DIR = path.resolve(config.dataPath);
const ROLES_FILE = path.join(DATA_DIR, 'roles.json');

// Initialize empty roles file if it doesn't exist.
// roles format: { "role_id": { name, dailyLimit, isDefaultClaim: boolean } }
// users format: { "user_number": "role_id" }
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(ROLES_FILE)) {
  const initialData = {
    roles: {
      "member": {
        name: "Member Baru",
        dailyLimit: config.aiCredits.defaultCredits,
        isDefaultClaim: true
      }
    },
    users: {}
  };
  fs.writeFileSync(ROLES_FILE, JSON.stringify(initialData, null, 2));
}

function loadRolesData() {
  try {
    return JSON.parse(fs.readFileSync(ROLES_FILE, 'utf8'));
  } catch (err) {
    return { roles: {}, users: {} };
  }
}

function saveRolesData(data) {
  fs.writeFileSync(ROLES_FILE, JSON.stringify(data, null, 2));
}

/**
 * Get user's role ID and details
 */
function getUserRole(userId) {
  const data = loadRolesData();
  const roleId = data.users[userId];
  if (!roleId || !data.roles[roleId]) return null;
  return { id: roleId, ...data.roles[roleId] };
}

/**
 * Check if a user has claimed any role
 */
function hasRole(userId) {
  const data = loadRolesData();
  return !!data.users[userId];
}

// ── COMMANDS ──

/**
 * !claim
 * Action for normal users to register themselves to the bot system
 */
async function claimRole(msg) {
  const senderId = (await msg.getContact()).id._serialized;
  
  if (config.owners.includes(senderId)) {
    return msg.reply('👑 Kamu adalah *Owner Bot*, tidak perlu claim role!');
  }

  const data = loadRolesData();

  if (data.users[senderId]) {
    const currentRole = data.roles[data.users[senderId]];
    return msg.reply(`⚠️ Kamu sudah mengklaim role *${currentRole ? currentRole.name : data.users[senderId]}*!`);
  }

  // Find the default role to give upon claim
  let defaultRoleId = Object.keys(data.roles).find(id => data.roles[id].isDefaultClaim);
  
  if (!defaultRoleId) {
    // Failsafe if default claim role is deleted
    defaultRoleId = 'member';
    data.roles[defaultRoleId] = {
      name: 'Member Baru',
      dailyLimit: config.aiCredits.defaultCredits,
      isDefaultClaim: true
    };
  }

  // Give the role
  data.users[senderId] = defaultRoleId;
  saveRolesData(data);

  const roleName = data.roles[defaultRoleId].name;
  await msg.reply(`✅ *Selamat!* Kamu berhasil verifikasi dan mendapatkan role *${roleName}*.\n\nSekarang kamu bisa menggunakan semua fitur bot. Ketik \`!help\` untuk melihat menu.`);
}


/**
 * !addrole <role_id> <daily_limit> [name...]
 * Example: !addrole vip 50 Member VIP
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

  const data = loadRolesData();
  data.roles[roleId] = {
    name: roleName,
    dailyLimit: dailyLimit,
    features: [],
    isDefaultClaim: false // New roles created by command aren't default claim by default
  };
  saveRolesData(data);

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

  const data = loadRolesData();
  if (!data.roles[roleId]) return msg.reply('❌ Role tidak ditemukan!');

  if (data.roles[roleId].isDefaultClaim) {
    return msg.reply('❌ Tidak bisa menghapus role default untuk `!claim`. Ubah default role di file database langsung jika perlu.');
  }

  delete data.roles[roleId];
  saveRolesData(data);

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

  const data = loadRolesData();
  if (!data.roles[roleId]) {
    return msg.reply('❌ Role tidak ditemukan! Cek list role dengan `!roleinfo`.');
  }

  const target = mentioned[0];
  const targetId = target.id._serialized;

  data.users[targetId] = roleId;
  saveRolesData(data);

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

  const data = loadRolesData();
  if (!data.users[targetId]) return msg.reply('❌ User tersebut tidak memiliki role.');

  delete data.users[targetId];
  saveRolesData(data);

  await msg.reply(`✅ Berhasil mencabut role dari @${target.id.user}. Dia harus \`!claim\` ulang untuk menggunakan bot.`, undefined, { mentions: [targetId] });
}

/**
 * !roleinfo
 */
async function roleInfo(msg) {
  const data = loadRolesData();
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

  const role = getUserRole(senderId);
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
