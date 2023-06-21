import { expect } from "chai"
import { deployments, ethers } from "hardhat"

import { loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers"

import { CompoundV2, ICErc20, IWETH9 } from "../typechain"
import { IERC20 } from "../typechain/@uniswap/v2-periphery/contracts/interfaces/"

describe("CompoundV2", function () {
    const deployCompoundV2Fixture = async () => {
        const accounts = await ethers.getSigners()
        const [deployer, otherAccount] = accounts

        await deployments.fixture()

        const compoundV2: CompoundV2 = await ethers.getContract("CompoundV2", deployer)

        const wethContract: IWETH9 = await ethers.getContractAt("IWETH9", await compoundV2.WETH())
        const wethDecimals = await wethContract.decimals()

        const daiContract: IERC20 = await ethers.getContractAt("IERC20", await compoundV2.DAI())
        const daiDecimals = await daiContract.decimals()

        const cDaiContract: ICErc20 = await ethers.getContractAt("ICErc20", await compoundV2.cDAI())
        const cDaiDecimals = await cDaiContract.decimals()

        return {
            compoundV2,
            wethDecimals,
            daiContract,
            daiDecimals,
            cDaiContract,
            cDaiDecimals,
            accounts,
            deployer,
            otherAccount,
        }
    }

    describe("Deployment", function () {
        it("Gets some WETH and DAI", async () => {
            const { compoundV2, daiDecimals, wethDecimals } = await loadFixture(deployCompoundV2Fixture)
            const wethBalance = ethers.utils.formatUnits(await compoundV2.getWethBalance(), wethDecimals)
            const daiBalance = ethers.utils.formatUnits(await compoundV2.getDAIBalance(), daiDecimals)

            expect(Number(daiBalance)).to.equal(1000)
            expect(Number(wethBalance)).to.equal(2)
            console.log("WETH Balance:", wethBalance)
            console.log("DAI Balance:", daiBalance)
        })
    })

    describe("supplyDAIToCompound", function () {
        it("Supplies DAI ToCompound", async () => {
            const { compoundV2, daiContract, daiDecimals } = await loadFixture(deployCompoundV2Fixture)
            const initialDaiBalance = ethers.utils.formatUnits(await compoundV2.getDAIBalance(), daiDecimals)
            console.log("Initial DAI Balance:", initialDaiBalance)

            await expect(compoundV2.supplyDAIToCompound()).to.changeTokenBalance(
                daiContract,
                compoundV2,
                ethers.utils.parseEther("1000").mul(-1)
            )

            const finalDaiBalance = ethers.utils.formatUnits(await compoundV2.getDAIBalance(), daiDecimals)
            console.log("Final DAI Balance:", finalDaiBalance)
        })
    })

    describe("redeemCDaiTokens", function () {
        it("Gets our DAI back", async () => {
            const { compoundV2, daiContract, daiDecimals } = await loadFixture(deployCompoundV2Fixture)
            const startingDaiBalance = ethers.utils.formatUnits(await compoundV2.getDAIBalance(), daiDecimals)
            console.log("Starting DAI Balance:", startingDaiBalance)

            await compoundV2.supplyDAIToCompound()
            const initialDaiBalance = ethers.utils.formatUnits(await compoundV2.getDAIBalance(), daiDecimals)
            console.log("Initial DAI Balance:", initialDaiBalance)
            await mine(200000) // Mine many blocks to see if we gain some interest

            await expect(compoundV2.redeemCDaiTokens(true)).to.changeTokenBalance(
                daiContract,
                compoundV2,
                1001067848766050420436n
            )

            const finalDaiBalance = ethers.utils.formatUnits(await compoundV2.getDAIBalance(), daiDecimals)
            console.log("Final DAI Balance:", finalDaiBalance)
        })
    })

    describe("borrowEth", function () {
        it("Borrows Eth", async () => {
            const { compoundV2, daiDecimals } = await loadFixture(deployCompoundV2Fixture)
            const startingDaiBalance = ethers.utils.formatUnits(await compoundV2.getDAIBalance(), daiDecimals)
            console.log("Starting DAI Balance:", startingDaiBalance)

            await expect(compoundV2.borrowEth()).to.changeEtherBalance(
                compoundV2,
                ethers.utils.parseEther("0.002")
            )

            const finalDaiBalance = ethers.utils.formatUnits(await compoundV2.getDAIBalance(), daiDecimals)
            console.log("Final DAI Balance:", finalDaiBalance)
        })
    })

    describe("repayEthBorrow", function () {
        it("Gets our cDAI back", async () => {
            const { compoundV2 } = await loadFixture(deployCompoundV2Fixture)
            await compoundV2.borrowEth()

            await expect(compoundV2.repayEthBorrow()).to.changeEtherBalance(compoundV2, -2000000022863288)
        })
    })
})
