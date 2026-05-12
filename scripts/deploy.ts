import { ethers } from 'hardhat';

const ARC_USDC_ERC20_INTERFACE = '0x3600000000000000000000000000000000000000';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying SnakeOnArc with:', deployer.address);
  console.log('Arc USDC ERC-20 interface:', ARC_USDC_ERC20_INTERFACE);

  const SnakeOnArc = await ethers.getContractFactory('SnakeOnArc');
  const game = await SnakeOnArc.deploy(ARC_USDC_ERC20_INTERFACE);
  await game.waitForDeployment();

  const address = await game.getAddress();
  console.log('SnakeOnArc deployed to:', address);
  console.log('\nAdd this to .env.local and Vercel:');
  console.log(`NEXT_PUBLIC_GAME_CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
