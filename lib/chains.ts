import { defineChain } from 'viem';

export const ARC_TESTNET_CHAIN_ID = 5_042_002;
export const ARC_TESTNET_RPC_URL =
  process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network';

export const arcTestnet = defineChain({
  id: ARC_TESTNET_CHAIN_ID,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: [ARC_TESTNET_RPC_URL],
      webSocket: ['wss://rpc.testnet.arc.network']
    }
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://testnet.arcscan.app'
    }
  },
  testnet: true
});

export const arcAddEthereumChainParameter = {
  chainId: `0x${ARC_TESTNET_CHAIN_ID.toString(16)}`,
  chainName: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18
  },
  rpcUrls: ['https://rpc.testnet.arc.network'],
  blockExplorerUrls: ['https://testnet.arcscan.app']
};
