import { expect } from "chai"
import { deployments, ethers } from "hardhat"

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"

import { IWETH9, UniswapV2 } from "../../typechain"

describe("UniswapV2", function () {
    const deployUniswapV2Fixture = async () => {
        const accounts = await ethers.getSigners()
        const [deployer, otherAccount] = accounts

        await deployments.fixture()

        const uniswapV2: UniswapV2 = await ethers.getContract("UniswapV2", deployer)

        return {
            uniswapV2,
            accounts,
            deployer,
            otherAccount,
        }
    }

    describe("Deployment", function () {
        it("deposits 2 ETH for 2 WETH", async () => {
            const { uniswapV2 } = await loadFixture(deployUniswapV2Fixture)
            const wethBalance = await uniswapV2.getWethBalance()

            expect(wethBalance).to.equal(ethers.utils.parseEther("2"))
        })
    })

    describe("swapEthForUSDT", function () {
        it("swaps 1 WETH for some USDT", async () => {
            const { uniswapV2 } = await loadFixture(deployUniswapV2Fixture)
            const initialWethBal = await uniswapV2.getWethBalance()
            const initialUsdtBal = await uniswapV2.getUSDTBalance()
            console.log("Initial USDT balance:", ethers.utils.formatUnits(initialUsdtBal, 6))
            const wethContract: IWETH9 = await ethers.getContractAt("IWETH9", await uniswapV2.WETH())
            const oneEther = ethers.utils.parseEther("1")
            await wethContract.approve(uniswapV2.address, oneEther)

            await uniswapV2.swapEthForUSDT()

            const finalWethBal = await uniswapV2.getWethBalance()
            const finalUsdtBal = await uniswapV2.getUSDTBalance()
            console.log("Final USDT balance:", ethers.utils.formatUnits(finalUsdtBal, 6))
            expect(initialWethBal.sub(oneEther)).to.equal(finalWethBal)
            expect(finalUsdtBal).to.greaterThan(initialUsdtBal)
        })
    })
})
