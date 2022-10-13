# Part 3: Building a DEX platform

**Decentralized exchange (DEX)** is a peer-to-peer marketplace where transactions occur directly between traders. Specifically, DEXs are a set of smart contracts that establish the prices of various tokens against each algorithmically and use “liquidity pools” to facilitate trades. 

**Liquidity pool** is a pot of assets locked within a smart contract, which can be used for exchanges, loans and other applications. Investors who lock funds in a liquidity pool for rewards are called **liquidity providers**. Anyone can become a liquidity provider by depositing an equivalent value of each underlying token in return for pool shares (also called LP tokens). Shareholders can redeem the underlying assets at any time and claim pro-rata protocol fees as rewards, which are collected from each exchange made by traders.

The protocol in this part is derived from [Uniswap v2](https://docs.uniswap.org/protocol/V2/introduction), where we use [constant product formula x * y = k](https://docs.uniswap.org/protocol/V2/concepts/protocol-overview/how-uniswap-works) to determine exchange prices. A formal specification of the constant product market maker model can be found [here](https://github.com/runtimeverification/verified-smart-contracts/blob/uniswap/uniswap/x-y-k.pdf).

## Swap interface
In this part, you need to implement basic functions of DEXs in `contracts/Swap.sol` to manage a liquidity pool made up of reserves of two sAsset tokens and enable exchanges between them. Please follow the below specifications and the interfaces defined in `contracts/interfaces/ISwap.sol`. 

### State variables

* `token0` / `token1`: addresses of a pair of sAsset tokens
* `reserve0` / `reserve1`: quantity of each sAsset token in the pool
* `totalShares`: the total amount of shares owned by all liquidity providers
* `shares`: a mapping from the address of a liquidity provider to the number of shares owned by the liquidity provider. `shares[LP] / totalShares` represents the relative proportion of total reserves that each liquidity provider has contributed



### Functions
There are some functions already implemented for the initial setup.

* `init` is used by the first liquidity provider (in our project it should be the owner of the contract) to deposit both tokens with equal values. The ratio of tokens defines the initial exchange rate and reflects the price of two tokens in the global market as the liquidity provider believes. The amount of initial shares follows [Uniswap v2 (section 3.4)](https://uniswap.org/whitepaper.pdf) and is set to be equal to the geometric mean of the amounts deposited: `shares = sqrt(amount0 * amount1)`.
* `sqrt` is a helper function to calculate square root.
* `getReserves` is a view function that returns the reserves of two tokens.
* `getTokens` is a view function that returns the addresses of two tokens.
* `getShares` is a view function that returns the number of shares owned by the given address.

The remaining functions are left for you to implement.

* `addLiquidity` is used by future liquidity providers to deposit tokens, and will generate new shares based on the token amount in the deposit w.r.t. the pool. Adding liquidity requires an equivalent value of two tokens. Callers need to specify the amount of token 0 they want to deposit (`amount0`) and the amount of token 1 required to be added (`amount1`) is determined using the reserve rate at the moment of their deposit, i.e.,`amount1 = reserve1 * amount0 / reserve0`. And the amount of shares received by the liquidity provider is: `new_shares = total_shares * amount0 / reserve0`.
* `token0To1` / `token1To0` are the functions for converting token 0/1 to token 1/0 while maintaining the relationship `reserve0 * reserve1 = invariant`. The input specifies the number of source tokens sent to the smart contract, the function then computes the number of target tokens sent to the caller based on the current price rate and the input (after subtracting the 0.3% protocol fee). For example, to exchange 1000 token 0 for token 1, with original reserves`(reserve0, reserve1) = (1000000, 1000000)` in the pool, you will get 996 token 1 as a return:
    
    ```
    token0_sent = 1000
    protocol_fee = 1000 * 0.3% = 3
    token0_to_exchange = 1000 * (1 - 0.3%) = 997
    
    invariant = 1000000 * 1000000 
              = (1000000 + token0_to_exchange) * (1000000 - token1_to_return)
    
    token1_to_return = 1000000 - 1000000 * 1000000 / (1000000 + 997) = 996
    Thus, token_received = 996
    ```
    After the exchange, the protocol fee is added to reserves. So the new reserves become `(reserve0, reserve1) = (1001000, 999004)`. As a result, the invariant actually slightly increases to `1001000 * 999004`. This functions as a payout to shareholders.
* `removeLiquidity` is used by liquidity providers to withdraw their proportional share of tokens from the pool. Tokens are withdrawn at the current reserve ratio, given the number of shares to withdraw, the amounts of tokens are calculated by
    ```
    amount0 = reserve0 * withdrawn_shares / total_shares
    amount1 = reserve1 * withdrawn_shares / total_shares
    ```

    Notice that protocol fees taken during trades are already included in liquidity pools but generate no extra shares, thus the amounts of withdrawn tokens include all fees collected since the liquidity was first added.


## Testing

Similar to Part 2, we will use Truffle to test smart contracts and Ganache to simulate a local blockchain. The testing script is provided in `test/test.js`.

1. Run `ganache-cli` to run a node of the local blockchain.
2.  `cd Part3` and run `npm install` to install openzeppelin packages. 
3. Replace the `Swap.sol` contract in the `contracts` folder with your implementation. Run `truffle test`.


## Submission
Rename the `Swap.sol` to `netid1-netid2.sol` (sort netids in alphabetic order) and upload it on compass2g. Submission from one team member is sufficient. The grading will be conducted using truffle with more tests, including both valid and invalid operations (such as trade with an incorrect ratio of tokens, and withdrawal that exceeds share proportions).




