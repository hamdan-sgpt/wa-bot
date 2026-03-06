const axios = require('axios');

const API_KEY = '$2a$10$cozvrGwx8hMd5p9LLwkcKuhqNiUC.5PNfvaolPqO05qN2rgjqLIPW';

async function main() {
  console.log('🚀 Membuat bin Levels di JSONBin...\n');
  const res = await axios.post('https://api.jsonbin.io/v3/b', { _init: true }, {
    headers: {
      'X-Master-Key': API_KEY,
      'Content-Type': 'application/json',
      'X-Bin-Name': 'wa-bot-levels',
      'X-Bin-Private': 'true',
    }
  });
  const binId = res.data.metadata.id;
  console.log(`✅ Bin Levels dibuat! ID: ${binId}`);
  console.log('\n========================================');
  console.log('📋 Tambahkan env var ini ke Railway:\n');
  console.log(`JSONBIN_LEVELS_BIN_ID=${binId}`);
  console.log('========================================\n');
}

main().catch(err => {
  console.error('❌ Error:', err.response?.data || err.message);
});
