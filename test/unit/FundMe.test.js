const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { expect, assert } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");
//RUN ONLY IN DEVELOPMENT CHAINS
!developmentChains.includes(network.name) //action
  ? describe.skip
  : describe("FundMe", async () => {
      let fundMe;
      let deployer;
      let mockV3Aggregator;
      const sendValue = ethers.utils.parseEther("1"); //1eth
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture("all"); //run through all my deploy scripts and deploy all of the sc tests
        fundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });
      //here is tested if the address that is provided through the constructor when the contract is deployed it
      //is the same with the address in the moking
      describe("constructor", async () => {
        it("sets the aggregator addresses correctly", async () => {
          const response = await fundMe.priceFeed();
          assert.equal(response, mockV3Aggregator.address);
        });
      });

      describe("fund", async () => {
        it("Fails if you don't send enough ETH", async () => {
          await expect(fundMe.fund()).to.be.revertedWith(
            "Didn't send enough. You need to spend more ETH!"
          );
        });

        it("updated the amount funded data structure", async () => {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.addressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });

        it("Adds funder to array of funders", async () => {
          await fundMe.fund({ value: sendValue });
          const funder = await fundMe.funders(0);
          assert.equal(funder, deployer);
        });
      });
      describe("withdraw", async () => {
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue });
        });

        it("withdraw eth from a single founder", async () => {
          //Arrange
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          //act
          const transasctionResponse = await fundMe.Withdraw();
          const transactionReceipt = await transasctionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          //assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
        });
        it("allow us to withdraw with multiple funders", async () => {
          //arrange
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            const fundeMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundeMeConnectedContract.fund({ value: sendValue });
          }
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          //act
          const transasctionResponse = await fundMe.Withdraw();
          const transactionReceipt = await transasctionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);
          //assert
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
          //make sure that the funders are reset properly
          await expect(fundMe.funders(0)).to.be.reverted;

          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.addressToAmountFunded(accounts[i].address),
              0
            );
          }
        });

        it("only allows the owner to withdraw", async () => {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const withdrawAccountCall = await fundMe.connect(attacker);

          await expect(withdrawAccountCall.Withdraw()).to.be.reverted;
        });
      });
    });
