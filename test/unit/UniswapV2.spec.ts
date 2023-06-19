import { expect } from "chai"
import { deployments, ethers } from "hardhat"

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"

import { IWETH9, UniswapV2 } from "../../typechain"
import { IERC20 } from "../../typechain/@uniswap/v2-periphery/contracts/interfaces/"

describe("UniswapV2", function () {
    const deployUniswapV2Fixture = async () => {
        const accounts = await ethers.getSigners()
        const [deployer, otherAccount] = accounts

        await deployments.fixture()

        const uniswapV2: UniswapV2 = await ethers.getContract("UniswapV2", deployer)

        const wethContract: IWETH9 = await ethers.getContractAt("IWETH9", await uniswapV2.WETH())
        const wethDecimals = await wethContract.decimals()

        const daiContract: IERC20 = await ethers.getContractAt("IERC20", await uniswapV2.DAI())
        const daiDecimals = await daiContract.decimals()

        const pairContract: IERC20 = await ethers.getContractAt("IERC20", await uniswapV2.pair())
        const pairDecimals = await pairContract.decimals()

        return {
            uniswapV2,
            wethContract,
            wethDecimals,
            daiDecimals,
            pairDecimals,
            accounts,
            deployer,
            otherAccount,
        }
    }

    describe("Deployment", function () {
        it("Gets some WETH and DAI", async () => {
            const { uniswapV2, daiDecimals, wethDecimals } = await loadFixture(deployUniswapV2Fixture)
            const wethBalance = ethers.utils.formatUnits(await uniswapV2.getWethBalance(), wethDecimals)
            const daiBalance = ethers.utils.formatUnits(await uniswapV2.getDAIBalance(), daiDecimals)

            expect(Number(daiBalance)).to.equal(1000)
            expect(Number(wethBalance)).to.equal(2)
            console.log("WETH Balance:", wethBalance)
            console.log("DAI Balance:", daiBalance)
        })
    })

    describe("swapEthForDAI", function () {
        it("swaps 1 WETH for some DAI", async () => {
            const { uniswapV2, wethContract, daiDecimals } = await loadFixture(deployUniswapV2Fixture)
            const initialWethBal = await uniswapV2.getWethBalance()
            const initialDaiBal = await uniswapV2.getDAIBalance()
            console.log("Initial DAI balance:", ethers.utils.formatUnits(initialDaiBal, daiDecimals))
            const oneEther = ethers.utils.parseEther("1")
            await wethContract.approve(uniswapV2.address, oneEther)

            await uniswapV2.swapEthForDAI()

            const finalWethBal = await uniswapV2.getWethBalance()
            const finalDaiBal = await uniswapV2.getDAIBalance()
            console.log("Final DAI balance:", ethers.utils.formatUnits(finalDaiBal, daiDecimals))
            expect(initialWethBal.sub(oneEther)).to.equal(finalWethBal)
            expect(finalDaiBal).to.greaterThan(initialDaiBal)
        })
    })

    describe("addLiquidity", function () {
        it("adds liquidity", async () => {
            const { uniswapV2, wethDecimals, daiDecimals, pairDecimals } = await loadFixture(
                deployUniswapV2Fixture
            )
            const initialWethBal = await uniswapV2.getWETHBalance()
            const initialDaiBal = await uniswapV2.getDAIBalance()
            const initialLiquidityTokens = await uniswapV2.getLiquidityBalance()

            await expect(uniswapV2.addLiquidity()).to.emit(uniswapV2, "LiquidityAdded")

            const finalLiquidityTokens = await uniswapV2.getLiquidityBalance()
            const finalWethBal = await uniswapV2.getWETHBalance()
            const finalDaiBal = await uniswapV2.getDAIBalance()
            expect(finalWethBal).to.be.lessThan(initialWethBal)
            expect(finalDaiBal).to.be.lessThan(initialDaiBal)
            expect(finalLiquidityTokens).to.be.greaterThan(initialLiquidityTokens)

            console.log("Initial WETH balance:", ethers.utils.formatUnits(initialWethBal, wethDecimals))
            console.log("Final WETH balance:", ethers.utils.formatUnits(finalWethBal, wethDecimals))
            console.log("Initial DAI balance:", ethers.utils.formatUnits(initialDaiBal, daiDecimals))
            console.log("Final DAI balance:", ethers.utils.formatUnits(finalDaiBal, daiDecimals))
            console.log(
                "Initial liquidity tokens:",
                ethers.utils.formatUnits(initialLiquidityTokens, pairDecimals)
            )
            console.log(
                "Final liquidity tokens:",
                ethers.utils.formatUnits(finalLiquidityTokens, pairDecimals)
            )
        })
    })

    describe("removeLiquidity", function () {
        it("removes liquidity", async () => {
            const { uniswapV2, wethDecimals, daiDecimals, pairDecimals } = await loadFixture(
                deployUniswapV2Fixture
            )
            await uniswapV2.addLiquidity()
            const initialWethBal = await uniswapV2.getWETHBalance()
            const initialDaiBal = await uniswapV2.getDAIBalance()
            const initialLiquidityTokens = await uniswapV2.getLiquidityBalance()

            await uniswapV2.removeLiquidity()

            const finalLiquidityTokens = await uniswapV2.getLiquidityBalance()
            const finalWethBal = await uniswapV2.getWETHBalance()
            const finalDaiBal = await uniswapV2.getDAIBalance()
            expect(finalWethBal).to.be.greaterThan(initialWethBal)
            expect(finalDaiBal).to.be.greaterThan(initialDaiBal)
            expect(finalLiquidityTokens).to.be.lessThan(initialLiquidityTokens)

            console.log("Initial WETH balance:", ethers.utils.formatUnits(initialWethBal, wethDecimals))
            console.log("Final WETH balance:", ethers.utils.formatUnits(finalWethBal, wethDecimals))
            console.log("Initial DAI balance:", ethers.utils.formatUnits(initialDaiBal, daiDecimals))
            console.log("Final DAI balance:", ethers.utils.formatUnits(finalDaiBal, daiDecimals))
            console.log(
                "Initial liquidity tokens:",
                ethers.utils.formatUnits(initialLiquidityTokens, pairDecimals)
            )
            console.log(
                "Final liquidity tokens:",
                ethers.utils.formatUnits(finalLiquidityTokens, pairDecimals)
            )
        })
    })
})
