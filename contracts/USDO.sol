// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "hardhat/console.sol";

contract USDO is ERC20, Ownable {
    
    address ethAggregator = address(0);

    event aggregatorChanged(address newEthAggregator);
    event tokenSold(address buyer, uint256 amount);
    event withdrawed(address currectOwner, uint256 amount);

    constructor() ERC20("USDO", "USD"){
        _mint(address(this), 10 ** 9);
        transferOwnership(msg.sender);
    }
    
    function setAggregator(address _newEthAggregator) public onlyOwner {
        ethAggregator = _newEthAggregator;

        emit aggregatorChanged(ethAggregator);
    }

    function getAggregator() public view returns (address){
        return ethAggregator;
    }
    
    function withdraw() public onlyOwner{
        require(address(this).balance > 0, "USDO: zero balance");

        uint256 amount = address(this).balance;
        payable(msg.sender).transfer(amount);

        emit withdrawed(msg.sender, amount);
    }

    receive() external payable{
        require(ethAggregator != address(0), "USDO: contract is on pause");

        AggregatorV3Interface oracle = AggregatorV3Interface(ethAggregator);

        (, int256 answer,,,) = oracle.latestRoundData();

        uint256 tokenAmount = (msg.value * uint256(answer)) / (10 ** decimals());
        
        require(balanceOf(address(this)) >= tokenAmount, "USDO: not enought tokens left");

        _transfer(address(this), msg.sender, tokenAmount);

        emit tokenSold(msg.sender, tokenAmount);
    }
    
}
