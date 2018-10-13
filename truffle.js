/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a 
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() { 
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>') 
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      gasPrice: 0,
      gas: 4500000,
      network_id: '*', // eslint-disable-line camelcase
      //from : "0x44643353444f4b42b46ed28e668c204db6dbb7c3"
      from : "0x1ce135327d2372d556e2ea822bdd92803e5697cf"
    }
  }
};  