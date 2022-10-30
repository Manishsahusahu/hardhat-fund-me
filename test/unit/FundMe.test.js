const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe, deployer, mockV3Aggregator;
          let sendValue = ethers.utils.parseUnits("1"); // convert 1 ehter into wei.
          beforeEach(async function () {
              // deploy our fund me contract using hardhat deploy
              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["all"]);
              fundMe = await ethers.getContract("FundMe", deployer);
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              );
          });

          describe("cunstructor", async function () {
              it("sets the aggregator address correctly", async function () {
                  const response = await fundMe.priceFeed();
                  assert.equal(response, mockV3Aggregator.address);
              });
          });
          describe("fund", async function () {
              it("Fails if you don't send enough ETH", async function () {
                  expect(fundMe.fund()).to.be.revertedWith(
                      "Did't send enough!"
                  );
              });
              it("updated the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.addressToAmountFunders(
                      deployer
                  );
                  assert.equal(sendValue.toString(), response.toString());
              });
              it("add funder to array of funders", async function () {
                  await fundMe.fund({ value: sendValue });
                  const funder = await fundMe.funders(0);
                  assert.equal(funder, deployer);
              });
          });
          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue });
              });
              it("withdraw ETH from a single funder", async function () {
                  // arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  //act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);

                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  //assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  );
              });
              it("is allows us to withdraw with multiple funders", async () => {
                  // Arrange
                  const accounts = await ethers.getSigners();
                  for (i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  // Act
                  const transactionResponse = await fundMe.withdraw();
                  // Let's comapre gas costs :)

                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const withdrawGasCost = gasUsed.mul(effectiveGasPrice);
                  console.log(`GasCost: ${withdrawGasCost}`);
                  console.log(`GasUsed: ${gasUsed}`);
                  console.log(`GasPrice: ${effectiveGasPrice}`);
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  // Assert
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(withdrawGasCost).toString()
                  );
                  // Make sure that funders array is reset propery
                  await expect(fundMe.funders(0)).to.be.reverted; // at 0th position of funders array we should get an error.

                  for (i = 1; i < 6; i++) {
                      const funderBalance = await fundMe.addressToAmountFunders(
                          accounts[i].address
                      );
                      assert.equal(funderBalance, 0);
                      // assert.equal(funderBalance.toString(), "0");
                  }
              });
              it("only allows to owner to withdraw", async function () {
                  const accounts = await ethers.getSigners();
                  const attacker = accounts[1];
                  const attackerConnectedContract = fundMe.connect(attacker);
                  await expect(attackerConnectedContract.withdraw()).to.be
                      .reverted;
              });
          });
      });
