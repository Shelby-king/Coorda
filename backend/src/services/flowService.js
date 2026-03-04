const axios = require('axios');
const fs = require('fs');
const path = require('path');

const FLOW_ACCESS_NODE = process.env.FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org';

const CADENCE_ROOT = path.resolve(__dirname, '../../../Coorda/cadence');

const getContractAddress = () => {
  const addr = process.env.FLOW_ACCOUNT_ADDRESS;
  if (!addr) throw new Error('FLOW_ACCOUNT_ADDRESS not configured');
  return addr;
};

const cadenceArg = (type, value) => ({ type, value });

/**
 * Read a Cadence file from the Coorda cadence directory
 * @param {string} relativePath - e.g. 'scripts/getEscrowStatus.cdc'
 */
const readCadenceFile = (relativePath) => {
  const fullPath = path.join(CADENCE_ROOT, relativePath);
  return fs.readFileSync(fullPath, 'utf8');
};

/**
 * Execute a Cadence script (read-only query) via Flow REST API
 * @param {string} script - Cadence script source
 * @param {Array}  args   - Array of { type, value } arguments
 */
const executeScript = async (script, args = []) => {
  const encoded = Buffer.from(script).toString('base64');
  const encodedArgs = args.map((a) => Buffer.from(JSON.stringify(a)).toString('base64'));
  const response = await axios.post(
    `${FLOW_ACCESS_NODE}/v1/scripts`,
    { script: encoded, arguments: encodedArgs },
    { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
  );
  return response.data;
};

/**
 * Get account information from Flow
 * @param {string} address
 */
const getAccount = async (address) => {
  const response = await axios.get(
    `${FLOW_ACCESS_NODE}/v1/accounts/${address}?expand=contracts,keys`,
    { timeout: 10000 }
  );
  return response.data;
};

/**
 * Get transaction details
 * @param {string} txId
 */
const getTransactionStatus = async (txId) => {
  const response = await axios.get(
    `${FLOW_ACCESS_NODE}/v1/transactions/${txId}`,
    { timeout: 10000 }
  );
  return response.data;
};

/**
 * Get transaction result (events + status)
 * @param {string} txId
 */
const getTransactionResult = async (txId) => {
  const response = await axios.get(
    `${FLOW_ACCESS_NODE}/v1/transaction_results/${txId}`,
    { timeout: 10000 }
  );
  return response.data;
};

/**
 * Poll transaction until sealed or timeout
 * @param {string} txId
 * @param {number} timeoutMs
 */
const waitForTransaction = async (txId, timeoutMs = 30000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = await getTransactionResult(txId);
    if (result.status === 'Sealed') return result;
    if (result.error_message && result.error_message.length > 0) throw new Error(`Transaction failed: ${result.error_message}`);
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`Transaction ${txId} did not seal within ${timeoutMs}ms`);
};

/**
 * Query escrow status on-chain via Cadence script
 * @param {string} escrowId
 */
const getEscrowStatus = async (escrowId) => {
  const contractAddress = getContractAddress();
  const script = readCadenceFile('scripts/getEscrowStatus.cdc');
  return executeScript(script, [
    cadenceArg('Address', contractAddress),
    cadenceArg('String', escrowId),
  ]);
};

/**
 * Query wave info on-chain via Cadence script
 * @param {string} waveId
 */
const getWaveInfo = async (waveId) => {
  const contractAddress = getContractAddress();
  const script = readCadenceFile('scripts/getWaveInfo.cdc');
  return executeScript(script, [
    cadenceArg('Address', contractAddress),
    cadenceArg('String', waveId),
  ]);
};

/**
 * Query wave builders on-chain via Cadence script
 * @param {string} waveId
 */
const getWaveBuilders = async (waveId) => {
  const contractAddress = getContractAddress();
  const script = readCadenceFile('scripts/getWaveBuilders.cdc');
  return executeScript(script, [
    cadenceArg('Address', contractAddress),
    cadenceArg('String', waveId),
  ]);
};

module.exports = {
  executeScript,
  readCadenceFile,
  getAccount,
  getTransactionStatus,
  getTransactionResult,
  waitForTransaction,
  getEscrowStatus,
  getWaveInfo,
  getWaveBuilders,
  cadenceArg,
};
