import {ethers} from "hardhat";
import {USDC__factory} from "../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();
  const USDC = await new USDC__factory(signer).deploy();
  console.log(USDC.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });