const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
    const deployer = await getNamedAccounts().deployer;
    const fundMe = await ethers.getContract("FundMe", deployer);
    console.log("funding contract ...");

    const sendValue = await ethers.utils.parseEther("1");
    const transactionResponse = await fundMe.fund({ value: sendValue });
    await transactionResponse.wait(1);
    console.log("funded");
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
