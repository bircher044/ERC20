import {ethers} from "hardhat";
import {USDO__factory} from "../typechain-types";
import * as dotenv from 'dotenv';

const USDOContractAddress = "0xaAAa5D9E2AE260C9f1FdF9c4204C26a7C8a39525";

const aggregatorAddress = "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e";

const main = async () => {
    const signer = new ethers.Wallet((String(process.env.METAMASK_WALLET_PRIVATE_KEY)), ethers.provider);

    const USDO = USDO__factory.connect(USDOContractAddress, signer);
    await (await USDO.setAggregator(aggregatorAddress)).wait();
};

main();