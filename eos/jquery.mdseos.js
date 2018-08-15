/**
 * mdsapp使用的eos接口jQuery插件
 */
$.extend({
  "mdseos" : {

    httpEndpoint : null,
    chainID : null,
    netChainID : null,
    account : null,
    nodes : [],

    apiConfig : {
      get_info : '/v1/chain/get_info',
      abi_json_to_bin : '/v1/chain/abi_json_to_bin',
      push_transaction : '/v1/chain/push_transaction',
      get_table_rows : '/v1/chain/get_table_rows',
      get_account : '/v1/chain/get_account',
      get_producers : '/v1/chain/get_producers',
      get_currency_balance : '/v1/chain/get_currency_balance',
      abi_json_to_bin : '/v1/chain/abi_json_to_bin',
      get_account_registed : '/v1/chain/get_account',
      get_actions : '/v1/history/get_actions',
    },

    //初始化
    init : function(config){
      if(config.nodes) this.nodes = config.nodes;
      if(config.httpEndpoint) this.httpEndpoint = config.httpEndpoint;
      if(config.chainID) this.chainID = config.chainID;
    }, 

    //设置活跃账号
    setAccount : function(account){
      this.account = account;
    },

    //获取活跃账号
    getAccount : function(){
      return this.account;
    },

    //获取当前账号的社区
    // getNode : function(){
    //   return this.node;
    // },

    //设置当前社区
    setNode : function(chainID){
      if(this.nodes[chainID] && this.nodes[chainID].jsonRpc){
        this.chainID = chainID;
        this.httpEndpoint = this.nodes[chainID].jsonRpc;
        this.netChainID = this.nodes[chainID].chainID;
        return true;
      }else{
        return false;
      }
    },

    //获取当前社区
    getNode : function(){
      return this.chainID;
    },

    //获取当前链ID
    getChainID : function(){
      return this.netChainID
    },

    //获取当前节点地址
    getHttpEndPoint : function(){
      return this.httpEndpoint
    },

    //获取eosjs
    getEos : function(){
      var customSignProvider = ({buf, sign, transaction}) => {
        return new Promise((resolve, reject) => {
          this.app_sign_transaction(
            function(res){
              resolve(res.signatures);
            },
            transaction,
            function(err){
              reject(err)
            });
        });
      }

      return Eos({
        httpEndpoint: this.getHttpEndPoint(),
        chainId: this.getChainID(),
        signProvider: customSignProvider,
      });
    },

    //获取链信息
    get_info : function(callback,error){
      this.get(callback,this.httpEndpoint+this.apiConfig.get_info,error);
    },

    //序列化
    abi_json_to_bin : function(callback,data,error){
      this.post(function(res){
        callback(res.binargs);
      },this.httpEndpoint+this.apiConfig.abi_json_to_bin,data,error);
    },

    //发起交易
    push_transaction : function(callback,transaction,signatures,compression,error){
      if(!compression) compression = "none";
      this.post(callback,this.httpEndpoint+this.apiConfig.push_transaction,{
        compression : compression,
        transaction : transaction,
        signatures : signatures,
      },error);
    },

    //发起交易 - 传入完整数据
    push_transaction_all : function(callback,data,error){
      this.post(callback,this.httpEndpoint+this.apiConfig.push_transaction,data,error);
    },

    // 注册供APP使用的全局回调
    app_sign_global_callback : function(callback){
      if(typeof(callback) == 'function'){
        var globalCallbackFuncName = 'mdseosappcallback' + new Date().getTime() + Math.floor(Math.random()*100000000+10000000);
        window[globalCallbackFuncName] = function(res){
          callback(res);
          window[globalCallbackFuncName] = null;
        }
        console.log(globalCallbackFuncName);
        return globalCallbackFuncName;
      }else{
        return callback;
      }
    },

    // MDSAPP 获取账号
    app_get_account : function(callback){
      this.postMessage(JSON.stringify({
        "method":"eosGetAccount",
        "callback":this.app_sign_global_callback(function(res){
          var accountInfo = JSON.parse(res);
          $.mdseos.setAccount(accountInfo.account);
          $.mdseos.setNode(accountInfo.node);
          callback(accountInfo);
        })
      }));
    },

    // MDSAPP 交易签名
    app_sign_transaction : function(callback,transaction,error){
      this.postMessage(JSON.stringify({
        "method":"eosTransactionSign",
        "params":{"transaction":transaction,"network":{
          blockchain:"eos",
          chainId:this.netChainID,
        }},
        "callback":this.app_sign_global_callback(function(res){
          callback(JSON.parse(res));
        })
      }));
    },

    // MDSAPP 委托交易
    app_create_transaction : function(callback,actions,error){
      this.postMessage(JSON.stringify({
        "method":"eosTransactionCreate",
        "params":{"actions":actions},
        "callback":this.app_sign_global_callback(function(res){
          if(res == ''){
            error();
          }else{
            callback(JSON.parse(res));
          }
        })
      }));
    },

    //创建投票交易动作
    create_action_voteproducer : function(callback,voter,proxy,producers,toBin,error){
      var action = {
        code: "eosio",
        action: "voteproducer",
        args: {
          voter:voter,
          proxy:'',
          producers:producers.sort(),
        }
      }

      if(toBin){
        this.abi_json_to_bin(function(binargs){
          callback({
            account: voter,
            name: "voteproducer",
            authorization: [
              {
                actor: "eosio",
                permission: "active"
              }
            ],
            data: binargs
          });
        },action,error);
      }else{
        callback(action);
      }
    },

    //创建抵押net-cpu交易动作
    create_action_delegatebw : function(callback,from,receiver,stake_net_quantity,stake_cpu_quantity,toBin,error){
      var action = {
        code: "eosio",
        action: "delegatebw",
        args: {
          from:from,
          receiver:receiver,
          stake_net_quantity:parseFloat(stake_net_quantity).toFixed(4)+" EOS",
          stake_cpu_quantity:parseFloat(stake_cpu_quantity).toFixed(4)+" EOS",
          transfer:false
        }
      }

      if(toBin){
        this.abi_json_to_bin(function(binargs){
          callback({
            account: from,
            name: "delegatebw",
            authorization: [
              {
                actor: "eosio",
                permission: "active"
              }
            ],
            data: binargs
          });
        },action,error);
      }else{
        callback(action);
      }
    },

    //创建为他人抵押net-cpu交易动作 (可转账给他人)
    create_action_delegatebw_to_other : function(callback,from,receiver,stake_net_quantity,stake_cpu_quantity,transfer,toBin,error){
      var action = {
        code: "eosio",
        action: "delegatebw",
        args: {
          from:from,
          receiver:receiver,
          stake_net_quantity:parseFloat(stake_net_quantity).toFixed(4)+" EOS",
          stake_cpu_quantity:parseFloat(stake_cpu_quantity).toFixed(4)+" EOS",
          transfer:transfer
        }
      }

      if(toBin){
        this.abi_json_to_bin(function(binargs){
          callback({
            account: from,
            name: "delegatebw",
            authorization: [
              {
                actor: "eosio",
                permission: "active"
              }
            ],
            data: binargs
          });
        },action,error);
      }else{
        callback(action);
      }
    },

    //创建赎回net-cpu交易动作
    create_action_undelegatebw : function(callback,from,receiver,unstake_net_quantity,unstake_cpu_quantity,toBin,error){
      var action = {
        code: "eosio",
        action: "undelegatebw",
        args: {
          from:from,
          receiver:receiver,
          unstake_net_quantity:parseFloat(unstake_net_quantity).toFixed(4)+" EOS",
          unstake_cpu_quantity:parseFloat(unstake_cpu_quantity).toFixed(4)+" EOS"
        }
      }

      if(toBin){
        this.abi_json_to_bin(function(binargs){
          callback({
            account: from,
            name: "undelegatebw",
            authorization: [
              {
                actor: "eosio",
                permission: "active"
              }
            ],
            data: binargs
          });
        },action,error);
      }else{
        callback(action);
      }
    },

    //创建购买内存交易动作（根据EOS数量）
    create_action_buyram : function(callback,payer,receiver,quant,toBin,error){
      var action = {
        code: "eosio",
        action: "buyram",
        args: {
          payer:payer,
          receiver:receiver,
          quant:quant
        }
      }

      if(toBin){
        this.abi_json_to_bin(function(binargs){
          callback({
            account: payer,
            name: "buyram",
            authorization: [
              {
                actor: "eosio",
                permission: "active"
              }
            ],
            data: binargs
          });
        },action,error);
      }else{
        callback(action);
      }
    },

    //创建购买内存交易动作（根据内存大小）
    create_action_buyrambytes : function(callback,payer,receiver,bytes,toBin,error){
      var action = {
        code: "eosio",
        action: "buyrambytes",
        args: {
          payer:payer,
          receiver:receiver,
          bytes:bytes
        }
      }

      if(toBin){
        this.abi_json_to_bin(function(binargs){
          callback({
            account: payer,
            name: "buyrambytes",
            authorization: [
              {
                actor: "eosio",
                permission: "active"
              }
            ],
            data: binargs
          });
        },action,error);
      }else{
        callback(action);
      }
    },

    //创建普通账户（12位）
    create_action_newaccount : function(callback,creator,account,ownerKey,activeKey,toBin,error){
      var action = {
        "code": "eosio",
        "action": "newaccount",
        "args": {
          "creator": creator,
          "name": account,
          "owner": {
             "threshold": 1,
             "keys": [
               {
                 "key": ownerKey,
                 "weight": 1
               }
             ],
             "accounts": [],   
             "waits": []      
          },
          "active": {
            "threshold": 1,
            "keys": [
              {
                "key": activeKey,
                "weight": 1
              }
            ],
            "accounts": [],    
            "waits": []   
          } 
        }
      }
      if(toBin){
        this.abi_json_to_bin(function(binargs){
          callback();
        })
      }else{
        callback(action);
      }
    },
    //创建售卖内存交易动作（根据内存大小）
    create_action_sellram : function(callback,account,bytes,toBin,error){
      var action = {
        code: "eosio",
        action: "sellram",
        args: {
          account:account,
          bytes:bytes
        }
      }

      if(toBin){
        this.abi_json_to_bin(function(binargs){
          callback({
            account: account,
            name: "sellram",
            authorization: [
              {
                actor: "eosio",
                permission: "active"
              }
            ],
            data: binargs
          });
        },action,error);
      }else{
        callback(action);
      }
    },

    //查询账户名是否已被注册（12位）
    get_account_registed : function(callback,account,error){
      return this.post(callback,this.httpEndpoint+this.apiConfig.get_account_registed,{"account_name":account},error);
    },

    //获取账户信息
    get_account : function(callback,account,error){
      if(!account) account = this.account;
      return this.post(callback,this.httpEndpoint+this.apiConfig.get_account,{
        account_name: account
      },error);
    },

    //获取表信息
    get_table_rows : function(callback,data,error){
      return this.post(callback,this.httpEndpoint+this.apiConfig.get_table_rows,data,error);
    },
    // 获取给他人抵押 net,cpu 信息
    get_other_delegatebw : function(callback,account,error){
      data = {
                "code": "eosio",
                "scope": account,
                "table": "delband",
                "json":  true
              }
      return this.post(callback,this.httpEndpoint+this.apiConfig.get_table_rows,data,error);       
    },
    // 查询账户名抢注信息
    get_bid_names : function(callback,name,limit,error){
      data = {
                "json":true,
                "code":"eosio",
                "scope":"eosio",
                "table":"namebids",
                "lower_bound":name,
                "limit":limit,
              };
      this.post(callback,this.httpEndpoint+this.apiConfig.get_table_rows,data,error);
    },

    // 创建用户名竞拍动作
    create_action_bidname : function(callback,bidder,newname,price,toBin,error){
      var action = {
                    code: "eosio",
                    action: "bidname",
                    args: {
                      bidder:bidder,
                      newname:newname,
                      bid:price + " EOS"
                    }
                  };

      if(toBin){
        this.abi_json_to_bin(function(binargs){
          callback({});
        },action,error);
      }else{
        callback(action);
      }
    }, 

    // 获取action信息
    get_actions : function(callback,account,pos,offset,error){
      if(!account) account = this.account;
      this.post(function(res){
        if(res.actions[0]){
          callback(res.actions[0]);
        }else{
          callback(null);
        }
      },
      this.httpEndpoint+this.apiConfig.get_actions,
      {
        pos : pos,
        offset : offset,
        account_name : account
      },
      error);
    },

    //获取用户抵押资源信息
    get_userres : function(callback,account,error){
      if(!account) account = this.account;
      return this.get_table_rows(
        function(res){
          //资产数字信息
          if(res.rows[0]){
            var cpu_info = res.rows[0].cpu_weight.split(" ");
            var net_info = res.rows[0].net_weight.split(" ");
            res.rows[0].cpu_value = parseFloat(cpu_info[0]);
            res.rows[0].net_value = parseFloat(net_info[0]);
          }
          callback(res.rows[0])
        },
        {
          scope : account,
          code : 'eosio',
          table : 'userres',
          json : true
        },
        error
      );
    },

    //获取用户赎回中的资产信息
    get_refunds : function(callback,account,error){
      if(!account) account = this.account;
      return this.get_table_rows(
        function(res){
          //资产数字信息
          if(res.rows[0]){
            var cpu_info = res.rows[0].cpu_amount.split(" ");
            var net_info = res.rows[0].net_amount.split(" ");
            res.rows[0].cpu_value = parseFloat(cpu_info[0]);
            res.rows[0].net_value = parseFloat(net_info[0]);
            //remain time
            if(res.rows[0].request_time){
              var startTime = $.mdseos.dateToTime(res.rows[0].request_time);
              var endTime = startTime + 3600*72*1000;
              var now = new Date().getTime() + new Date().getTimezoneOffset()*60*1000;
              res.rows[0].leftTime = endTime - now;
            }else{
              res.rows[0].leftTime = 0;
            }
          }
          callback(res.rows[0])
        },
        {
          scope : account,
          code : 'eosio',
          table : 'refunds',
          json : true
        },
        error
      );
    },

    //获取节点
    get_producers : function(callback,limit,error){
      if(!limit) var limit = -1;
      this.post(callback,this.httpEndpoint+this.apiConfig.get_producers,{
        limit : limit,
        json : true,
      },error);
    },

    //获取用户投票信息
    get_voter : function(callback,account,error){
      if(!account) account = this.account;
      return this.get_table_rows(
        function(res){
          if(res.rows[0])
            callback(res.rows[0]);
          else
            return null;
        },
        {
          scope : 'eosio',
          code : 'eosio',
          table : 'voters',
          lower_bound:account,
          limit : 1,
          json : true
        },
        error
      );
    },

    //获取内存价格
    get_ram_eos : function(callback,error){
      return this.get_table_rows(
        function(res){
          if(res.rows[0]){
            var eoskb = parseFloat(res.rows[0].quote.balance) / parseFloat(res.rows[0].base.balance) * 1024.0;
            res.rows[0].extend = {
              eoskb : eoskb
            }
            callback(res.rows[0]);
          }
          else
            return null;
        },{
          "code": "eosio",
          "scope": "eosio",
          "table": "rammarket",
          "json":  true
        },
        error)
      ;
    },

    //获取账户余额
    get_currency_balance : function(callback,account,error){
      if(!account) account = this.account;
      return this.post(
        function(res){
          var result = [];
          for(var i=0,len=res.length; i < len; i++){
            var balance = res[i].split(" ");
            result[balance[1]] = balance[0];
          }
          callback(result);
        },
        this.httpEndpoint+this.apiConfig.get_currency_balance,{
          account : account,
          code : 'eosio.token',
          symbol : 'EOS'
        },
        error
      );
    },

    get : function(callback,url,error){
      $.get({
        url : url,
        dataType : 'JSON',
        success : callback,
        error : function(XMLHttpRequest, textStatus, errorThrown){
          if(XMLHttpRequest.status == 500){
            var errorMsg = JSON.parse(XMLHttpRequest.responseText);
            if(errorMsg && errorMsg.error && typeof(error) == 'function'){
              error(errorMsg.error);
            }
          }
        }
      });
    },

    post : function(callback,url,data,error){
      return $.post({
        url : url,
        data : JSON.stringify(data),
        contentType: "text/plain;charset=UTF-8",
        dataType : 'JSON',
        success : callback,
        error : function(XMLHttpRequest, textStatus, errorThrown){
          if(XMLHttpRequest.status == 500){
            var errorMsg = JSON.parse(XMLHttpRequest.responseText);
            if(errorMsg && errorMsg.error && typeof(error) == 'function'){
              error(errorMsg.error);
            }
          }
        }
      });
    },

    dateToTime : function(date){
      var timeArr = date.split('T');
      var timeStr = timeArr[0].replace(/-/g,'/')+' '+timeArr[1];
      return new Date(timeStr).getTime();
    },

    postMessage: function(value){
      var u = navigator.userAgent, app = navigator.appVersion;
      try{
        if(u.indexOf('Android') > -1 || u.indexOf('Adr') > -1){
          mds.postMessage(value)
        }
        if(u.indexOf('iPhone') > -1){
          window.webkit.messageHandlers.mds.postMessage(value)
        }
      }
      catch(err){
      }
    }
  }
});