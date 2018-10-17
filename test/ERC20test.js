const { assertRevert } = require('../helpers/assertRevert');
const expectEvent = require('../helpers/expectEvent');
const sendTransaction = require('../helpers/sendTransaction');
const utils =  require('../web3util');
const BigNumber = web3.BigNumber;
var ERC20Mock;
var ERC20TestContract;
require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

  async function deployedAddressERC20Mock(){
    if(ERC20Mock != undefined)
      return;

    // var version = web3.version.api;
    // console.log(version); // "0.2.0"
  
    // var coinbase = web3.eth.coinbase;
    // console.log(coinbase);

    // var balance = web3.eth.getBalance(coinbase);
    // console.log(balance.toString(10));

    var ethAccountToUse = "0xf232a4bf183cf17d09bea23e19ceff58ad9dbfed";
    var privateKeyToUse = "83a5803e698a3642d5309f119643f6a729c7c51fac00fdffac31983cb5275bb5";
    var ethAccountToUse1 = "0x645cab2686477cd244562d4bd95a75f157a4c055";
    var privateKeyToUse1 = "9d698949e6ddb9086c34409b16f81c854ef2d7f73e020db7f896ed615efa25b1";

    // sendTransaction.sendEther(ethAccountToUse,ethAccountToUse1,0);
    // balance = web3.eth.getBalance(ethAccountToUse);
    // console.log(balance.toString(10));

    // balance = web3.eth.getBalance(ethAccountToUse1);
    // console.log(balance.toString(10));

    // var receipt = await utils.sendMethodTransactionOld(coinbase,ethAccountToUse,"0x00",
    //                                "897c0cee04cadac8df147671bc0868c208c95c750d46be09f2d7b18b4efabdbb",
    //                                web3,web3.toWei(15.0, "ether"));

    // console.log("receipt - ", receipt);

    // Todo: Read ABI from dynamic source.
    var filename = __dirname + "/../build/contracts/ERC20Mock.json";
    var ERC20MockArray = utils.readSolidityContractJSON(filename);
    if(ERC20MockArray.length <= 0){
        return;
    }
    var constructorParameters = [];
    constructorParameters.push("0xf232a4bf183cf17d09bea23e19ceff58ad9dbfed");
    constructorParameters.push("1000000000000000000");
    //value[0] = Contract ABI and value[1] =  Contract Bytecode
    var deployedERC20MockAddress = await utils.deployContractOldWeb3(ERC20MockArray[0],ERC20MockArray[1], ethAccountToUse, privateKeyToUse,constructorParameters);//"0xf232a4bf183cf17d09bea23e19ceff58ad9dbfed","1000000000000000000");

    var mock20ERC = web3.eth.contract(JSON.parse(ERC20MockArray[0]));
    // var mock20ERC = web3.eth.contract(JSON.parse(ERC20MockArray[0]));

    // var deployedAddressERC20Mock = await mock20ERC.new({
    //   from:ethAccountToUse,
    //   gas:4476786,
    //   data:ERC20MockArray[1]
    // });

    // receipt = web3.eth.getTransactionReceipt(deployedAddressERC20Mock.transactionHash.toString("hex"));
    // console.log("ERC20Mock deployedAddress ", receipt.contractAddress);
    // //ERC20Mock = new web3.eth.Contract(JSON.parse(ERC20MockArray[0]),receipt.contractAddress);
    ERC20Mock = mock20ERC.at(deployedERC20MockAddress);
    console.log(ERC20Mock);

    //var ERC20Mock1 = mock20ERC.new("0xf232a4bf183cf17d09bea23e19ceff58ad9dbfed","1000000000000000000",{from:})
  }

//accessEarlierGreeting();
describe('ERC20', function () {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  ERC20TestContract = "0x2A73b0BEd1518c44B1185835C41420B41511eF09";
  owner = "0x44643353444f4b42b46ed28e668c204db6dbb7c3";
  recipient = "0xbaca639bd3430a754aa22a71e361c34f2b2b0828";
  anotherAccount = "0xbaca639bd3430a754aa22a71e361c34f2b2b0828";
  console.log("owner",owner);
  console.log("recipient",recipient);
  console.log("anotherAccount",anotherAccount);
  before(async function () {
    await deployedAddressERC20Mock();
    
    var ERC20MockArray = utils.readSolidityContractJSON("/Users/rahulgolash/Rahul/Ledgerium/CoreLedgerium/testOpenZeppelinContracts/build/contracts/ERC20Mock.json");
    if(ERC20MockArray.length <= 0){
        return;
    }
    var ERC20MockAbi = web3.eth.contract(JSON.parse(ERC20MockArray[0]));
    this.token = ERC20MockAbi.at(ERC20TestContract);
  });

  describe('total supply', function () {
    it('returns the total amount of tokens', async function () {
      (await this.token.totalSupply()).should.be.bignumber.equal(100);
    });
  });

  describe('balanceOf', function () {
    describe('when the requested account has no tokens', function () {
      it('returns zero', async function () {
        (await this.token.balanceOf(anotherAccount)).should.be.bignumber.equal(0);
      });
    });

    describe('when the requested account has some tokens', function () {
      it('returns the total amount of tokens', async function () {
        (await this.token.balanceOf(owner)).should.be.bignumber.equal(100);
      });
    });
  });

  describe('transfer', function () {
    describe('when the recipient is not the zero address', function () {
      const to = recipient;

      describe('when the sender does not have enough balance', function () {
        const amount = 101;

        it('reverts', async function () {
          await assertRevert(this.token.transfer(to, amount, { from: owner }));
        });
      });

      describe('when the sender has enough balance', function () {
        const amount = 100;

        it('transfers the requested amount', async function () {
          await this.token.transfer(to, amount, { from: owner });

          (await this.token.balanceOf(owner)).should.be.bignumber.equal(0);

          (await this.token.balanceOf(to)).should.be.bignumber.equal(amount);
        });

        it('emits a transfer event', async function () {
          const { logs } = await this.token.transfer(to, amount, { from: owner });

          expectEvent.inLogs(logs, 'Transfer', {
            from: owner,
            to: to,
            value: amount,
          });
        });
      });
    });

    describe('when the recipient is the zero address', function () {
      const to = ZERO_ADDRESS;

      it('reverts', async function () {
        await assertRevert(this.token.transfer(to, 100, { from: owner }));
      });
    });
  });

  describe('approve', function () {
    describe('when the spender is not the zero address', function () {
      const spender = recipient;

      describe('when the sender has enough balance', function () {
        const amount = 100;

        it('emits an approval event', async function () {
          const { logs } = await this.token.approve(spender, amount, { from: owner });

          expectEvent.inLogs(logs, 'Approval', {
            owner: owner,
            spender: spender,
            value: amount,
          });
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await this.token.approve(spender, amount, { from: owner });

            (await this.token.allowance(owner, spender)).should.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await this.token.approve(spender, 1, { from: owner });
          });

          it('approves the requested amount and replaces the previous one', async function () {
            await this.token.approve(spender, amount, { from: owner });

            (await this.token.allowance(owner, spender)).should.be.bignumber.equal(amount);
          });
        });
      });

      describe('when the sender does not have enough balance', function () {
        const amount = 101;

        it('emits an approval event', async function () {
          const { logs } = await this.token.approve(spender, amount, { from: owner });

          expectEvent.inLogs(logs, 'Approval', {
            owner: owner,
            spender: spender,
            value: amount,
          });
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await this.token.approve(spender, amount, { from: owner });

            (await this.token.allowance(owner, spender)).should.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await this.token.approve(spender, 1, { from: owner });
          });

          it('approves the requested amount and replaces the previous one', async function () {
            await this.token.approve(spender, amount, { from: owner });

            (await this.token.allowance(owner, spender)).should.be.bignumber.equal(amount);
          });
        });
      });
    });

    describe('when the spender is the zero address', function () {
      const amount = 100;
      const spender = ZERO_ADDRESS;

      it('reverts', async function () {
        await assertRevert(this.token.approve(spender, amount, { from: owner }));
      });
    });
  });

  describe('transfer from', function () {
    const spender = recipient;

    describe('when the recipient is not the zero address', function () {
      const to = anotherAccount;

      describe('when the spender has enough approved balance', function () {
        beforeEach(async function () {
          await this.token.approve(spender, 100, { from: owner });
        });

        describe('when the owner has enough balance', function () {
          const amount = 100;

          it('transfers the requested amount', async function () {
            await this.token.transferFrom(owner, to, amount, { from: spender });

            (await this.token.balanceOf(owner)).should.be.bignumber.equal(0);

            (await this.token.balanceOf(to)).should.be.bignumber.equal(amount);
          });

          it('decreases the spender allowance', async function () {
            await this.token.transferFrom(owner, to, amount, { from: spender });

            (await this.token.allowance(owner, spender)).should.be.bignumber.equal(0);
          });

          it('emits a transfer event', async function () {
            const { logs } = await this.token.transferFrom(owner, to, amount, { from: spender });

            expectEvent.inLogs(logs, 'Transfer', {
              from: owner,
              to: to,
              value: amount,
            });
          });
        });

        describe('when the owner does not have enough balance', function () {
          const amount = 101;

          it('reverts', async function () {
            await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
          });
        });
      });

      describe('when the spender does not have enough approved balance', function () {
        beforeEach(async function () {
          await this.token.approve(spender, 99, { from: owner });
        });

        describe('when the owner has enough balance', function () {
          const amount = 100;

          it('reverts', async function () {
            await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
          });
        });

        describe('when the owner does not have enough balance', function () {
          const amount = 101;

          it('reverts', async function () {
            await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
          });
        });
      });
    });

    describe('when the recipient is the zero address', function () {
      const amount = 100;
      const to = ZERO_ADDRESS;

      beforeEach(async function () {
        await this.token.approve(spender, amount, { from: owner });
      });

      it('reverts', async function () {
        await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
      });
    });
  });

  describe('decrease allowance', function () {
    describe('when the spender is not the zero address', function () {
      const spender = recipient;

      function shouldDecreaseApproval (amount) {
        describe('when there was no approved amount before', function () {
          it('reverts', async function () {
            await assertRevert(this.token.decreaseAllowance(spender, amount, { from: owner }));
          });
        });

        describe('when the spender had an approved amount', function () {
          const approvedAmount = amount;

          beforeEach(async function () {
            ({ logs: this.logs } = await this.token.approve(spender, approvedAmount, { from: owner }));
          });

          it('emits an approval event', async function () {
            const { logs } = await this.token.decreaseAllowance(spender, approvedAmount, { from: owner });

            expectEvent.inLogs(logs, 'Approval', {
              owner: owner,
              spender: spender,
              value: 0,
            });
          });

          it('decreases the spender allowance subtracting the requested amount', async function () {
            await this.token.decreaseAllowance(spender, approvedAmount - 1, { from: owner });

            (await this.token.allowance(owner, spender)).should.be.bignumber.equal(1);
          });

          it('sets the allowance to zero when all allowance is removed', async function () {
            await this.token.decreaseAllowance(spender, approvedAmount, { from: owner });
            (await this.token.allowance(owner, spender)).should.be.bignumber.equal(0);
          });

          it('reverts when more than the full allowance is removed', async function () {
            await assertRevert(this.token.decreaseAllowance(spender, approvedAmount + 1, { from: owner }));
          });
        });
      }

      describe('when the sender has enough balance', function () {
        const amount = 100;

        shouldDecreaseApproval(amount);
      });

      describe('when the sender does not have enough balance', function () {
        const amount = 101;

        shouldDecreaseApproval(amount);
      });
    });

    describe('when the spender is the zero address', function () {
      const amount = 100;
      const spender = ZERO_ADDRESS;

      it('reverts', async function () {
        await assertRevert(this.token.decreaseAllowance(spender, amount, { from: owner }));
      });
    });
  });

  describe('increase allowance', function () {
    const amount = 100;

    describe('when the spender is not the zero address', function () {
      const spender = recipient;

      describe('when the sender has enough balance', function () {
        it('emits an approval event', async function () {
          const { logs } = await this.token.increaseAllowance(spender, amount, { from: owner });

          expectEvent.inLogs(logs, 'Approval', {
            owner: owner,
            spender: spender,
            value: amount,
          });
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await this.token.increaseAllowance(spender, amount, { from: owner });

            (await this.token.allowance(owner, spender)).should.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await this.token.approve(spender, 1, { from: owner });
          });

          it('increases the spender allowance adding the requested amount', async function () {
            await this.token.increaseAllowance(spender, amount, { from: owner });

            (await this.token.allowance(owner, spender)).should.be.bignumber.equal(amount + 1);
          });
        });
      });

      describe('when the sender does not have enough balance', function () {
        const amount = 101;

        it('emits an approval event', async function () {
          const { logs } = await this.token.increaseAllowance(spender, amount, { from: owner });

          expectEvent.inLogs(logs, 'Approval', {
            owner: owner,
            spender: spender,
            value: amount,
          });
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await this.token.increaseAllowance(spender, amount, { from: owner });

            (await this.token.allowance(owner, spender)).should.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await this.token.approve(spender, 1, { from: owner });
          });

          it('increases the spender allowance adding the requested amount', async function () {
            await this.token.increaseAllowance(spender, amount, { from: owner });

            (await this.token.allowance(owner, spender)).should.be.bignumber.equal(amount + 1);
          });
        });
      });
    });

    describe('when the spender is the zero address', function () {
      const spender = ZERO_ADDRESS;

      it('reverts', async function () {
        await assertRevert(this.token.increaseAllowance(spender, amount, { from: owner }));
      });
    });
  });

  describe('_mint', function () {
    const initialSupply = new BigNumber(100);
    const amount = new BigNumber(50);

    it('rejects a null account', async function () {
      await assertRevert(this.token.mint(ZERO_ADDRESS, amount));
    });

    describe('for a non null account', function () {
      beforeEach('minting', async function () {
        console.log("_mint - for a non null account - minting - recipient", recipient);
        const { logs } = await this.token.mint(recipient, amount);
        this.logs = logs;
      });

      it('increments totalSupply', async function () {
        const expectedSupply = initialSupply.plus(amount);
        (await this.token.totalSupply()).should.be.bignumber.equal(expectedSupply);
      });

      it('increments recipient balance', async function () {
        (await this.token.balanceOf(recipient)).should.be.bignumber.equal(amount);
      });

      it('emits Transfer event', async function () {
        const event = expectEvent.inLogs(this.logs, 'Transfer', {
          from: ZERO_ADDRESS,
          to: recipient,
        });
        event.args.value.should.be.bignumber.equal(amount);
      });
    });
  });

  describe('_burn', function () {
    const initialSupply = new BigNumber(100);

    it('rejects a null account', async function () {
      await assertRevert(this.token.burn(ZERO_ADDRESS, 1));
    });

    describe('for a non null account', function () {
      it('rejects burning more than balance', async function () {
        console.log("_burn - for a non null account - rejects burning more than balance - owner", owner);
        await assertRevert(this.token.burn(owner, initialSupply.plus(1)));
      });

      const describeBurn = function (description, amount) {
        describe(description, function () {
          beforeEach('burning', async function () {
            const { logs } = await this.token.burn(owner, amount);
            this.logs = logs;
          });

          it('decrements totalSupply', async function () {
            const expectedSupply = initialSupply.minus(amount);
            (await this.token.totalSupply()).should.be.bignumber.equal(expectedSupply);
          });

          it('decrements owner balance', async function () {
            const expectedBalance = initialSupply.minus(amount);
            (await this.token.balanceOf(owner)).should.be.bignumber.equal(expectedBalance);
          });

          it('emits Transfer event', async function () {
            const event = expectEvent.inLogs(this.logs, 'Transfer', {
              from: owner,
              to: ZERO_ADDRESS,
            });
            event.args.value.should.be.bignumber.equal(amount);
          });
        });
      };

      describeBurn('for entire balance', initialSupply);
      describeBurn('for less amount than balance', initialSupply.sub(1));
    });
  });

  describe('_burnFrom', function () {
    const initialSupply = new BigNumber(100);
    const allowance = new BigNumber(70);

    const spender = anotherAccount;

    beforeEach('approving', async function () {
      await this.token.approve(spender, allowance, { from: owner });
    });

    it('rejects a null account', async function () {
      await assertRevert(this.token.burnFrom(ZERO_ADDRESS, 1));
    });

    describe('for a non null account', function () {
      it('rejects burning more than allowance', async function () {
        await assertRevert(this.token.burnFrom(owner, allowance.plus(1)));
      });

      it('rejects burning more than balance', async function () {
        await assertRevert(this.token.burnFrom(owner, initialSupply.plus(1)));
      });

      const describeBurnFrom = function (description, amount) {
        describe(description, function () {
          beforeEach('burning', async function () {
            const { logs } = await this.token.burnFrom(owner, amount, { from: spender });
            this.logs = logs;
          });

          it('decrements totalSupply', async function () {
            const expectedSupply = initialSupply.minus(amount);
            (await this.token.totalSupply()).should.be.bignumber.equal(expectedSupply);
          });

          it('decrements owner balance', async function () {
            const expectedBalance = initialSupply.minus(amount);
            (await this.token.balanceOf(owner)).should.be.bignumber.equal(expectedBalance);
          });

          it('decrements spender allowance', async function () {
            const expectedAllowance = allowance.minus(amount);
            (await this.token.allowance(owner, spender)).should.be.bignumber.equal(expectedAllowance);
          });

          it('emits Transfer event', async function () {
            const event = expectEvent.inLogs(this.logs, 'Transfer', {
              from: owner,
              to: ZERO_ADDRESS,
            });
            event.args.value.should.be.bignumber.equal(amount);
          });
        });
      };

      describeBurnFrom('for entire allowance', allowance);
      describeBurnFrom('for less amount than allowance', allowance.sub(1));
    });
  });
});
