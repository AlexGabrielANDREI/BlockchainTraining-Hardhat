//the testing stage in the last step in our development journey
//in this stage we assume that our smart contract is already deployed ON A TESTNET
const { getNamedAccounts, ethers, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
const { assert } = require("chai");

developmentChains.includes(network.name) //action
  ? describe.skip //action if true
  : describe("FundMe", async () => {
      //action if false
      let fundMe;
      let deployer;

      const sendValue = ethers.utils.parseEther("1"); //1eth
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        fundMe = await ethers.getContract("FundMe", deployer);
      });

      it("allows people to fund and withdraw", async function () {
        await fundMe.fund({ value: sendValue });
        await fundMe.Withdraw();
        const endingBalance = await fundMe.provider.getBalance(fundMe.address);
        assert.equal(endingBalance.toString(), "0");
      });
    });
