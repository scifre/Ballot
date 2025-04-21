
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.28", // Use a valid Solidity version
  defaultNetwork: "hardhat", // Default to Hardhat's in-memory blockchain
  networks: {
    hardhat: {}, // In-memory blockchain for testing
    localhost: {
      url: "http://127.0.0.1:8545", // Local Ethereum node (e.g., Hardhat node or Ganache)
    },
  },
};
