const fs = require('fs');
const path = require('path');

const config = require('../../config');

const DATA_DIR = path.resolve(config.dataPath);
const BABU_FILE = path.join(DATA_DIR, 'babu_list.json');

// ── Initial seed data (132 babu) ──
const INITIAL_BABU = [
  { name: "NEVERMIN", note: "" },
  { name: "𝙁𝙇𝙊𝙓𝙓𝙄", note: "" },
  { name: "LAVEXRAN", note: "" },
  { name: "NEXSTALEVERZ", note: "" },
  { name: "BRUTAL CS", note: "" },
  { name: "FORIUS", note: "" },
  { name: "BLACK ROSE", note: "" },
  { name: "AUSTRALIA", note: "" },
  { name: "VOXCAN", note: "" },
  { name: "MBOJO STARS", note: "" },
  { name: "REMINDER", note: "" },
  { name: "VENXCYURS", note: "" },
  { name: "INVESTARS44", note: "" },
  { name: "NAMIKAZE25", note: "" },
  { name: "NOXFOURTY", note: "" },
  { name: "FIGHTER", note: "" },
  { name: "SILENTLITE", note: "" },
  { name: "DREAMER", note: "" },
  { name: "RBBS NEW ERA", note: "" },
  { name: "MARGA 244", note: "" },
  { name: "NEXSYLEN", note: "" },
  { name: "NOTFACE", note: "" },
  { name: "VLOXOEE", note: "" },
  { name: "4GEORCOUS", note: "" },
  { name: "NOCURE", note: "" },
  { name: "VARNIY 2K25", note: "" },
  { name: "clipsey starr", note: "" },
  { name: "VOLNAITE", note: "" },
  { name: "NARVY 2K25", note: "" },
  { name: "MARGA 24", note: "KACUNG GAADA PERLAWANAN" },
  { name: "VLEXTNDER", note: "" },
  { name: "VAMPIRE", note: "" },
  { name: "VILENZSYTAR", note: "" },
  { name: "SG NEW", note: "" },
  { name: "GENESIS", note: "" },
  { name: "PETARUNK", note: "" },
  { name: "NEVERLUS", note: "" },
  { name: "ARCHARY", note: "" },
  { name: "XC", note: "" },
  { name: "EXANNATOS", note: "" },
  { name: "911 PRIDE", note: "" },
  { name: "ACUMALAKA", note: "" },
  { name: "INVICTUS", note: "" },
  { name: "MARGA 17 KW", note: "" },
  { name: "VIPERCEES INTI", note: "" },
  { name: "NEVEROR JR", note: "" },
  { name: "VIOLANCE 7", note: "" },
  { name: "ALL THREE", note: "" },
  { name: "HAOTIAN", note: "" },
  { name: "NJ", note: "" },
  { name: "Nelvence", note: "" },
  { name: "pamdestroyer", note: "" },
  { name: "VIOLANCE", note: "" },
  { name: "909 MARGA", note: "" },
  { name: "MAFIOSO", note: "" },
  { name: "EIGHTY CS CLUB", note: "" },
  { name: "Phantom ReaperZ", note: "" },
  { name: "tw1stic", note: "" },
  { name: "XSTARS", note: "" },
  { name: "MARGA 15", note: "" },
  { name: "sevenx", note: "" },
  { name: "ULTRASORTS", note: "" },
  { name: "mystic", note: "" },
  { name: "NEXSUS", note: "" },
  { name: "18NEVERDIE", note: "" },
  { name: "XEAD CESS", note: "" },
  { name: "LOXIE", note: "" },
  { name: "POKEMON", note: "" },
  { name: "EXTERMINATO", note: "" },
  { name: "volrix", note: "" },
  { name: "GOODREALM", note: "" },
  { name: "KaZuTo", note: "" },
  { name: "TRDH-CEES", note: "" },
  { name: "neverland prime", note: "" },
  { name: "STARNOVA", note: "" },
  { name: "STECU", note: "" },
  { name: "NCX", note: "" },
  { name: "STECU99", note: "" },
  { name: "PRIMEALITE", note: "" },
  { name: "ALLBASE KING SECRET", note: "" },
  { name: "VENXCYURS", note: "" },
  { name: "ANTANIX AREA", note: "" },
  { name: "QUIXOTIC", note: "" },
  { name: "SOCRATES", note: "" },
  { name: "NATHERLANDSS", note: "" },
  { name: "VEX77 NEVERIDE", note: "" },
  { name: "JOMOKERS", note: "" },
  { name: "DOMINION", note: "" },
  { name: "TGM", note: "" },
  { name: "PHANTOM DECAY", note: "" },
  { name: "MARGA 12", note: "" },
  { name: "18PRIDE", note: "" },
  { name: "83", note: "" },
  { name: "NEVERVOS", note: "" },
  { name: "REVERRION", note: "" },
  { name: "UNBETABLE", note: "" },
  { name: "TANG SECT", note: "" },
  { name: "MINIONS", note: "" },
  { name: "MARGA 25", note: "" },
  { name: "SEVENSIX", note: "" },
  { name: "NOCTISMORS", note: "" },
  { name: "DOWSKIE", note: "" },
  { name: "VOLTAZE", note: "" },
  { name: "REAPERS", note: "" },
  { name: "AVENGERS", note: "NGILANG" },
  { name: "DUTTPRIDE", note: "" },
  { name: "ASCRUZ", note: "" },
  { name: "SATAXUS", note: "ownernya hbis minum arak 10 botol" },
  { name: "KSK TEAM", note: "" },
  { name: "BESAGA", note: "" },
  { name: "VOLTASE", note: "" },
  { name: "VOLTRA", note: "" },
  { name: "MIDEWAY", note: "" },
  { name: "LENOX13", note: "" },
  { name: "ZIZUH", note: "" },
  { name: "GLAZER", note: "" },
  { name: "NOURXTIVEN", note: "" },
  { name: "KALCER R ARE", note: "kaga terima kalo dis kocak anj" },
  { name: "77HARVEST", note: "" },
  { name: "N3CKDEEP", note: "" },
  { name: "LIONS", note: "" },
  { name: "NEVERDIE", note: "" },
  { name: "TOXICITY", note: "" },
  { name: "401", note: "" },
  { name: "ZERELETHAL", note: "" },
  { name: "77 Harvest", note: "" },
  { name: "ASTRALCEES", note: "" },
  { name: "9A9 AREA", note: "" },
  { name: "SLINSE ALLBASE", note: "" },
  { name: "SALVATRIX17", note: "" },
  { name: "savael", note: "" },
  { name: "VLAIMUNOX ANTI HAMA", note: "IZIN CB" }
];

// ── In-memory cache (primary source of truth) ──
let cachedList = null;

// ── Load & Save ──
function loadBabuList() {
  // Return cached list if available
  if (cachedList !== null) return cachedList;

  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(BABU_FILE)) {
      const data = fs.readFileSync(BABU_FILE, 'utf8');
      cachedList = JSON.parse(data);
      console.log(`📋 Loaded ${cachedList.length} babu from file`);
      return cachedList;
    }
  } catch (err) {
    console.error('⚠️ Error loading babu list from file:', err.message);
  }

  // First run or file error — seed initial data
  cachedList = [...INITIAL_BABU];
  saveBabuList(cachedList);
  console.log(`📋 Seeded ${cachedList.length} initial babu`);
  return cachedList;
}

function saveBabuList(list) {
  // Always update cache first
  cachedList = list;

  // Then try to persist to file
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(BABU_FILE, JSON.stringify(list, null, 2));
  } catch (err) {
    console.error('⚠️ Error saving babu list to file:', err.message);
    // Data is still in memory cache, so commands will still work
  }
}

// ── Format list ──
function formatBabuList(list) {
  if (list.length === 0) return '📋 List kosong, belum ada babu.';

  let text = '𝐋𝐈𝐒𝐓 𝐇𝐄𝐖𝐀𝐍 𝐓𝐄𝐑𝐍𝐀𝐊 𝐕𝐎𝐔𝐑𝐆𝐎𝐎𝐃\n';
  list.forEach((babu, i) => {
    const note = babu.note ? `(${babu.note})` : '';
    text += `${i + 1}. *${babu.name}*${note ? ' ' + note : ''}\n`;
  });
  return text.trim();
}

// ── Commands ──

async function addBabu(client, msg, args) {
  const name = args.slice(1).join(' ').trim();
  if (!name) {
    return msg.reply('❌ Masukkan nama babu!\nContoh: !addbabu NAMA BABU');
  }

  const list = loadBabuList();
  list.push({ name: name, note: '' });
  saveBabuList(list);

  const chat = await msg.getChat();
  const listText = formatBabuList(list);
  const sentMsg = await chat.sendMessage(`✅ *${name}* berhasil ditambahkan sebagai babu #${list.length}!\n\n${listText}`);

  // Auto-pin the message
  try {
    await sentMsg.pin(604800); // pin for 7 days (max)
  } catch (err) {
    console.log('⚠️ Gagal pin message:', err.message);
  }
}

async function listBabu(client, msg) {
  const list = loadBabuList();
  const listText = formatBabuList(list);
  await msg.reply(listText);
}

async function delBabu(client, msg, args) {
  const num = parseInt(args[1]);
  if (!num || isNaN(num)) {
    return msg.reply('❌ Masukkan nomor babu yang mau dihapus!\nContoh: !delbabu 5');
  }

  const list = loadBabuList();
  if (num < 1 || num > list.length) {
    return msg.reply(`❌ Nomor tidak valid! List babu saat ini: 1 - ${list.length}`);
  }

  const removed = list.splice(num - 1, 1)[0];
  saveBabuList(list);

  const chat = await msg.getChat();
  const listText = formatBabuList(list);
  const sentMsg = await chat.sendMessage(`🗑️ *${removed.name}* berhasil dihapus dari list!\n\n${listText}`);

  // Auto-pin the updated list
  try {
    await sentMsg.pin(604800);
  } catch (err) {
    console.log('⚠️ Gagal pin message:', err.message);
  }
}

async function addBabuNote(client, msg, args) {
  // !notebabu <nomor> <catatan>
  const num = parseInt(args[1]);
  if (!num || isNaN(num)) {
    return msg.reply('❌ Format: !notebabu <nomor> <catatan>\nContoh: !notebabu 30 KACUNG GAADA PERLAWANAN');
  }

  const note = args.slice(2).join(' ').trim();
  if (!note) {
    return msg.reply('❌ Masukkan catatan!\nContoh: !notebabu 30 KACUNG GAADA PERLAWANAN');
  }

  const list = loadBabuList();
  if (num < 1 || num > list.length) {
    return msg.reply(`❌ Nomor tidak valid! List babu saat ini: 1 - ${list.length}`);
  }

  list[num - 1].note = note;
  saveBabuList(list);
  await msg.reply(`✅ Catatan untuk *${list[num - 1].name}* diupdate: (${note})`);
}

module.exports = { addBabu, listBabu, delBabu, addBabuNote };
