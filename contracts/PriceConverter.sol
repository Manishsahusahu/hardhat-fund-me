// SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getPrice(AggregatorV3Interface priceFeed)
        public
        view
        returns (uint256)
    {
        // ABI
        // ADDRESS 0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e is the address of contract ETH to USD.
        (, int256 price, , , ) = priceFeed.latestRoundData(); // will return the price into USD.
        return uint256(price * 1e10); // because contract will get ether in 1e18 manner(18 decimal zeroes) and price variable will recieve the data in 8 decimal zeroes, so to match them we have to multiply price with 1e10.
    }

    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed);
        return ((ethPrice * ethAmount) / 1e18);
    }
}
