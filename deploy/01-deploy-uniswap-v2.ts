import { ethers } from "hardhat"
import { DeployFunction } from "hardhat-deploy/types"

import { HardhatRuntimeEnvironment } from "hardhat/types"

const func: DeployFunction = async ({ getNamedAccounts, deployments }: HardhatRuntimeEnvironment) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("=====================================================================")
    await deploy("UniswapV2", {
        from: deployer,
        log: true,
        args: [],
        value: ethers.utils.parseEther("5"),
    })
    log("=====================================================================")
}

export default func
