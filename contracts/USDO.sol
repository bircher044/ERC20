// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract USDO is ERC20, Ownable {
    
    address ethAggregator = address(0);

    event aggregatorChanged(address newEthAggregator);
    event stablecoinStatusChanged(address stablecoin, bool newStatus);

    event withdrawed(address currectOwner, uint256 amount);
    event tokenWithdrawed(address stablecoin, uint256 amount);
    
    event tokenSold(address buyer, uint256 amount);
    event tokenSwaped(address buyer, address stablecoin, uint256 USDOAmount);

    mapping(address => bool) acceptableStablecoins;

    constructor() ERC20("USDO", "USD", 18){
        _mint(address(this), 10 ** 37);
        transferOwnership(msg.sender);
    }
    
    function setAggregator(address _newEthAggregator) external onlyOwner {
        ethAggregator = _newEthAggregator;

        emit aggregatorChanged(ethAggregator);
    }

    function getAggregator() public view returns (address){
        return ethAggregator;
    }
    
    function setAcceptableStablecoin(address _acceptableStablecoin, bool _newStatus) external onlyOwner {
        require(acceptableStablecoins[_acceptableStablecoin] != _newStatus, "USDO: Current status is equal to yours");

        acceptableStablecoins[_acceptableStablecoin] = _newStatus;
        emit stablecoinStatusChanged(_acceptableStablecoin, _newStatus);
    }

    function getstablecoinStatus(address _stablecoin) public view returns (bool){
        return acceptableStablecoins[_stablecoin];
    }

    function buy() external payable{
        require(ethAggregator != address(0), "USDO: contract is on pause");

        AggregatorV3Interface oracle = AggregatorV3Interface(ethAggregator);

        (, int256 answer,,,) = oracle.latestRoundData();
        uint8 oracleDecimals = oracle.decimals();
        uint256 USDOAmount = (msg.value * uint256(answer)) / (10 ** (oracleDecimals));

        _transfer(address(this), msg.sender, USDOAmount);

        emit tokenSold(msg.sender, USDOAmount);
    }

    function swap(address _stablecoin, uint256 _amount) external payable{
        require(ethAggregator != address(0), "USDO: contract is on pause");
        require(acceptableStablecoins[_stablecoin], "USDO: not acceptable coin");

        ERC20 token = ERC20(_stablecoin);

        uint256 USDOAmount = _amount * (10 ** (decimals() - token.decimals()));
        bool success = token.transferFrom(msg.sender, address(this), _amount);
        require(success, "USDO: token receive was failed");

        _transfer(address(this), msg.sender, USDOAmount);

        emit tokenSwaped(msg.sender, _stablecoin, USDOAmount);
    }
    
    function withdraw() external onlyOwner{
        require(address(this).balance > 0, "USDO: zero balance");

        uint256 amount = address(this).balance;
        payable(msg.sender).transfer(amount);

        emit withdrawed(msg.sender, amount);
    }

    function withdrawToken(address _stablecoin) external onlyOwner{
        ERC20 token = ERC20(_stablecoin);
        uint256 contractStablecoinBalance = token.balanceOf(address(this));

        require(contractStablecoinBalance > 0, "USDO: zero stablecoin balance");

        token.transfer(msg.sender, contractStablecoinBalance);

        emit tokenWithdrawed(msg.sender, contractStablecoinBalance);
    }

}
