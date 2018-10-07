# mds-eosforcejs

## A EOS Force jQuery plugin for Math Wallet APP

麦子钱包 EOS DAPP 插件（基于 jQuery）

### File Specification

+ jquery.eosforce.js -- For EOS FORCE
+ jquery-3.2.1.min.js
+ common.js -- For MathWallet APP

### Tutorial

This plugin is used for interaction between DAPP (Web) and the Math Wallet APP.

Simple way to use it:


##### 1. Please initialize BP information before using the plugin:

``` javascript
$.eosforce.init(
  {"nodes":[
    {"jsonRpc":"https://w1.eosforce.cn","jsonRpcTrx":"https://w1.eosforce.cn","chainID":"bd61ae3a031e8ef2f97ee3b0e62776d6d30d4833c8f7c1645c657b149151004b"}, // 0: testnet-node ,jsonRpc: query-node ,jsonRpcTrx: transaction-node ,chainID: chainID
    {"jsonRpc":"https://w2.eosforce.cn","jsonRpcTrx":"https://w2.eosforce.cn","chainID":"bd61ae3a031e8ef2f97ee3b0e62776d6d30d4833c8f7c1645c657b149151004b"}  // 1: mainnet-node ,jsonRpc: query-node ,jsonRpcTrx: transaction-node ,chainID: chainID
  ]}
);
```

##### 2. Get the account of current wallet:

``` javascript
$.eosforce.app_get_account(
  function(account_info){
    console.log(account_info) //app return like this -- {"account":"mathwalletbp","node":"1"}
    console.log($.eosforce.getAccount()) //getAccount() will return the latest account from app or setAccount()
  } //callback
)
```


##### 3. Query informaiton，for example: get_currency_balance:

``` javascript
$.eosforce.get_currency_balance(
  function(balance){
    console.log(balance)
  },//callback
  "medisharesbp", //account
  function(){
    alert('failed!')
  }
);
```


##### 4. Create action:

``` javascript
$.eosforce.create_action_test(
  function(action){
    console.log(action)
  },
  $.eosforce.getAccount(), // payer
  $.eosforce.getAccount(), // receiver
  '1.0000 EOS', // quant
  false, // to Bin ( app sign set false)
  failedCallback // failed callback
);
```


##### 5. Sign transaction:

``` javascript
$.eosforce.app_sign_transaction(
  function(transData){
    console.log(transData) //signed transaction
  }, //signed callback
  transaction, //transaction
  function(){
    alert('failed!')
  }  //failed callback
);
```

Note: this function will call APP's current EOS account and return the signed transaction data.


##### 6. Push tansaction:

``` javascript
$.eosforce.push_transaction_all(
  function(){
    alert('Success');
  }, //callback
  transData, //signed transaction from app
  function(){
    alert('failed!')
  } //failed callback
);
```


### Testing

Math Wallet also provide a testing tool in [DApp] - [EOS DAPP Developer Browser] where you can enter your DAPP URL and test the functions.

![](https://github.com/MediShares/mds-eosjs/blob/master/image/testing.jpg)


### Download Math Wallet 麦子钱包下载

[http://mathwallet.org](http://mathwallet.org)

If you would like to list your DAPP in Math Wallet, please send your DAPP information to hello@medishares.org

如果您希望将您开发的DAPP加入麦子钱包，请通过邮箱联系我们 hello@medishares.org