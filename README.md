# Snake on Arc

A clean, lightweight Web3 Snake mini game built for **Arc Testnet** and **testnet USDC**.

The game keeps classic Snake mechanics simple: move in four directions, eat food, increase score, and lose when the snake hits the wall or itself. Web3 actions are restricted to Arc Testnet only.

## What is included

- Next.js + React + TailwindCSS
- RainbowKit + wagmi + viem wallet connection
- Connect Wallet and Disconnect Wallet
- Arc Testnet-only validation
- Switch Network button using wallet network switching
- HTML5 Canvas Snake game
- Keyboard controls: Arrow keys / WASD
- Mobile controls: swipe + on-screen buttons
- 0.1 Arc testnet USDC entry fee before gameplay
- 0.1 Arc testnet USDC score submission fee
- 0.1 Arc testnet USDC daily check-in fee
- Daily check-in gives exactly +10 bonus points
- 24-hour daily check-in cooldown
- Solidity smart contract leaderboard
- Clean `.gitignore` for GitHub and Vercel deployment

## Arc configuration used

```ts
Chain ID: 5042002
RPC: https://rpc.testnet.arc.network
Explorer: https://testnet.arcscan.app
Native currency: USDC, 18 decimals
USDC ERC-20 interface: 0x3600000000000000000000000000000000000000, 6 decimals
Entry fee: 100000 units = 0.1 USDC through the ERC-20 interface
```

## 1. Install

```bash
npm install
```

## 2. Create local environment file

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_GAME_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network

ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
PRIVATE_KEY=0xyour_private_key_for_deploy_wallet
```

Do **not** commit real `.env.local` or `PRIVATE_KEY`.

## 3. Compile contract

```bash
npm run compile
```

## 4. Deploy contract to Arc Testnet

Make sure your deploy wallet has Arc Testnet USDC for gas.

```bash
npm run deploy:arc
```

The terminal will print something like:

```bash
SnakeOnArc deployed to: 0xYourContractAddress
NEXT_PUBLIC_GAME_CONTRACT_ADDRESS=0xYourContractAddress
```

Copy that address into `.env.local` and into Vercel Environment Variables.

## 5. Run locally

```bash
npm run dev
```

Open:

```bash
http://localhost:3000
```

## 6. Vercel settings

When importing to Vercel, use:

```txt
Framework Preset: Next.js
Root Directory: ./
Install Command: npm install
Build Command: npm run build
Output Directory: .next
```

Environment Variables on Vercel:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_GAME_CONTRACT_ADDRESS=0xYourContractAddress
NEXT_PUBLIC_ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
```

Do **not** add `PRIVATE_KEY` to Vercel.

## 7. Clean GitHub push

From the project folder:

```bash
git init
git add .
git commit -m "Initial clean commit: Snake on Arc"
git branch -M main
git remote add origin https://github.com/nhanbin2024/snake-on-arc.git
git push -u origin main --force
```

Before pushing, verify no junk files are tracked:

```bash
git ls-files | grep -E "node_modules|.next|.fly|AppData|requirements.txt|.env|.exe" || true
```

On PowerShell:

```powershell
git ls-files | Select-String -Pattern "node_modules|\.next|\.fly|AppData|requirements.txt|\.env|\.exe"
```

If the command returns nothing, the repo is clean.

## Payment flow

Because the app uses the Arc USDC ERC-20 interface, a user may see two wallet popups when allowance is missing:

1. Approve 0.1 USDC for the game contract.
2. Confirm the game action transaction.

After allowance exists, only the action transaction is needed until allowance is spent or changed.

## Important security notes

This is demo/hackathon code for Arc Testnet. For production, add stronger anti-cheat validation, rate limiting, backend verification, replay protection, and a real review before handling real value.
