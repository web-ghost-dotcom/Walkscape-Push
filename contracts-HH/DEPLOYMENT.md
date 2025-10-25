# WalkScapeCore Push Chain Deployment

This directory contains the Hardhat setup for deploying WalkScapeCore to Push Chain testnet.

## Prerequisites

1. **Node.js and npm** - Make sure you have Node.js installed
2. **Push Chain testnet tokens** - Get test tokens from the [Push Chain Faucet](https://faucet.push.org/)
3. **MetaMask or similar wallet** - To manage your deployer account

## Setup

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file and add your private key:
   ```
   PRIVATE_KEY=your_private_key_here_without_0x_prefix
   ```
   
   ⚠️ **Security Warning**: Never commit your `.env` file to version control!

3. **Get testnet tokens**:
   - Visit [Push Chain Faucet](https://faucet.push.org/)
   - Enter your wallet address
   - Request test tokens for deployment

## Deployment

### Compile the contract
```bash
npx hardhat compile
```

### Deploy to Push Chain testnet
```bash
npx hardhat run scripts/deploy.js --network push_testnet
```

### Alternative RPC endpoint (if the first one fails)
```bash
npx hardhat run scripts/deploy.js --network push_testnet_alt
```

## Contract Details

- **Contract**: WalkScapeCore
- **Network**: Push Chain Testnet
- **Chain ID**: 42101
- **RPC URL**: https://evm.rpc-testnet-donut-node1.push.org/

## After Deployment

1. **Save the contract address** - You'll need it for frontend integration
2. **View on Explorer** - Visit [Push Chain Explorer](https://donut.push.network/) to view your deployed contract
3. **Test the contract** - Use the contract address to interact with your deployed contract

## Network Configuration

The hardhat.config.js includes two Push Chain testnet endpoints:
- Primary: `https://evm.rpc-testnet-donut-node1.push.org/`
- Alternative: `https://evm.rpc-testnet-donut-node2.push.org/`

## Troubleshooting

1. **Insufficient funds error**: Make sure you have enough test tokens from the faucet
2. **Network timeout**: Try using the alternative RPC endpoint
3. **Compilation errors**: Ensure all dependencies are installed correctly

## Next Steps

After deployment, you can:
1. Integrate the contract address with your frontend
2. Set up contract interactions using ethers.js or web3.js
3. Test the contract functions through the Push Chain explorer