const moment = require('moment');
const EthereumTx = require('ethereumjs-tx');
const solc = require('solc');
const fs = require('fs');
var keythereum = require('keythereum');
const async =  require('async');
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

    async getContractEncodeABI(abi,bytecode,web3,arg){
        try{
            let contract = new web3.eth.Contract(JSON.parse(abi));
            return await contract.deploy({ data : bytecode, arguments : arg}).encodeABI();
            //return await contract.deploy({ data : bytecode, arguments : arg, "privateFor" : privateFor }).encodeABI();
        } catch (error) {
            console.log("Exception in utils.getContractEncodeABI(): " + error);
        } 
    },
    
    async deployContract(contractAbi, bytecode, ownerAddress, constructorParameters, web3 /*callback*/) {
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
                //"privateFor" : privateFor
            });
            // .on('error', function(error){ 
            //     if(!error)
            //         console.log("error", error);
            // })
            // .on('receipt', receipt => {
            //     deployedAddress = receipt.contractAddress;
            //     // implement it on asysn await.
            //     return deployedAddress;
            // })
            // .on('transactionHash', function(transactionHash){
            //     console.log('transactionHash', transactionHash);
            //     //web3.eth.getTransaction(transactionHash);
            //     callback("transactionHash", transactionHash);
            // })
            // .then(transaction => {
            //     console.log("transaction",transaction);
            // });
            return deployedAddress._address;
        } catch (error) {
            console.log("Exception in utils.deployContract(): " + error);
        }    
    },

    async deployContractOldWeb3(contractAbi, bytecode, fromAccountAddress, privateKey, constructorParameters) {
        console.log("deployContractOldWeb3");
        try{
            var myContract = web3.eth.contract(JSON.parse(contractAbi));
            //constructorParameters.size()
            //var param1 = "0xf232a4bf183cf17d09bea23e19ceff58ad9dbfed", param2 = "1000000000000000000";
            //var byteCodeWithParam = myContract.new.getData(param1,param2,{data: bytecode});
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

                var receipt = await web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'));
          
                receipt = web3.eth.getTransactionReceipt(receipt);
                console.log("ERC20Mock deployedAddress ", receipt.contractAddress);
                return receipt.contractAddress;
            }
        } catch (error) {
            console.log("Exception in utils.deployContractOldWeb3(): " + error);
        }    
    },
    
    async sendMethodTransactionOld (fromAccountAddress, toContractAddress, methodData, privateKey, web3, value){//, calleeMethodName,callback) {
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
    },  
    
    async sendMethodTransaction (fromAccountAddress, toContractAddress, methodData, privateKey, web3, estimatedGas){//, calleeMethodName,callback) {
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

    readContractsFromConfig(){
        try{
            var contractFileName = __dirname + "/keyStore/" + "contractsConfig.json";
            var keyData = {};
            if(fs.existsSync(contractFileName)){
                keyData = fs.readFileSync(contractFileName,"utf8");
                contractsList = JSON.parse(keyData);
                if(contractsList["ERC20Mock"] != undefined){
                    ERC20MockAddress = contractsList["ERC20Mock"];
                    return ERC20MockAddress;
                }    
            }
        }
        catch (error) {
            console.log("Error in readContractsFromConfig: " + error);
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
            console.log("Error in writeContractsINConfig: " + error);
        }
    }   
}
module.exports = utils;