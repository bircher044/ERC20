// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDC is ERC20{
    constructor() ERC20("USD Coin", "USDC", 8){
        _mint(msg.sender, type(uint128).max);
    }
}