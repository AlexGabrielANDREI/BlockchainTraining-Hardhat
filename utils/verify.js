const { run } = require("hardhat");
//hardhat-verify - npm install --save-dev @nomicfoundation/hardhat-verify
async function verify(contractAddress, args) {
  console.log("verifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("already verified!");
    } else {
      console.log(error);
    }
  }
}

module.exports = { verify };
