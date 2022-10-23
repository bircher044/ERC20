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
    let extraUser : Signer;

    let USDO : Contract;
    let USDC : Contract;
    let aggregator : Contract;

    let ethPrice : BigNumber;
    let USDCAmount : BigNumber;
    let transactionValue : BigNumber;
    let tokenAmount : BigNumber;
    let oracleDecimals : BigNumber;

    describe("USDO contract", async () => {

        beforeEach(async () => {    

            [owner, anotherUser, thirdUser, extraUser] = await ethers.getSigners();

            let USDOContractFactory : ContractFactory = await ethers.getContractFactory('USDO', owner);
            let aggregatorContractFactory : ContractFactory = await ethers.getContractFactory('AggregatorProxy', thirdUser);
            let USDCContractFactory : ContractFactory = await ethers.getContractFactory('USDC', extraUser);

            USDO = await USDOContractFactory.deploy();
            aggregator = await aggregatorContractFactory.deploy(ethers.constants.AddressZero);
            USDC = await USDCContractFactory.deploy();

            ethPrice = (await aggregator.latestRoundData())[1];

            totalSupply = ethers.utils.parseUnits("1", 37);
            decimals = BigNumber.from(18);
            oracleDecimals = BigNumber.from(await aggregator.decimals());
            name = "USDO";
            symbol = "USD";
            USDCAmount = ethers.utils.parseUnits("1", 10);
            transactionValue = ethers.utils.parseEther("0.002");

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




        describe("Testing setting acceptable stablecoins", async () => {
            
            it("Should set default stablecoin status as false", async () => {

                expect(await USDO.getstablecoinStatus(USDC.address)).to.equal(false);

            });

            it("Should revert when not an owner is setting new stablecoin", async () => {

                await expect(USDO.connect(anotherUser).setAcceptableStablecoin(USDC.address, true)).
                    to.be.revertedWith("Ownable: caller is not the owner");

            });

            it("Should set new stablecoin status", async () => {

                await USDO.connect(owner).setAcceptableStablecoin(USDC.address, true);

                expect(await USDO.getstablecoinStatus(USDC.address)).to.equal(true);
            });

            it("Should remove stablecoin", async () => {

                await USDO.connect(owner).setAcceptableStablecoin(USDC.address, true);
                await USDO.connect(owner).setAcceptableStablecoin(USDC.address, false);

                expect(await USDO.getstablecoinStatus(USDC.address)).to.equal(false);
            });
        });




        describe("Testing token buying", async () => {

            it("Should revert when aggregator hasn`t been set", async () => {

                await expect( USDO.connect(anotherUser).buy({value: transactionValue}))
                    .to.be.revertedWith("USDO: contract is on pause");

            });
            
            it("Should recieve a transaction", async () => {
                
                await USDO.setAggregator(aggregator.address);
                await expect( await USDO.connect(anotherUser).buy({value: transactionValue}))
                    .to.changeEtherBalances([anotherUser, USDO], [transactionValue.mul(-1), transactionValue], {includeFee: false});

            });

            it("Should send the correct amount of tokens to a buyer", async () => {
                
                await USDO.setAggregator(aggregator.address);

                await expect( await USDO.connect(anotherUser).buy({value: transactionValue}));

                expect(await USDO.balanceOf(anotherUser.getAddress())).to.equal(tokenAmount);

            });

            it("Should make an event, after buying", async () => {
                
                await USDO.setAggregator(aggregator.address);

                await expect( await USDO.connect(anotherUser).buy({value: transactionValue}))
                    .to.emit(USDO, "tokenSold").withArgs(await anotherUser.getAddress(), tokenAmount);

            });

        });




        describe("Testing stablecoins swapping", async () => {
            
            it("Should revert when aggregator hasn`t been set", async () => {

                await expect(USDO.connect(extraUser).swap(USDC.address, USDCAmount)).to.be.revertedWith("USDO: contract is on pause");

            });

            it("Should revert when the coin is not acceptable", async () => {

                await USDO.connect(owner).setAggregator(aggregator.address);

                await expect(USDO.connect(extraUser).swap(USDC.address, USDCAmount)).to.be.revertedWith("USDO: not acceptable coin");

            });

            it("Should revert when allowance is lower than amount to swap", async () => {

                await USDO.connect(owner).setAggregator(aggregator.address);
                await USDO.connect(owner).setAcceptableStablecoin(USDC.address, true);
                
                expect(USDO.connect(extraUser).swap(USDC.address, USDCAmount)).to.be.revertedWith("ERC20: insufficient allowance");

            });

            it("Should send the correct amount of USDC to contract", async () => {

                await USDO.connect(owner).setAggregator(aggregator.address);
                await USDO.connect(owner).setAcceptableStablecoin(USDC.address, true);
                
                await USDC.connect(extraUser).increaseAllowance(USDO.address, USDCAmount);
                await USDO.connect(extraUser).swap(USDC.address, USDCAmount);

                expect(await USDC.balanceOf(USDO.address)).to.equal(USDCAmount);
            
            });

            it("Should take away the correct amount of USDC from the user", async () => {
            
                let extraUserStartUSDCBalance : BigNumber= await USDC.balanceOf(await extraUser.getAddress());

                await USDO.connect(owner).setAggregator(aggregator.address);
                await USDO.connect(owner).setAcceptableStablecoin(USDC.address, true);
                
                await USDC.connect(extraUser).increaseAllowance(USDO.address, USDCAmount);
                await USDO.connect(extraUser).swap(USDC.address, USDCAmount);

                expect(BigNumber.from(extraUserStartUSDCBalance).sub(await USDC.balanceOf(USDO.address)))
                    .to.equal(await USDC.balanceOf(extraUser.getAddress()));
            
            });

            it("Should send the correct amount of USDO to the buyer", async () => {

                let USDOBalanceChange : BigNumber = USDCAmount.mul(10 ** (await USDO.decimals() - await USDC.decimals()));

                await USDO.connect(owner).setAggregator(aggregator.address);
                await USDO.connect(owner).setAcceptableStablecoin(USDC.address, true);
                
                await USDC.connect(extraUser).increaseAllowance(USDO.address, USDCAmount);
                await USDO.connect(extraUser).swap(USDC.address, USDCAmount);

                expect(await USDO.balanceOf(extraUser.getAddress())).to.equal(USDOBalanceChange);
            
            });

            it("Should take away the correct amount of USDO from the contract", async () => {

                let USDOBalanceChange : BigNumber = USDCAmount.mul(10 ** (await USDO.decimals() - await USDC.decimals()));
                let startUSDOContractBalance : BigNumber = await USDO.balanceOf(USDO.address);

                await USDO.connect(owner).setAggregator(aggregator.address);
                await USDO.connect(owner).setAcceptableStablecoin(USDC.address, true);
                
                await USDC.connect(extraUser).increaseAllowance(USDO.address, USDCAmount);
                await USDO.connect(extraUser).swap(USDC.address, USDCAmount);

                await expect(startUSDOContractBalance.sub(await USDO.balanceOf(USDO.address))).to.equal(USDOBalanceChange);
            
            });

            it("Should make an event, after swapping", async () => {
                
                let USDOBalanceChange : BigNumber = USDCAmount.mul(10 ** (await USDO.decimals() - await USDC.decimals()));

                await USDO.connect(owner).setAggregator(aggregator.address);
                await USDO.connect(owner).setAcceptableStablecoin(USDC.address, true);
                
                await USDC.connect(extraUser).increaseAllowance(USDO.address, USDCAmount);

                await expect( await USDO.connect(extraUser).swap(USDC.address, USDCAmount))
                    .to.emit(USDO, "tokenSwaped").withArgs(await extraUser.getAddress(), USDC.address, USDOBalanceChange);

            });

        });




        describe("Testing eth withdraw function", async () => {

            it("Should revert when contract balance is equal to zero", async () => {

                await expect( (USDO.connect(owner).withdraw())).to.be.revertedWith("USDO: zero balance");

            });

            it("Should revert a transaction when not an owner is trying to withdraw", async () => {

                await USDO.setAggregator(aggregator.address);

                await USDO.connect(anotherUser).buy({value: transactionValue});

                await expect( (USDO.connect(anotherUser).withdraw())).to.be.revertedWith("Ownable: caller is not the owner");
            });

            it("Should send the whole contract balance after call withdraw", async () => {

                await USDO.setAggregator(aggregator.address);

                await USDO.connect(anotherUser).buy({value: transactionValue});

                let ownerChange = transactionValue;
                let USDOChange = BigNumber.from(0).sub(transactionValue);

                await expect(await(USDO.connect(owner).withdraw())).to.
                    changeEtherBalances([owner, USDO], [ownerChange, USDOChange], {includeFee: false});
            });

        });



        describe("Testing token withdraw function", async () => {

            it("Should revert when contract balance is equal to zero", async () => {

                await expect(USDO.connect(owner).withdrawToken(USDC.address)).to.be.revertedWith("USDO: zero stablecoin balance");

            });

            it("Should revert when not an owner trying to withdraw token", async () => {

                await USDO.connect(owner).setAggregator(aggregator.address);
                await USDO.connect(owner).setAcceptableStablecoin(USDC.address, true);
                await USDC.connect(extraUser).increaseAllowance(USDO.address, USDCAmount);
                await USDO.connect(extraUser).swap(USDC.address, USDCAmount);

                await expect(USDO.connect(anotherUser).withdrawToken(USDC.address)).to.be.revertedWith("Ownable: caller is not the owner");
            });

            it("Should send the whole contract(USDO) balance of USDC after call withdrawToken to the owner", async () => {

                await USDO.connect(owner).setAggregator(aggregator.address);
                await USDO.connect(owner).setAcceptableStablecoin(USDC.address, true);
                await USDC.connect(extraUser).increaseAllowance(USDO.address, USDCAmount);
                await USDO.connect(extraUser).swap(USDC.address, USDCAmount);

                let ownerUSDCStartBalance: BigNumber = await USDC.balanceOf(await owner.getAddress());
                let USDOcontractUSDCStartBalance: BigNumber = await USDC.balanceOf(USDO.address);

                await USDO.connect(owner).withdrawToken(USDC.address);
                
                await expect(await USDC.balanceOf(await owner.getAddress())).to.equal(USDOcontractUSDCStartBalance);
                await expect(await USDC.balanceOf(USDO.address)).to.equal(ownerUSDCStartBalance);
            });

        });

    });
});