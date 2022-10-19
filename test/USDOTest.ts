import { ethers } from "hardhat";
import { Contract, BigNumber, Wallet, ContractFactory, providers, Signer } from "ethers"; 
import { expect } from "chai";

describe("Tests", async () => {

    let totalSupply : BigNumber;
    let decimals : BigNumber;
    let name : string;
    let symbol : string;

    let aggregatorAddress : string;

    let owner : Signer;
    let anotherUser : Signer;
    let thirdUser : Signer;

    let USDO : Contract;
    let aggregator : Contract;

    describe("USDO contract", async () => {

        beforeEach(async () => {

            [owner, anotherUser, thirdUser] = await ethers.getSigners();

            let USDOContractFactory : ContractFactory = await ethers.getContractFactory('USDO', owner);
            let aggregatorContractFactory : ContractFactory = await ethers.getContractFactory('AggregatorProxy', thirdUser);

            USDO = await USDOContractFactory.deploy();
            aggregator = await aggregatorContractFactory.deploy(ethers.constants.AddressZero);

            totalSupply = BigNumber.from(10 ** 9);
            decimals = BigNumber.from(18);
            name = "USDO";
            symbol = "USD";


        });
    

        describe("Deployment", async () => {
        
            it('Should mint 10^9 tokens on contract balance', async () => {

                expect(await USDO.balanceOf(USDO.address)).to.equal(totalSupply);

            });
            
            it('Should set the correct contract name', async () =>{

                expect(await USDO.name()).to.equal(name);

            });

            it('Should set the correct contract symbol', async () =>{

                expect(await USDO.symbol()).to.equal(symbol);

            });
        
        });

        describe("Testing aggregator functions", async () => {

            it('Should set the correct aggregator address after deploy', async () =>{

                expect(await USDO.getAggregator()).to.equal(ethers.constants.AddressZero);

            });

            it("Should set aggregator", async () => {

                await USDO.setAggregator(aggregatorAddress);

                expect(await USDO.getAggregator()).to.equal(aggregatorAddress);

            });

            it("Should remove aggregator", async () => {

                await USDO.setAggregator(aggregatorAddress);
                await USDO.setAggregator(ethers.constants.AddressZero);

                expect(await USDO.getAggregator()).to.equal(ethers.constants.AddressZero);

            });

        });
    });
});
