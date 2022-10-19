import {ethers} from "hardhat";
import {USDO__factory} from "../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();
  const USDO = await new USDO__factory(signer).deploy();
  console.log(USDO.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });