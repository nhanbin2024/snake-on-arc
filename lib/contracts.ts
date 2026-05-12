import { zeroAddress, type Address } from 'viem';

export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as Address;
export const ENTRY_FEE_USDC_UNITS = 100_000n; // 0.1 USDC with the Arc ERC-20 USDC interface, which uses 6 decimals.
export const DAILY_BONUS_POINTS = 10;

const rawGameContract = process.env.NEXT_PUBLIC_GAME_CONTRACT_ADDRESS;
export const GAME_CONTRACT_ADDRESS = (
  rawGameContract && /^0x[a-fA-F0-9]{40}$/.test(rawGameContract) ? rawGameContract : zeroAddress
) as Address;

export const isGameContractConfigured = GAME_CONTRACT_ADDRESS !== zeroAddress;

export const erc20Abi = [
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8', name: '' }]
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ type: 'address', name: 'account' }],
    outputs: [{ type: 'uint256', name: '' }]
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { type: 'address', name: 'owner' },
      { type: 'address', name: 'spender' }
    ],
    outputs: [{ type: 'uint256', name: '' }]
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { type: 'address', name: 'spender' },
      { type: 'uint256', name: 'value' }
    ],
    outputs: [{ type: 'bool', name: '' }]
  }
] as const;

export const gameAbi = [
  {
    type: 'function',
    name: 'ENTRY_FEE',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }]
  },
  {
    type: 'function',
    name: 'DAILY_BONUS',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }]
  },
  {
    type: 'function',
    name: 'CHECK_IN_COOLDOWN',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }]
  },
  {
    type: 'function',
    name: 'startGame',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    type: 'function',
    name: 'submitScore',
    stateMutability: 'nonpayable',
    inputs: [{ type: 'uint256', name: 'score' }],
    outputs: []
  },
  {
    type: 'function',
    name: 'dailyCheckIn',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    type: 'function',
    name: 'profiles',
    stateMutability: 'view',
    inputs: [{ type: 'address', name: '' }],
    outputs: [
      { type: 'uint256', name: 'bestScore' },
      { type: 'uint256', name: 'bonusPoints' },
      { type: 'uint256', name: 'totalSubmitted' },
      { type: 'uint256', name: 'lastCheckIn' }
    ]
  },
  {
    type: 'function',
    name: 'getTopScores',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        type: 'tuple[]',
        name: '',
        components: [
          { type: 'address', name: 'player' },
          { type: 'uint256', name: 'score' },
          { type: 'uint256', name: 'bonusPoints' },
          { type: 'uint256', name: 'submittedAt' }
        ]
      }
    ]
  }
] as const;
