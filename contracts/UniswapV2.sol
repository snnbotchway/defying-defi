// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7;

import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {IERC20} from "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import {IWETH9} from "./interfaces/IWETH9.sol";

contract UniswapV2 {
    IERC20 public constant USDT = IERC20(0xdAC17F958D2ee523a2206206994597C13D831ec7);
    IUniswapV2Router02 public constant UniswapV2Router02 =
        IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    IWETH9 public WETH;

    constructor() payable {
        WETH = IWETH9(UniswapV2Router02.WETH());

        WETH.deposit{value: 2 ether}();
    }

    function swapEthForUSDT() external {
        uint amountIn = 10 ** WETH.decimals();

        require(WETH.approve(address(UniswapV2Router02), amountIn), "approve failed.");

        address[] memory path = new address[](2);
        path[0] = address(WETH);
        path[1] = address(USDT);
        uint amountOutMin = 1700 * 10 ** USDT.decimals();

        UniswapV2Router02.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            address(this),
            block.timestamp
        );
    }

    function getWethBalance() public view returns (uint256) {
        return WETH.balanceOf(address(this));
    }

    function getUSDTBalance() public view returns (uint256) {
        return USDT.balanceOf(address(this));
    }
}
