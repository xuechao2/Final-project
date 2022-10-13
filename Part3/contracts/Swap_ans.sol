// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ISwap.sol";
import "./sAsset.sol";

contract Swap is Ownable, ISwap {

    address token0;
    address token1;
    uint reserve0;
    uint reserve1;
    mapping (address => uint) shares;
    uint public totalShares;

    constructor(address addr0, address addr1) {
        token0 = addr0;
        token1 = addr1;
    }

    function init(uint token0Amount, uint token1Amount) external override onlyOwner {
        require(reserve0 == 0 && reserve1 == 0, "init - already has liquidity");
        require(token0Amount > 0 && token1Amount > 0, "init - both tokens are needed");
        
        require(sAsset(token0).transferFrom(msg.sender, address(this), token0Amount));
        require(sAsset(token1).transferFrom(msg.sender, address(this), token1Amount));
        reserve0 = token0Amount;
        reserve1 = token1Amount;
        totalShares = sqrt(token0Amount * token1Amount);
        shares[msg.sender] = totalShares;
    }

    // https://github.com/Uniswap/v2-core/blob/v1.0.1/contracts/libraries/Math.sol
    function sqrt(uint y) internal pure returns (uint z) {
        if (y > 3) {
            z = y;
            uint x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function getReserves() external view returns (uint, uint) {
        return (reserve0, reserve1);
    }

    function getTokens() external view returns (address, address) {
        return (token0, token1);
    }

    function getShares(address LP) external view returns (uint) {
        return shares[LP];
    }

    function addLiquidity(uint token0Amount) external override {
        require(reserve0 != 0 && reserve1 != 0, "pool is not initialized");
        uint token1Amount = token0Amount * reserve1 / reserve0; 
        uint sharesMinted = token0Amount * totalShares / reserve0;

        require(sAsset(token0).transferFrom(msg.sender, address(this), token0Amount));
        require(sAsset(token1).transferFrom(msg.sender, address(this), token1Amount));
        reserve0 += token0Amount;
        reserve1 += token1Amount;
        shares[msg.sender] += sharesMinted;
        totalShares += sharesMinted;
    }

    function removeLiquidity(uint withdrawShares) external override {
        require(withdrawShares <= shares[msg.sender], "not enough shares to withdraw");
        uint token0Amount = reserve0 * withdrawShares / totalShares;
        uint token1Amount = reserve1 * withdrawShares / totalShares;
        sAsset(token0).transfer(msg.sender, token0Amount);
        sAsset(token1).transfer(msg.sender, token1Amount);
        totalShares -= withdrawShares;
        shares[msg.sender] -= withdrawShares;
        reserve0 -= token0Amount;
        reserve1 -= token1Amount;
    }

    function token0To1(uint token0Amount) external override {
        uint token1Amount = price(token0Amount, reserve0, reserve1);
        require(sAsset(token0).transferFrom(msg.sender, address(this), token0Amount));
        require(token1Amount > 0, "not enough tokens");

        sAsset(token1).transfer(msg.sender, token1Amount);
        reserve0 += token0Amount;
        reserve1 -= token1Amount;
    }

    function token1To0(uint token1Amount) external override {
        uint token0Amount = price(token1Amount, reserve1, reserve0);
        require(sAsset(token1).transferFrom(msg.sender, address(this), token1Amount));
        require(token0Amount > 0, "not enough tokens");

        sAsset(token0).transfer(msg.sender, token0Amount);
        reserve0 -= token0Amount;
        reserve1 += token1Amount;
    }

    function price(uint input_amount, uint input_reserve, uint output_reserve) public pure returns (uint) {
        uint input_amount_with_fee = input_amount * 997;
        uint numerator = input_amount_with_fee * output_reserve;
        uint denominator = input_reserve * 1000 + input_amount_with_fee;
        return numerator / denominator;
    }


    
}