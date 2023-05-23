const { network } = require("hardhat");
const { verify } = require("../utils/verify");
const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");
require("dotenv").config();

module.exports = async ({ getNamedAccounts, deployments }) => {
  //const { getNamedAccounts, deployments } = hre;
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let ethUsdPriceFeedAddress;

  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  }
  log("----------------------------------------------------");
  log("Deploying FundMe and waiting for confirmations...");
  const args = [ethUsdPriceFeedAddress];
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args, //put price feed address that is needed in the constructor
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log(`FundMe deployed at ${fundMe.address}`);
  ///verifing contract
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, args);
  }
  log(
    "-------------------------------------------------------------------------------------------"
  );
};
module.exports.tags = ["all", "FundMe"];
