// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8;

import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {IUniswapV2Factory} from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import {IERC20} from "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import {IWETH9} from "./interfaces/IWETH9.sol";
import {ICErc20, ICEth, IComptroller} from "./interfaces/ICompound.sol";

import "hardhat/console.sol";

contract CompoundV2 {
    IERC20 public constant DAI = IERC20(0x6B175474E89094C44Da98b954EedeAC495271d0F);
    ICErc20 public constant cDAI = ICErc20(0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643);
    ICEth public constant cETH = ICEth(0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5);
    IComptroller public constant comptroller = IComptroller(0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B);

    IUniswapV2Router02 public constant UniswapV2Router02 =
        IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    IUniswapV2Factory public constant UniswapV2Factory =
        IUniswapV2Factory(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f);
    IWETH9 public WETH;
    IERC20 public pair;

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
    }

    function supplyDAIToCompound() public returns (uint) {
        uint _numTokensToSupply = 1000 * 10 ** DAI.decimals();

        // Amount of current exchange rate from cToken to underlying
        uint256 exchangeRateMantissa = cDAI.exchangeRateCurrent();
        console.log("Exchange Rate (scaled up): ", exchangeRateMantissa, cDAI.decimals());

        // Amount added to you supply balance this block
        uint256 supplyRateMantissa = cDAI.supplyRatePerBlock();
        console.log("Supply Rate: (scaled up)", supplyRateMantissa, cDAI.decimals());

        // Approve transfer on the ERC20 contract
        DAI.approve(address(cDAI), _numTokensToSupply);

        // Mint cTokens
        uint mintResult = cDAI.mint(_numTokensToSupply);
        console.log("Mint result(should be 0):", mintResult);
        return mintResult;
    }

    function redeemCDaiTokens(bool redeemType) public returns (bool) {
        uint256 amount = cDAI.balanceOf(address(this));
        console.log("Initial contract CDAI bal:", amount, cDAI.decimals());
        uint256 redeemResult;

        if (redeemType == true) {
            // Retrieve your asset based on a cToken amount
            redeemResult = cDAI.redeem(amount);
        } else {
            // Retrieve your asset based on an amount of the asset
            redeemResult = cDAI.redeemUnderlying(amount);
        }

        // Error codes are listed here:
        // https://compound.finance/docs/ctokens#error-codes
        console.log("If this is not 0, there was an error", redeemResult);
        console.log("Final contract CDAI bal:", cDAI.balanceOf(address(this)), cDAI.decimals());

        return true;
    }

    function borrowEth() public returns (uint) {
        uint256 _underlyingToSupplyAsCollateral = 1000 * 10 ** DAI.decimals();
        // Approve transfer of underlying
        DAI.approve(address(cDAI), _underlyingToSupplyAsCollateral);

        // Supply underlying as collateral, get cToken in return
        uint256 error = cDAI.mint(_underlyingToSupplyAsCollateral);
        require(error == 0, "CErc20.mint Error");

        // Enter the market so you can borrow another type of asset
        address[] memory cTokens = new address[](1);
        cTokens[0] = address(cDAI);
        uint256[] memory errors = comptroller.enterMarkets(cTokens);
        if (errors[0] != 0) {
            revert("Comptroller.enterMarkets failed.");
        }

        // Get my account's total liquidity value in Compound
        (uint256 error2, uint256 liquidity, uint256 shortfall) = comptroller.getAccountLiquidity(
            address(this)
        );
        if (error2 != 0) {
            revert("Comptroller.getAccountLiquidity failed.");
        }
        require(shortfall == 0, "account underwater");
        require(liquidity > 0, "account has excess collateral");

        // Borrowing near the max amount will result
        // in your account being liquidated instantly
        console.log("Maximum ETH Borrow (borrow far less!)(In USD)", liquidity);

        // Get the collateral factor for our collateral
        (bool isListed, uint collateralFactorMantissa) = comptroller.markets(address(cDAI));
        console.log("Collateral Factor", collateralFactorMantissa);
        console.log("Is listed", isListed);

        // Get the amount of ETH added to your borrow each block
        uint borrowRateMantissa = cETH.borrowRatePerBlock();
        console.log("Current ETH Borrow Rate", borrowRateMantissa);

        // Borrow a fixed amount of ETH below our maximum borrow amount
        uint256 numWeiToBorrow = 2000000000000000; // 0.002 ETH

        // Borrow, then check the underlying balance for this contract's address
        cETH.borrow(numWeiToBorrow);

        uint256 borrows = cETH.borrowBalanceCurrent(address(this));
        console.log("Current ETH borrow amount");

        return borrows;
    }

    function repayEthBorrow() public returns (bool) {
        console.log("Repaying borrow...");
        uint256 borrows = cETH.borrowBalanceCurrent(address(this));
        console.log("Initial ETH borrow amount", borrows);
        cETH.repayBorrow{value: borrows}();
        console.log("Final ETH borrow amount", cETH.borrowBalanceCurrent(address(this)));
        return true;
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

    receive() external payable {}
}
