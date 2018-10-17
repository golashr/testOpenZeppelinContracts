const fs = require('fs');
const Web3 = require('web3');
const mnemonic = require('./mnemonic');
const utils =  require('./web3util');
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));

global.web3 = web3;
var privateKey = {};
var contractsList = {};
var accountAddressList = [];

var main = async function () {

    await createAccountsAndManageKeys();
    readContractsFromConfig();
    var ethAccountToUse = accountAddressList[0];
    //writeContractsINConfig();
}

main();
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