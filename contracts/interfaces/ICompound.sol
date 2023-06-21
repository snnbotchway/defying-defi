// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import {IERC20} from "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";

interface ICErc20 is IERC20 {
    function mint(uint256) external returns (uint256);

    function exchangeRateCurrent() external returns (uint256);

    function supplyRatePerBlock() external returns (uint256);

    function redeem(uint) external returns (uint);

    function redeemUnderlying(uint) external returns (uint);

    function borrow(uint256) external returns (uint256);

    function borrowRatePerBlock() external view returns (uint256);

    function borrowBalanceCurrent(address) external returns (uint256);

    function repayBorrow(uint256) external returns (uint256);
}

interface ICEth {
    function mint() external payable;

    function borrow(uint256) external returns (uint256);

    function repayBorrow() external payable;

    function borrowBalanceCurrent(address) external returns (uint256);

    function borrowRatePerBlock() external view returns (uint256);
}

interface IComptroller {
    function markets(address) external returns (bool, uint256);

    function enterMarkets(address[] calldata) external returns (uint256[] memory);

    function getAccountLiquidity(address) external view returns (uint256, uint256, uint256);
}

interface IPriceFeed {
    function getUnderlyingPrice(address cToken) external view returns (uint);
}
