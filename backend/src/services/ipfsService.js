const lighthouse = require('@lighthouse-web3/sdk');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

const getLighthouseApiKey = () => {
  const key = process.env.LIGHTHOUSE_API_KEY;
  if (!key) throw new Error('LIGHTHOUSE_API_KEY not configured');
  return key;
};

/**
 * Upload a file buffer to Filecoin via Lighthouse Storage
 * @param {Buffer} fileBuffer
 * @param {string} fileName
 * @returns {{ cid: string, url: string, gatewayUrl: string }}
 */
const uploadToIPFS = async (fileBuffer, fileName) => {
  const apiKey = getLighthouseApiKey();

  const tmpDir = os.tmpdir();
  const tmpPath = path.join(tmpDir, fileName);
  fs.writeFileSync(tmpPath, fileBuffer);

  try {
    const response = await lighthouse.upload(tmpPath, apiKey);
    const cid = response.data.Hash;
    return {
      cid,
      url: `https://gateway.lighthouse.storage/ipfs/${cid}`,
      gatewayUrl: `https://ipfs.io/ipfs/${cid}`,
      name: response.data.Name,
      size: response.data.Size,
    };
  } finally {
    fs.unlinkSync(tmpPath);
  }
};

/**
 * Upload a JSON object to Filecoin via Lighthouse
 * @param {object} jsonData
 * @param {string} fileName
 * @returns {{ cid: string, url: string }}
 */
const uploadJSONToIPFS = async (jsonData, fileName = 'data.json') => {
  const buffer = Buffer.from(JSON.stringify(jsonData, null, 2));
  return uploadToIPFS(buffer, fileName);
};

/**
 * Retrieve content from IPFS by CID via Lighthouse gateway
 * @param {string} cid
 * @returns {any}
 */
const retrieveFromIPFS = async (cid) => {
  const response = await axios.get(
    `https://gateway.lighthouse.storage/ipfs/${cid}`,
    { timeout: 15000 }
  );
  return response.data;
};

/**
 * Get file info / deal status from Lighthouse
 * @param {string} cid
 * @returns {object|null}
 */
const checkCIDStatus = async (cid) => {
  try {
    const apiKey = getLighthouseApiKey();
    const response = await lighthouse.dealStatus(cid);
    return response.data;
  } catch {
    return null;
  }
};

/**
 * Get all uploads for the current API key
 * @returns {Array}
 */
const listUploads = async () => {
  const apiKey = getLighthouseApiKey();
  const response = await lighthouse.getUploads(apiKey);
  return response.data;
};

module.exports = { uploadToIPFS, uploadJSONToIPFS, retrieveFromIPFS, checkCIDStatus, listUploads };
