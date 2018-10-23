const Web3 = require('web3');
const utils =  require('./web3util');

var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8546'));
global.web3 = web3;

var privateKey = {};
var contractsList = {};
var accountAddressList = [];

var main = async function () {

  var returnVal = await utils.createAccountsAndManageKeys();
  accountAddressList = returnVal[0];
  privateKey = returnVal[1];

  var password = "password";
  var ethereumAccountsList = web3.eth.accounts;  
  if(ethereumAccountsList.length < 3)
  {
    await utils.personalImportAccount(privateKey[accountAddressList[0]],password);
    await utils.personalImportAccount(privateKey[accountAddressList[1]],password);
    await utils.personalImportAccount(privateKey[accountAddressList[2]],password);

    //Transfer some ether from coinbase account to newly created accounts!
    var coinbase = web3.eth.coinbase;
    //var receipt;
    receipt = await utils.sendMethodTransactionOld(coinbase,accountAddressList[0],"0x00",privateKey[coinbase],web3.toWei(15.0, "ether"));
    receipt = await utils.sendMethodTransactionOld(coinbase,accountAddressList[1],"0x00",privateKey[coinbase],web3.toWei(15.0, "ether"));
    receipt = await utils.sendMethodTransactionOld(coinbase,accountAddressList[2],"0x00",privateKey[coinbase],web3.toWei(15.0, "ether"));
  }
    
  //With assumption that accountAddressList[0],accountAddressList[1], accountAddressList[2] are present in etherum 
  //and needs to be unlocked before running the testcases. 
  await utils.unlockPersonalAccount(accountAddressList[0],password);
  await utils.unlockPersonalAccount(accountAddressList[1],password);
  await utils.unlockPersonalAccount(accountAddressList[2],password);

  global.accountAddressList = accountAddressList;
  global.privateKey = privateKey;
  //we dont need to read/write it in file as we want contract to deploy fresh everytime, test is run!
  global.contractsList = contractsList;// = utils.readContractsFromConfig(contractsList);

  global.owner = accountAddressList[0];
  global.recipient = accountAddressList[1];
  global.anotherAccount = accountAddressList[2];
  console.log("owner",global.owner);
  console.log("recipient",global.recipient);
  console.log("anotherAccount",global.anotherAccount);

  await deployedAddressERC20Mock(global, global.contractsList);
}
main();

async function deployedAddressERC20Mock(global, contractsList){

    // var version = web3.version.api;
    // console.log(version); // "0.2.0"
  
    // var coinbase = web3.eth.coinbase;
    // console.log(coinbase);

    // var balance = web3.eth.getBalance(coinbase);
    // console.log(balance.toString(10));

    // sendTransaction.sendEther(ethAccountToUse,ethAccountToUse1,0);
    // balance = web3.eth.getBalance(ethAccountToUse);
    // console.log(balance.toString(10));

    // balance = web3.eth.getBalance(ethAccountToUse1);
    // console.log(balance.toString(10));

    // var receipt = await utils.sendMethodTransactionOld(coinbase,ethAccountToUse,"0x00",
    //                                "897c0cee04cadac8df147671bc0868c208c95c750d46be09f2d7b18b4efabdbb",
    //                                web3,web3.toWei(15.0, "ether"));

    // console.log("receipt - ", receipt);
    var ethAccountToUse = accountAddressList[0];
    var privateKeyToUse = privateKey[ethAccountToUse];
    var deployedERC20MockAddress = contractsList["ERC20Mock"];
    // Todo: Read ABI from dynamic source.
    var filename = __dirname + "/build/contracts/ERC20Mock.json";
    var ERC20MockArray = utils.readSolidityContractJSON(filename);
    if(ERC20MockArray.length <= 0)
        return;
    if(deployedERC20MockAddress == undefined){
      
      var constructorParameters = [];
      constructorParameters.push("0xf232a4bf183cf17d09bea23e19ceff58ad9dbfed");
      constructorParameters.push("100");
      
      //value[0] = Contract ABI and value[1] =  Contract Bytecode
      deployedERC20MockAddress = await utils.deployContractOldWeb3(ERC20MockArray[0],ERC20MockArray[1], ethAccountToUse, privateKeyToUse,constructorParameters);//"0xf232a4bf183cf17d09bea23e19ceff58ad9dbfed","1000000000000000000");
      //we dont need to read/write it in file as we want contract to deploy fresh everytime, test is run!
      //utils.writeContractsINConfig(deployedERC20MockAddress);
    }
    var mock20ERC = web3.eth.contract(JSON.parse(ERC20MockArray[0]));
    global.ERC20Mock = mock20ERC.at(deployedERC20MockAddress);
  }