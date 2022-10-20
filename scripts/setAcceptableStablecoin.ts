import {ethers} from "hardhat";
import {USDO__factory} from "../typechain-types";
import * as dotenv from 'dotenv';

const USDOContractAddress = "0xFa1e72d4D175384163f744752532EbeC989d3418";
const StablecoinContractAddress = "0x9447ADd4352aB3AcbD15C8EfC3eBAe0D46Ea3d6e";

const main = async () => {
    const signer = new ethers.Wallet((String(process.env.USDO_OWNER_PRIVATE_KEY)), ethers.provider);

    const USDO = USDO__factory.connect(USDOContractAddress, signer);
    await (await USDO.setAcceptableStablecoin(StablecoinContractAddress, true)).wait();
};

main();