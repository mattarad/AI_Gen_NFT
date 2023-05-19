const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('NFT', () => {
    let deployer, minter, nft

    const NAME = "AI Generated NFT"
    const SYMBOL = "AINFT"

    const COST = tokens(1) // 1 ETH
    const URL = "https://ipfs.io/ipfs/bafyreid4an6ng6e6hok56l565eivozra3373bo6funw3p5mhq5oonew6u4/metadata.json"

    beforeEach(async () => {
        [deployer, minter] = await ethers.getSigners()

        const NFT = await ethers.getContractFactory("NFT")
        nft = await NFT.deploy(NAME, SYMBOL, COST)
        const tx = await nft.connect(minter).mint(URL, { value: COST })
        await tx.wait()
    })

    describe('Deployment', () => {
        it('Returns owner', async () => {
            const result = await nft.owner()
            expect(result).to.be.equal(deployer.address)
        })

        it('Returns cost', async () => {
            const result = await nft.cost()
            expect(result).to.be.equal(COST)
        })
    })

    describe('Minting', () => {
        it('Returns owner', async () => {
            const result = await nft.ownerOf("1")
            expect(result).to.be.equal(minter.address)
        })

        it('Returns URI', async () => {
            const result = await nft.tokenURI("1")
            expect(result).to.be.equal(URL)
        })

        it('Updates total supply', async () => {
            const result = await nft.totalSupply()
            expect(result).to.be.equal("1")
        })
    })

    describe('Withdrawing', () => {
        let balanceBefore

        beforeEach(async () => {
            balanceBefore = await ethers.provider.getBalance(deployer.address)

            const tx = await nft.connect(deployer).withdraw()
            await tx.wait()
        })

        it('Updates the owner balance', async () => {
            const result = await ethers.provider.getBalance(deployer.address)
            expect(result).to.be.greaterThan(balanceBefore)
        })

        it('Updates the contract balance', async () => {
            const result = await ethers.provider.getBalance(nft.address)
            expect(result).to.equal(0)
        })
    })
})

