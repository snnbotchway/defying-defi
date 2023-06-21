// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8;

import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {IUniswapV2Factory} from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import {IERC20} from "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import {IWETH9} from "./interfaces/IWETH9.sol";

import "hardhat/console.sol";

contract UniswapV2 {
    IERC20 public constant DAI = IERC20(0x6B175474E89094C44Da98b954EedeAC495271d0F);
    IUniswapV2Router02 public constant UniswapV2Router02 =
        IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    IUniswapV2Factory public constant UniswapV2Factory =
        IUniswapV2Factory(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f);
    IWETH9 public WETH;
    IERC20 public pair;

    event LiquidityAdded(uint amountA, uint amountB, uint liquidity);

    constructor() payable {
        // Get this contract some WETH
        WETH = IWETH9(UniswapV2Router02.WETH());
        WETH.deposit{value: 2 ether}();

        // Get this contract some DAI
        uint256 daiAmount = 1000 * 10 ** DAI.decimals(); // 1000 DAI
        address[] memory daiPath = new address[](2);
        daiPath[0] = address(WETH);
        daiPath[1] = address(DAI);
        UniswapV2Router02.swapETHForExactTokens{value: 1 ether}(
            daiAmount,
            daiPath,
            address(this),
            block.timestamp
        );

        pair = IERC20(UniswapV2Factory.getPair(address(WETH), address(DAI)));
    }

    /**
     * @dev Swap WETH owned by this contract for some DAI.
     */
    function swapEthForDAI() external {
        uint amountIn = 10 ** WETH.decimals();

        require(WETH.approve(address(UniswapV2Router02), amountIn), "approve failed.");

        address[] memory path = new address[](2);
        path[0] = address(WETH);
        path[1] = address(DAI);
        uint amountOutMin = 1700 * 10 ** DAI.decimals();

        UniswapV2Router02.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            address(this),
            block.timestamp
        );
    }

    /**
     * @dev Add liquidity for DAI and WETH pair.
     * @return amountA
     * @return amountB
     * @return liquidity
     */
    function addLiquidity() external returns (uint amountA, uint amountB, uint liquidity) {
        uint256 amountADesired = 1000 * 10 ** WETH.decimals();
        uint256 amountBDesired = 1000 * 10 ** DAI.decimals();

        require(WETH.approve(address(UniswapV2Router02), amountADesired), "approve failed WETH");
        require(DAI.approve(address(UniswapV2Router02), amountBDesired), "approve failed DAI");

        (amountA, amountB, liquidity) = UniswapV2Router02.addLiquidity(
            address(DAI),
            address(WETH),
            amountADesired,
            amountBDesired,
            1,
            1,
            address(this),
            block.timestamp
        );

        emit LiquidityAdded(amountA, amountB, liquidity);
    }

    /**
     * @dev Remove liquidity for DAI and WETH pair.
     * @return amountA
     * @return amountB
     */
    function removeLiquidity() external returns (uint amountA, uint amountB) {
        uint256 liquidity = getLiquidityBalance();
        require(pair.approve(address(UniswapV2Router02), liquidity), "approve failed pair");

        (amountA, amountB) = UniswapV2Router02.removeLiquidity(
            address(DAI),
            address(WETH),
            liquidity,
            1,
            1,
            address(this),
            block.timestamp
        );
    }

    function getWethBalance() public view returns (uint256) {
        return WETH.balanceOf(address(this));
    }

    function getDAIBalance() public view returns (uint256) {
        return DAI.balanceOf(address(this));
    }

    function getWETHBalance() public view returns (uint256) {
        return WETH.balanceOf(address(this));
    }

    function getLiquidityBalance() public view returns (uint256) {
        return pair.balanceOf(address(this));
    }
}
