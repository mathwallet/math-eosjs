# mds-eosjs

## A EOS jQuery plugin for Math Wallet APP


### File Specification

+ jquery.mdseos.js -- For EOS
+ jquery.eosforce.js -- For EOS FORCE


### Tutorial


This plugin is used for interaction between DAPP (Web) and the Math Wallet APP.

Simple way to use it:

Note：for EOS please use```$.mdseos```, for EOS FORCE pelase use```$.eosforce```


##### 1. Please initialize BP information before using the plugin:

``` javascript
$.mdseos.init(
  {"nodes":[
    {"jsonRpc":"https:\/\/eostestnet.medishares.net"}, // 0: testnet-node
    {"jsonRpc":"https:\/\/eosmainnet.medishares.net"}  // 1: mainnet-node
  ]}
);
```


##### 2. Get the account of current wallet:

``` javascript
$.mdseos.app_get_account(
  function(account_info){
    console.log(account_info) //app return like this -- {"account":"medisharesbp","node":"1"}
    console.log($.mdseos.getAccount()) //getAccount() will return the latest account from app or setAccount()
  } //callback
)
```


##### 3. Query informaiton，for example: get_currency_balance:

``` javascript
$.mdseos.get_currency_balance(
  function(balance){
    console.log(balance)
  },//callback
  "medisharesbp", //account
  function(){
    alert('failed!')
  }
);
```


##### 4. Create action (for example: purchase RAM):

``` javascript
$.mdseos.create_action_buyram(
  function(action){
    console.log(action)
  },
  $.mdseos.getAccount(), // buyram payer
  $.mdseos.getAccount(), // buyram receiver
  '1.0000 EOS', // buyram quant
  false, // to Bin ( app sign set false)
  failedCallback // failed callback
);
```


##### 5. Sign transaction:

``` javascript
$.mdseos.app_create_transaction(
  function(transData){
    console.log(transData) //signed transaction
  }, //signed callback
  [action], //actions
  function(){
    alert('failed!')
  }  //failed callback
);
```


##### 6. Push tansaction:

``` javascript
$.mdseos.push_transaction_all(
  function(){
    alert('Success');
  }, //callback
  transData, //signed transaction from app
  function(){
    alert('failed!')
  } //failed callback
);
```


### Developer

[Medishares](https://github.com/MediShares)
