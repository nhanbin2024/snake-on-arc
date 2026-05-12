import 'dotenv/config';
import '@nomicfoundation/hardhat-ethers';
import type { HardhatUserConfig } from 'hardhat/config';

const privateKey = process.env.PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    arcTestnet: {
      url: process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network',
      chainId: 5_042_002,
      accounts: privateKey ? [privateKey] : []
    }
  }
};

export default config;
