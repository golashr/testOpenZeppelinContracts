const fs = require('fs');
const Web3 = require('web3');
const utils =  require('./web3util');
const async =  require('async');
const mnemonic = require('./mnemonic');

var host = "http://localhost:8545";
var web3 = new Web3(new Web3.providers.HttpProvider(host));

//var host = "ws://localhost:9000";
//web3 = new Web3(new Web3.providers.WebsocketProvider(host));

var privateKey = {};
var contractsList = {};
var accountAddressList = [];

var main = async function () {


    return;
}

main();

async function generateKeysAndCreateAccounts(){
    try{
        accountAddressList.length = 0;
        
        var privateKeyFileName = __dirname + "/keyStore/" + "privatekey.json";
        var keyData = {};
        if(fs.existsSync(privateKeyFileName)){
            keyData = fs.readFileSync(privateKeyFileName,"utf8");
            privateKey = JSON.parse(keyData);
            Object.keys(privateKey).forEach(eachElement => {
                accountAddressList.push(eachElement);
                console.log(eachElement);
            });
        }
        else{
            const password = "password";
            for(index = 0; index < 3; index++){
                var newAccount = await web3.eth.accounts.create(password);
                console.log("newAccount Address", newAccount.address);
                console.log("newAccount privateKey", newAccount.privateKey);
                privateKey[newAccount.address] = newAccount.privateKey;
                
                //var key=Buffer.from(newAccount.privateKey,'hex');
                var result = await web3.eth.personal.importRawKey(newAccount.privateKey, password);
                console.log("result ", result);
            }
            data = JSON.stringify(privateKey,null, 2);
            fs.writeFileSync(privateKeyFileName,data);
            console.log("No of private keys", Object.keys(privateKey).length);
        }
    }
    catch (error) {
        console.log("Error in generateKeysAndCreateAccounts: " + error);
    }    
}

async function createAccountsAndManageKeys(){
    
    var privateKeyFileName = __dirname + "/keyStore/" + "privatekey.json";
    if(fs.existsSync(privateKeyFileName)){
        var keyData = fs.readFileSync(privateKeyFileName,"utf8");
        privateKey = JSON.parse(keyData);
        accountAddressList = Object.keys(privateKey);
    }    
    else{    
        var prvkey1 = utils.keccak(web3,mnemonic['account1']);
        var prvkey2 = utils.keccak(web3,mnemonic['account2']);
        var prvkey3 = utils.keccak(web3,mnemonic['account3']);
        var prvkey4 = utils.keccak(web3,mnemonic['account4']);

        pubkey1 = utils.generatePublicKey(prvkey1);
        pubkey2 = utils.generatePublicKey(prvkey2);
        pubkey3 = utils.generatePublicKey(prvkey3);
        pubkey4 = utils.generatePublicKey(prvkey4);
        
        accountAddressList.length = 0;
        accountAddressList.push(pubkey1);
        accountAddressList.push(pubkey2);
        accountAddressList.push(pubkey3);
        accountAddressList.push(pubkey4);

        privateKey[pubkey1] = prvkey1.slice(2,66);
        privateKey[pubkey2] = prvkey2.slice(2,66);
        privateKey[pubkey3] = prvkey3.slice(2,66);
        privateKey[pubkey4] = prvkey4.slice(2,66);

        var data = JSON.stringify(privateKey,null, 2);
        fs.writeFileSync(privateKeyFileName,data);
    }
    var noOfPrivateKeys = Object.keys(privateKey).length;
    var noOfAccounts = accountAddressList.length;
    if(noOfAccounts > 0 && noOfPrivateKeys > 0 && (noOfAccounts == noOfPrivateKeys)){
        console.log("There are", accountAddressList.length, "ethereum accounts in the blockchain");
    }
    return;
}

async function readWritePrivateKeys(){
    try{
        const password = "password";
        accountAddressList.length = 0;
        accountAddressList = await web3.eth.getAccounts();
        if(accountAddressList.length <= 0)
            return;
        
        var privateKeyFileName = __dirname + "/keyStore/" + "privatekey.json";
        var keyStorePath = __dirname;
        
        var keyData = {};
        if(fs.existsSync(privateKeyFileName)){
            keyData = fs.readFileSync(privateKeyFileName,"utf8");
            keyData = JSON.parse(keyData);
        }    
        var key;
        console.log("There are", accountAddressList.length, "ethereum accounts in the blockchain");
        if(accountAddressList.length > 0){
            var i = 0;
            accountAddressList.forEach(eachElement => {
            console.log(i++,"th account",eachElement);
            
            if(keyData[eachElement] != undefined){
                key = keyData[eachElement];
            }    
            else
            {    
                try{
                    key = utils.getPrivateKeyFromKeyStore(eachElement, keyStorePath, password);
                }
                catch (error) {
                    return;
                }
            }    
            privateKey[eachElement] = key;
            console.log(key);
            });
        }    
        data = JSON.stringify(privateKey,null, 2);
        fs.writeFileSync(privateKeyFileName,data);

        console.log("No of private keys", Object.keys(privateKey).length);
        
        // var newAccount = await web3.eth.personal.newAccount(password);
        // console.log("accountAddressList ", newAccount);

        //var account = web3.eth.accounts.privateKeyToAccount(privateKey[accountAddressList[0]]);
        //console.log("accountaddress ", accountAddressList[0], "recovered account with private key is", privateKey[accountAddressList[0]], account.address);
    }
    catch (error) {
        console.log("Error in readWritePrivateKeys: " + error);
    }
}

async function readContractsFromConfig(){
    try{
        var contractFileName = __dirname + "/keyStore/" + "contractsConfig.json";
        var keyData = {};
        if(fs.existsSync(contractFileName)){
            keyData = fs.readFileSync(contractFileName,"utf8");
            contractsList = JSON.parse(keyData);
            if(contractsList["adminValidatorSetAddress"] != undefined)
                adminValidatorSetAddress = contractsList["adminValidatorSetAddress"];
            if(contractsList["simpleValidatorSetAddress"] != undefined)    
                simpleValidatorSetAddress= contractsList["simpleValidatorSetAddress"];
        }
    }
    catch (error) {
        console.log("Error in readContractsFromConfig: " + error);
    }
}    

async function writeContractsINConfig(){
    try{
        var contractFileName = __dirname + "/keyStore/" + "contractsConfig.json";
        contractsList["adminValidatorSetAddress"] = adminValidatorSetAddress;
        contractsList["simpleValidatorSetAddress"] = simpleValidatorSetAddress;
    
        var data = JSON.stringify(contractsList,null, 2);
        fs.writeFileSync(contractFileName,data);
    }
    catch (error) {
        console.log("Error in writeContractsINConfig: " + error);
    }
}    

async function accessEarlierGreeting(ethAccountToUse){
    var greeting1;

    // Todo: Read ABI from dynamic source.
    var value = utils.readSolidityContractJSON("./build/contracts/Greeter.json");
    if(value.length <= 0){
        return;
    }

    var constructorParameters = [];
    constructorParameters.push("Hi Rahul");
    //value[0] = Contract ABI and value[1] =  Contract Bytecode
    var deployedAddressGreeter = await utils.deployContract(value[0], value[1], ethAccountToUse, constructorParameters, web3);
    
    console.log("Greeter deployedAddress ", deployedAddressGreeter);
    greeting1 = new web3.eth.Contract(JSON.parse(value[0]),deployedAddressGreeter);

    ///////////////////////////////////////////////////////////////
    // Todo: Read ABI from dynamic source.
    var value1 = utils.readSolidityContractJSON("./build/contracts/TestGreeter.json");
    if(value1.length <= 0){
        return;
    }

    constructorParameters = [];
    constructorParameters.push(deployedAddressGreeter);
    //value1[0] = Contract ABI and value1[1] =  Contract Bytecode
    var deployedAddressTesterGreeter = await utils.deployContract(value1[0], value1[1], ethAccountToUse, constructorParameters, web3);
    
    console.log("TestGreeter deployedAddress ", deployedAddressTesterGreeter);
    testGreeting = new web3.eth.Contract(JSON.parse(value1[0]),deployedAddressTesterGreeter);

    let encodedABI = testGreeting.methods.add(23,54).encodeABI();
    var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedAddressTesterGreeter,encodedABI,privateKey[ethAccountToUse],web3,200000);
    console.log("TransactionLog for TestGreeter Setvalue -", transactionObject.transactionHash);

    greeting1.methods.getMyNumber().call().then(result => {
        console.log("getMyNumber", result);
    });

    testGreeting.methods.result().call().then(result => {
        console.log("result", result);
    });

    // greeting1.methods.greet().call().then(result => {
    //     console.log("myvalue", result);
    // });

    // greeting1.methods.getOwner().call().then(result => {
    //     console.log("getOwner", result);
    // });

    // greeting1.methods.getMyNumber().call().then(result => {
    //     console.log("getMyNumber", result);
    // });
    
    // let encodedABI = greeting1.methods.setMyNumber(299).encodeABI();
    // var estimatedGas = await utils.estimateGasTransaction(ethAccountToUse,deployedAddress, encodedABI,web3);
    // console.log("estimatedGas",estimatedGas);
    
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedAddress,encodedABI,privateKey[ethAccountToUse],web3,200000);
    // console.log("TransactionLog for Greeter Setvalue -", transactionObject.transactionHash);

    // greeting1.methods.getMyNumber().call().then(result => {
    //     console.log("getMyNumber", result);
    // });
}