import {ethers} from "hardhat";
import {USDO__factory} from "../typechain-types";
import * as dotenv from 'dotenv';

const USDOContractAddress = "0x2c4905771771349DdBb416c03f83de65eF510553";

const aggregatorAddress = "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e";

const main = async () => {
    const signer = new ethers.Wallet((String(process.env.METAMASK_WALLET_PRIVATE_KEY)), ethers.provider);

    const USDO = USDO__factory.connect(USDOContractAddress, signer);
    await (await USDO.withdraw()).wait();
};

main();