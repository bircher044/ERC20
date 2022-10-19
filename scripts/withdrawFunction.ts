import {ethers} from "hardhat";
import {USDO__factory} from "../typechain-types";
import * as dotenv from 'dotenv';

const USDOContractAddress = "0xf8F5D03a9FDBC9b0910FFDBdbB77234d2B2601E1";

const aggregatorAddress = "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e";

const main = async () => {
    const signer = new ethers.Wallet((String(process.env.METAMASK_WALLET_PRIVATE_KEY)), ethers.provider);

    const USDO = USDO__factory.connect(USDOContractAddress, signer);
    await (await USDO.withdraw()).wait();
};

main();