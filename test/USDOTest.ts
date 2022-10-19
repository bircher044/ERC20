import { ethers } from "hardhat";
import { Contract, BigNumber, Wallet, ContractFactory, providers, Signer } from "ethers"; 
import { expect } from "chai";

describe("Tests", async () => {

    let totalSupply : BigNumber;
    let decimals : BigNumber;
    let name : string;
    let symbol : string;

    let owner : Signer;
    let anotherUser : Signer;
    let thirdUser : Signer;

    let USDO : Contract;
    let aggregator : Contract;

    let ethPrice : BigNumber
    let transactionValue : BigNumber;
    let tokenAmount : BigNumber;
    let oracleDecimals : BigNumber;

    describe("USDO contract", async () => {

        beforeEach(async () => {    

            [owner, anotherUser, thirdUser] = await ethers.getSigners();

            let USDOContractFactory : ContractFactory = await ethers.getContractFactory('USDO', owner);
            let aggregatorContractFactory : ContractFactory = await ethers.getContractFactory('AggregatorProxy', thirdUser);

            USDO = await USDOContractFactory.deploy();
            aggregator = await aggregatorContractFactory.deploy(ethers.constants.AddressZero);

            ethPrice = (await aggregator.latestRoundData())[1];

            totalSupply = BigNumber.from("1000000000000000000000000000");
            decimals = BigNumber.from(18);
            oracleDecimals = BigNumber.from(await aggregator.decimals());
            name = "USDO";
            symbol = "USD";
            transactionValue = BigNumber.from("200000000000000000");

            tokenAmount = transactionValue.mul(ethPrice).div(BigNumber.from(10).pow(oracleDecimals));
        });
    

        describe("Deployment", async () => {
        
            it('Should mint correct total supply', async () => {

                expect(await USDO.balanceOf(USDO.address)).to.equal(totalSupply);

            });
            
            it('Should set the correct contract name', async () =>{

                expect(await USDO.name()).to.equal(name);

            });

            it('Should set the correct contract symbol', async () =>{

                expect(await USDO.symbol()).to.equal(symbol);

            });

            it('Should set the correct contract owner', async () => {
                
                expect(await USDO.owner()).to.equal(await owner.getAddress());
            });
        
        });

        describe("Testing aggregator functions", async () => {

            it('Should set the correct aggregator address after deploy', async () =>{

                expect(await USDO.getAggregator()).to.equal(ethers.constants.AddressZero);

            });

            it("Should set aggregator", async () => {

                await USDO.setAggregator(aggregator.address);

                expect(await USDO.getAggregator()).to.equal(aggregator.address);

            });

            it("Should create an event after setting an aggregator", async () => {

                await expect(USDO.setAggregator(aggregator.address)).to.emit(USDO, "aggregatorChanged")
                    .withArgs(aggregator.address);

            });

            it("Should remove aggregator", async () => {

                await USDO.setAggregator(aggregator.address);
                await USDO.setAggregator(ethers.constants.AddressZero);

                expect(await USDO.getAggregator()).to.equal(ethers.constants.AddressZero);

            });

        });

        describe("Testing token buying", async () => {

            it("Should revert a transaction when aggregator is not set", async () => {

                await expect( anotherUser.sendTransaction({to: USDO.address, gasLimit: 3e7, value: 200000000}))
                    .to.be.revertedWith("USDO: contract is on pause");

            });
            
            it("Should recieve a transaction", async () => {
                
                await USDO.setAggregator(aggregator.address);
                await expect( await anotherUser.sendTransaction({to: USDO.address, value: 2e8}))
                    .to.changeEtherBalances([anotherUser, USDO], [-2e8, 2e8], {includeFee: false});

            });

            it("Should send the correct amount of tokens to a buyer", async () => {
                
                await USDO.setAggregator(aggregator.address);

                await anotherUser.sendTransaction({to: USDO.address, value: transactionValue});

                expect(await USDO.balanceOf(anotherUser.getAddress())).to.equal(tokenAmount);

            });

            it("Should make an event, after buying", async () => {
                
                await USDO.setAggregator(aggregator.address);

                

                await expect(anotherUser.sendTransaction({to: USDO.address, value: transactionValue}))
                    .to.emit(USDO, "tokenSold").withArgs(anotherUser.getAddress, tokenAmount);

            });

        });

        describe("Testing withdraw function", async () => {

            it("Should revert when contract balance is equal to zero", async () => {

                await expect( (USDO.connect(owner).withdraw())).to.be.revertedWith("USDO: zero balance");

            });

            it("Should revert a transaction when not an owner is trying to withdraw", async () => {

                await USDO.setAggregator(aggregator.address);

                await anotherUser.sendTransaction({to: USDO.address, value: transactionValue});

                await expect( (USDO.connect(anotherUser).withdraw())).to.be.revertedWith("Ownable: caller is not the owner");
            });

            it("Should send the whole contract balance after call withdraw", async () => {

                await USDO.setAggregator(aggregator.address);

                await anotherUser.sendTransaction({to: USDO.address, value: transactionValue});

                let ownerChange = transactionValue;
                let USDOChange = BigNumber.from(0).sub(transactionValue);

                await expect( await (USDO.connect(owner).withdraw())).to.
                    changeEtherBalances([owner, USDO], [ownerChange, USDOChange], {includeFee: false});
            });

        });
    });
});