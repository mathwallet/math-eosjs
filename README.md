# For Math Wallet DAPP Developer

## Math Wallet is also compatible with Scatter

### Quick Code

Install eosjs@16.0.9

Installation: npm i -S @scatterjs/core @scatterjs/eosjs eosjs@16.0.9

```
import ScatterJS from '@scatterjs/core';
import ScatterEOS from '@scatterjs/eosjs';
import Eos from 'eosjs';

ScatterJS.plugins( new ScatterEOS() );

const network = ScatterJS.Network.fromJson({
    blockchain:'eos',
    chainId:'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
    host:'nodes.get-scatter.com',
    port:443,
    protocol:'https'
});

ScatterJS.connect('YourAppName', {network}).then(connected => {
    if(!connected) return console.error('no scatter');

    const eos = ScatterJS.eos(network, Eos);

    ScatterJS.login().then(id => {
        if(!id) return console.error('no identity');
        const account = ScatterJS.account('eos');
        const options = {authorization:[`${account.name}@${account.authority}`]};
        eos.transfer(account.name, 'safetransfer', '0.0001 EOS', account.name, options).then(res => {
            console.log('sent: ', res);
        }).catch(err => {
            console.error('error: ', err);
        });
    });
});
```

More samples:

https://github.com/MediShares/scatter-eos-sample

### Other Methods

http://doc.mathwallet.org/en/eos/

### Download Math Wallet 麦子钱包下载

[http://mathwallet.org](http://mathwallet.org)

If you would like to list your DAPP in Math Wallet, please follow the steps in http://blog.mathwallet.net/?p=398

如果您希望将您开发的DAPP加入麦子钱包，请查看 http://blog.mathwallet.net/?p=398