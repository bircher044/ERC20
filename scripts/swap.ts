import {ethers} from "hardhat";
import {USDO__factory} from "../typechain-types";
import {USDC__factory} from "../typechain-types";
import * as dotenv from 'dotenv';

const USDOContractAddress = "0xFa1e72d4D175384163f744752532EbeC989d3418";
const StablecoinContractAddress = "0x9447ADd4352aB3AcbD15C8EfC3eBAe0D46Ea3d6e";

const USDCAmountToSwap = 7 * (10 ** 8); 

const main = async () => {

    const signer = new ethers.Wallet((String(process.env.BUYER_PRIVATE_KEY)), ethers.provider);

    const USDO = USDO__factory.connect(USDOContractAddress, signer);
    const USDC = USDC__factory.connect(StablecoinContractAddress, signer);

    await (await USDC.increaseAllowance(USDOContractAddress, USDCAmountToSwap )).wait();
    await (await USDO.swap(StablecoinContractAddress, USDCAmountToSwap)).wait();
};

main();