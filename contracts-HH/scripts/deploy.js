const hre = require('hardhat');

async function main() {
    console.log('Deploying WalkScapeCore to Push Chain...');

    // Get the deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log('Deploying with account:', deployer.address);

    // Check account balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log('Account balance:', hre.ethers.formatEther(balance), 'ETH');

    // Deploy the contract
    const WalkScapeCore = await hre.ethers.getContractFactory('WalkScapeCore');
    console.log('Deploying contract...');

    const walkScapeCore = await WalkScapeCore.deploy(deployer.address);
    await walkScapeCore.waitForDeployment();

    const address = await walkScapeCore.getAddress();
    console.log(`WalkScapeCore deployed to: ${address}`);

    // Save deployment info
    const deploymentInfo = {
        contractName: 'WalkScapeCore',
        contractAddress: address,
        deployer: deployer.address,
        network: hre.network.name,
        blockNumber: await hre.ethers.provider.getBlockNumber(),
        timestamp: new Date().toISOString(),
    };

    console.log('Deployment completed successfully!');
    console.log('Contract Address:', address);
    console.log('Network:', hre.network.name);
    console.log('Transaction hash will be displayed above');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});