const fs = require('fs');
const moment = require('moment');
const mnemonic = require('./mnemonic');
const async =  require('async');
const solc = require('solc');
const EthereumTx = require('ethereumjs-tx');
var keythereum = require('keythereum');
const ethUtil = require('ethereumjs-util');

const utils = {
    async getCurrentTime () {
        return moment().format('YYYY-MM-DD HH:mm:ss').trim();
    },
      
    async transaction (from,to,value,data){
        return {
            from    : from,
            to      : to,
            data    : data,
            value   : value,
            gasPrice: '0x00',
            gas     : 4700000
        }
    },

    async getContractEncodeABI(abi,bytecode,arg){
        try{
            let contract = new web3.eth.Contract(JSON.parse(abi));
            return await contract.deploy({ data : bytecode, arguments : arg}).encodeABI();
        } catch (error) {
            console.log("Exception in utils.getContractEncodeABI(): " + error);
        } 
    },
    
    async deployContract(contractAbi, bytecode, ownerAddress, constructorParameters) {
        console.log("deployContract");
        try{
            let deployedContract = new web3.eth.Contract(JSON.parse(contractAbi));
            deployedAddress = await deployedContract.deploy({
                data : bytecode, 
                arguments: constructorParameters
            })
            .send({
                from : ownerAddress,
                gas : 5500000
            });
            return deployedAddress._address;
        } catch (error) {
            console.log("Exception in utils.deployContract(): " + error);
        }    
    },

    async deployContractOldWeb3(contractAbi, bytecode, fromAccountAddress, privateKey, constructorParameters) {
        console.log("deployContractOldWeb3");
        try{
            var myContract = web3.eth.contract(JSON.parse(contractAbi));
            var byteCodeWithParam = myContract.new.getData(constructorParameters[0],constructorParameters[1],{data: bytecode});
            nonceToUse = await web3.eth.getTransactionCount(fromAccountAddress, 'pending');
            {
                console.log("nonceToUse ",nonceToUse);
                const txParams = {
                    nonce: nonceToUse,
                    gasPrice: '0x00',
                    gasLimit: 4700000,
                    from: fromAccountAddress,
                    data: byteCodeWithParam
                }
                const tx = new EthereumTx(txParams);
                const privateKeyBuffer = new Buffer(privateKey, 'hex');
                tx.sign(privateKeyBuffer);
                const serializedTx = tx.serialize();

                var transactionHash = await web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'));
                var receipt;
                do{
                    receipt = await web3.eth.getTransactionReceipt(transactionHash);
                }
                while(receipt == null)
                console.log("ERC20Mock deployedAddress ", receipt.contractAddress);
                return receipt.contractAddress;
            }
        } catch (error) {
            console.log("Exception in utils.deployContractOldWeb3(): " + error);
        }    
    },
    
    async sendMethodTransactionOld (fromAccountAddress, toContractAddress, methodData, privateKey, value){
        try{
            nonceToUse = await web3.eth.getTransactionCount(fromAccountAddress, 'pending');
            {
                console.log("nonceToUse ",nonceToUse);
                const txParams = {
                    nonce: nonceToUse,
                    gasPrice: '0x00',
                    gasLimit: 4700000, //estimatedGas, //20000000, // Todo, estimate gas
                    from: fromAccountAddress,
                    to: toContractAddress,
                    value: value,
                    data: methodData
                }
                const tx = new EthereumTx(txParams)
                const privateKeyBuffer = new Buffer(privateKey, 'hex');
                tx.sign(privateKeyBuffer);
                const serializedTx = tx.serialize();

                receipt = await web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'));
                return receipt;
            }
        } catch (error) {
            console.log("Exception in utils.sendMethodTransactionOld(): " + error);
        } 
    },  
    
    async sendMethodTransaction(fromAccountAddress, toContractAddress, methodData, privateKey, web3, estimatedGas){//, calleeMethodName,callback) {
        try{
            nonceToUse = await web3.eth.getTransactionCount(fromAccountAddress, 'pending');
            {
                console.log("nonceToUse ",nonceToUse);
                const txParams = {
                    nonce: nonceToUse,
                    gasPrice: '0x00',
                    gasLimit: 4700000, //estimatedGas, //20000000, // Todo, estimate gas
                    from: fromAccountAddress,
                    to: toContractAddress,
                    value: '0x00',
                    data: methodData
                    //"privateFor" : privateFor
                }
                const tx = new EthereumTx(txParams)
                const privateKeyBuffer = new Buffer(privateKey, 'hex');
                tx.sign(privateKeyBuffer);
                const serializedTx = tx.serialize();

                receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
                return receipt;
                // .once('transactionHash',(receipt)=>{
                //     console.log('transactionHash', receipt);
                // })
                // .once('receipt',(receipt)=>{	
                //     console.log('info',"transaction mined successfully");
                //     console.log(calleeMethodName, " receipt", receipt);
                //     return receipt;
                //     //callback("success");
                // })				
                // .once('error',(error)=>{
                //     console.log('Error in ', calleeMethodName, `ERROR:\n${error.message}:${error.stack}`);
                // });
            //});
            }
        } catch (error) {
            console.log("Exception in utils.sendMethodTransaction(): " + error);
        }    
    },
    
    /** To get estimate of gas consumptio for the given transaction prior to actual
     * execution on blockchain! Extremely useful feature however, giving issues on quorum
    */
   async estimateGasTransaction (fromAccountAddress, toContractAddress, methodData, web3) {
        return await web3.eth.estimateGas(
            {
                from    : fromAccountAddress,
                to      : toContractAddress,
                data    : methodData
            });
    },

    /** to get receipt of the event raised from the blockchain
    */ 
    async getReceipt(transactionHash,web3){
        var receipt = web3.eth.getTransactionReceipt(transactionHash);
        if(!receipt)
            console.log("Transaction",transactionHash,"did not get mined!");
        return receipt;
    },
    
    readSolidityContractJSON (filename) {
        var json = JSON.parse(fs.readFileSync(filename, 'utf8'));
        let abi = JSON.stringify(json.abi);
        return [abi, json.bytecode];
    },

    compileSolidityContract (filename,contractName) {
        let source = fs.readFileSync(filename, 'utf8');
        let compiledContract = solc.compile(source, 1);
        let abi = compiledContract.contracts[":"+contractName].interface;
        let bytecode = compiledContract.contracts[":"+contractName].bytecode;
        return [abi, bytecode];
    },

    keccak (web3,text){
        return web3.sha3(text);
    },

    async sendTransaction(web3,transaction){
        return await web3.eth.sendTransaction(transaction);
    },

    generatePublicKey (privateKey) {
        return '0x'+ethUtil.privateToAddress(privateKey).toString('hex');
    },

    getPrivateKeyFromKeyStore (accountAddress, keyStorePath, password) {
        var keyObject = keythereum.importFromFile(accountAddress, keyStorePath);
        var privateKey = keythereum.recover(password, keyObject);
        return privateKey.toString('hex');
    },

    async subscribe (string,web3,callback) {
        web3.eth.subscribe(string,(error,transaction)=>{
            if(error){
                console.log("error",`SUBSCRIBE:\n${error.message}\n${error.stack}`);
            }else{
                callback(transaction);
            }
        });
    },
    
    // to get all events from a submitted transaction to send to node application
    async listen(contract,callback){
        contract.events.allEvents({
            fromBlock: 0,
            toBlock  : 'latest'
        },(err,event)=>{
            if(err){
                console.log('error',`\n${err.message}\n${err.stack}`)
            }else{
                console.log('info',`:\n${event}`);
                callback(event);
            }
        });
    },

    async getData(fromAccount,toContract,endata,web3){
        return await web3.eth.call({
            from : fromAccount,
            to: toContract,
            data: endata
        });
    },

    split(array){
        temp = [];
        add = [];
        array = array.slice(2,array.length);
        for(var i=0;i<array.length;i+=64){
            temp.push(array.slice(i,i+64));
        }
        for(var j=0;j<temp.length;j++){
            add.push("0x"+temp[j].slice(24,64));
        }
        return add.splice(2, add.length);
    },

    convertToBool(inputString){
        if(inputString == "0x0000000000000000000000000000000000000000000000000000000000000001")
            return true;
        else (inputString == "0x0000000000000000000000000000000000000000000000000000000000000000")
            return false;
    },

    readContractsFromConfig(contractsList){
        try{
            var contractFileName = __dirname + "/keyStore/" + "contractsConfig.json";
            var keyData = {};
            if(fs.existsSync(contractFileName)){
                keyData = fs.readFileSync(contractFileName,"utf8");
                contractsList = JSON.parse(keyData);
            }
            return contractsList;
        }
        catch (error) {
            console.log("Error in utils.readContractsFromConfig: " + error);
        }
    },   
    
    writeContractsINConfig(ERC20MockAddress){
        try{
            var contractFileName = __dirname + "/keyStore/" + "contractsConfig.json";
            contractsList["ERC20Mock"] = ERC20MockAddress;
        
            var data = JSON.stringify(contractsList,null, 2);
            fs.writeFileSync(contractFileName,data);
        }
        catch (error) {
            console.log("Error in utils.writeContractsINConfig: " + error);
        }
    },

    async createAccountsAndManageKeys(){
    
        var accountAddressList = [],privateKey = {};
        var privateKeyFileName = __dirname + "/keyStore/" + "privatekey.json";
        if(fs.existsSync(privateKeyFileName)){
            var keyData = fs.readFileSync(privateKeyFileName,"utf8");
            privateKey = JSON.parse(keyData);
            accountAddressList = Object.keys(privateKey);
        }    
        else{    
            var prvkey1 = keccak(web3,mnemonic['account1']);
            var prvkey2 = keccak(web3,mnemonic['account2']);
            var prvkey3 = keccak(web3,mnemonic['account3']);
            var prvkey4 = keccak(web3,mnemonic['account4']);
    
            pubkey1 = generatePublicKey(prvkey1);
            pubkey2 = generatePublicKey(prvkey2);
            pubkey3 = generatePublicKey(prvkey3);
            pubkey4 = generatePublicKey(prvkey4);
            
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
            console.log("There are", accountAddressList.length, "accounts in the config file");
        }
        return [accountAddressList,privateKey];
    },
    
    async readWritePrivateKeys(){
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
                        key = getPrivateKeyFromKeyStore(eachElement, keyStorePath, password);
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
            console.log("Error in utils.readWritePrivateKeys: " + error);
        }
    },

    async personalImportAccount(privateKey,password){
        var message = {
            method: "personal_importRawKey",
            params: [privateKey,password],
            jsonrpc: "2.0",
            id: new Date().getTime()
            };
        
        await web3.currentProvider.send(message);
        return;
    },

    async unlockPersonalAccount(account, password){
        var message = {
            method: "personal_unlockAccount",
            params: [account,password],
            jsonrpc: "2.0",
            id: new Date().getTime()
            };
        
        await web3.currentProvider.send(message);
        return;
    },

    async lockPersonalAccount(account){
        var message = {
            method: "personal_lockAccount",
            params: [account],
            jsonrpc: "2.0",
            id: new Date().getTime()
            };
        
        await web3.currentProvider.send(message);
        return;
    }

    
}
module.exports = utils;