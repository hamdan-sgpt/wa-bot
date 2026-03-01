const axios = require('axios');

const API_KEY = process.env.JSONBIN_API_KEY;
const BASE_URL = 'https://api.jsonbin.io/v3/b';

const headers = () => ({
  'X-Master-Key': API_KEY,
  'Content-Type': 'application/json',
});

/**
 * Read data from a JSONBin bin.
 * @param {string} binId - The bin ID (from env, e.g. JSONBIN_BABU_BIN_ID)
 * @returns {Promise<any>} - The stored data
 */
async function readBin(binId) {
  if (!API_KEY) throw new Error('JSONBIN_API_KEY is not set!');
  if (!binId) throw new Error('Bin ID is not set!');

  const res = await axios.get(`${BASE_URL}/${binId}/latest`, { headers: headers() });
  return res.data.record;
}

/**
 * Write (overwrite) data to a JSONBin bin.
 * @param {string} binId - The bin ID
 * @param {any} data - The data to write
 */
async function writeBin(binId, data) {
  if (!API_KEY) throw new Error('JSONBIN_API_KEY is not set!');
  if (!binId) throw new Error('Bin ID is not set!');

  await axios.put(`${BASE_URL}/${binId}`, data, { headers: headers() });
}

/**
 * Create a new bin with initial data.
 * @param {any} data - Initial data for the bin
 * @param {string} name - Bin name (for display only)
 * @returns {Promise<string>} - The new Bin ID
 */
async function createBin(data, name) {
  if (!API_KEY) throw new Error('JSONBIN_API_KEY is not set!');

  const res = await axios.post(BASE_URL, data, {
    headers: {
      ...headers(),
      'X-Bin-Name': name,
      'X-Bin-Private': 'true',
    },
  });
  return res.data.metadata.id;
}

module.exports = { readBin, writeBin, createBin };
