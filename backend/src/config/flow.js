const fcl = require('@onflow/fcl');
const t = require('@onflow/types');

const initFlow = () => {
  const network = process.env.FLOW_NETWORK || 'testnet';

  if (network === 'mainnet') {
    fcl.config({
      'flow.network': 'mainnet',
      'accessNode.api': 'https://rest-mainnet.onflow.org',
      'discovery.wallet': 'https://fcl-discovery.onflow.org/authn',
    });
  } else {
    fcl.config({
      'flow.network': 'testnet',
      'accessNode.api': process.env.FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org',
      'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn',
    });
  }

  console.log(`Flow configured for ${network}`);
};

module.exports = { fcl, t, initFlow };
