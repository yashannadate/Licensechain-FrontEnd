require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  networks: {
    sepolia: {
      provider: () =>
        new HDWalletProvider(
          process.env.PRIVATE_KEY,
          `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
        ),
      network_id: 11155111,
      gas: 5000000,
      gasPrice: 30000000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
  },
  compilers: {
    solc: {
      version: "0.8.21",
    },
  },
};
