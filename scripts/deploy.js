const hre = require("hardhat");

async function main() {
  // Compile the contract
  await hre.run("compile");

  // Get the contract factory for EVoting
  const EVoting = await hre.ethers.getContractFactory("EVoting");

  // Deploy the contract
  const eVoting = await EVoting.deploy();

  // Wait for the deployment to complete
  await eVoting.deployed();

  // Log the deployed contract address
  console.log("EVoting contract deployed to:", eVoting.address);
}

// Run the deployment script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });