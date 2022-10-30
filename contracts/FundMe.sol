// SPDX-License-Identifier: MIT
// prgma
pragma solidity ^0.8.8;

//imports
import "./PriceConverter.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

//error
error FundMe__NotOwner();

//library, interfaces, contracts

/**
 * @title A contract for crowd funding
 * @author Manish Sahu
 * @notice This contract is to show demo for collect crowd funding
 * @dev This implements price feeds as library
 */

contract FundMe {
    using PriceConverter for uint256;

    uint256 public constant MINIMUM_USD = 5 * 10**18; // constant variables saves the gas.
    address[] public funders;
    mapping(address => uint256) public addressToAmountFunders;
    AggregatorV3Interface public priceFeed;

    function fund() public payable {
        require(
            msg.value.getConversionRate(priceFeed) >= MINIMUM_USD,
            "Did't send enough!"
        );
        funders.push(msg.sender);
        addressToAmountFunders[msg.sender] = msg.value;
    }

    address public immutable i_owner;

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function withdraw() public onlyOwner {
        for (
            uint256 fundersIndex = 0;
            fundersIndex < funders.length;
            fundersIndex++
        ) {
            addressToAmountFunders[funders[fundersIndex]] = 0; // set 0 funded value for everyone.
        }
        // sending the balance to funder.
        //transfer method: returns error if transaction failed.
        // payable(msg.sender).transfer(address(this).balance); // payable(msg.sender) is used for payable address in solidity.
        //send method: returns bool if failed.
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "send failed");
        // call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "call failed");
        funders = new address[](0); // set the funders array refreshly with 0 objects.
    }

    function cheaperWithdraw() public onlyOwner {
        address[] memory m_funders = funders;
        for (
            uint256 fundersIndex = 0;
            fundersIndex < m_funders.length;
            fundersIndex++
        ) {
            addressToAmountFunders[m_funders[fundersIndex]] = 0; // set 0 funded value for everyone.
        }
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "call failed");
        funders = new address[](0); // set the funders array refreshly with 0 objects.
    }

    modifier onlyOwner() {
        // require(i_owner == msg.sender, "Sender is not the owner");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    // if somebody by mistake sends the ETH without calling the fund function.
    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }
}
