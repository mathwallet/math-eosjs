/**
 * mdsapp使用的eos原力接口jQuery插件
 */
$.extend({
  "eosforce" : {

    httpEndpoint : null,
    chainID : null,
    netChainID : null,
    account : null,
    accountPermission : 'active',
    nodes : [],

    apiConfig : {
      get_info : '/v1/chain/get_info',
      get_block: '/v1/chain/get_block',
      abi_json_to_bin : '/v1/chain/abi_json_to_bin',
      push_transaction : '/v1/chain/push_transaction',
      get_table_rows : '/v1/chain/get_table_rows',
      get_account : '/v1/chain/get_account',
      get_producers : '/v1/chain/get_producers',
      get_currency_balance : '/v1/chain/get_currency_balance',
      abi_json_to_bin : '/v1/chain/abi_json_to_bin',
      get_account_registed : '/v1/chain/get_account',
      get_actions : '/v1/history/get_actions',
      get_required_fee : '/v1/chain/get_required_fee',
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
      this.accountPermission = 'active';
    },

    //获取活跃账号
    getAccount : function(){
      return this.account;
    },

    //设置活跃账户权限
    setAccountPermission : function(permission){
      this.accountPermission = permission;
    },


    //获取活跃账户权限
    getAccountPermission : function(){
      return this.accountPermission;
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
        this.httpEndpointTrx = this.nodes[chainID].jsonRpcTrx;
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

    //获取链信息
    get_info : function(callback,error){
      this.get(callback,this.httpEndpointTrx+this.apiConfig.get_info,error);
    },

    //获取当前节点地址
    getHttpEndPoint : function(){
      return this.httpEndpoint
    },

    //获取eosjs
    getEos : function(){
      var that = this;
      var customSignProvider = function({buf, sign, transaction}){
        // 获取fee
        $.eosforce.get_required_fee(function(res){
          transaction['fee'] = res.required_fee;
        },{"transaction":{"actions":transaction.actions}},function(){});

        return new Promise((resolve, reject) => {
          that.app_sign_transaction(
            function(res){
              if(res.error){
                reject(res.error)
              }else{
                resolve(res.result);
              }
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

    //获取块信息
    get_block : function(callback,number,error){
      this.post(callback,this.httpEndpointTrx+this.apiConfig.get_block,{"block_num_or_id":number},error);
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
      this.post(callback,this.httpEndpointTrx+this.apiConfig.push_transaction,{
        compression : compression,
        transaction : transaction,
        signatures : signatures,
      },error);
    },

    //发起交易 - 传入完整数据
    push_transaction_all : function(callback,data,error){
      this.post(callback,this.httpEndpointTrx+this.apiConfig.push_transaction,data,error);
    },

    // 注册供APP使用的全局回调
    app_sign_global_callback : function(callback){
      if(typeof(callback) == 'function'){
        var globalCallbackFuncName = 'eosforceappcallback' + new Date().getTime() + Math.floor(Math.random()*100000000+10000000);
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
      var that = this;
      this.postMessage(JSON.stringify({
        "method":"eosforceGetAccount",
        "callback":this.app_sign_global_callback(function(res){
          var accountInfo = JSON.parse(res);
          $.eosforce.setAccount(accountInfo.account);
          $.eosforce.setNode(accountInfo.node);
          if(accountInfo.authority){
            that.setAccountPermission(accountInfo.authority);
          }
          callback(accountInfo);
        })
      }));
    },

    // MDSAPP 交易签名
    app_sign_transaction : function(callback,transaction,error){
      this.postMessage(JSON.stringify({
        "method":"eosforceTransactionSign",
        "params":{"transaction":transaction,"network":{
          blockchain:"eosforce",
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
        "method":"eosforceTransactionCreate",
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
    create_action_voteproducer : function(callback,voter,bpname,stake,toBin,error){
      var action = {
        code: "eosio",
        action: "vote",
        args: {
          voter:voter,
          bpname:bpname,
          stake:stake
        }
      }

      if(toBin){
        this.abi_json_to_bin(function(binargs){
          callback()});
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
    
    //领取分红
    create_action_claim : function(callback,voter,bpname,toBin,error){
      var action = {
        code: "eosio",
        action: "claim",
        args: {
          voter:voter,
          bpname:bpname,
        }
      }

      if(toBin){
        this.abi_json_to_bin(function(binargs){
          callback()});
      }else{
        callback(action);
      }
    },

    //赎回
    create_action_unfreeeze : function(callback,voter,bpname,toBin,error){
      var action = {
        code: "eosio",
        action: "unfreeze",
        args: {
          voter:voter,
          bpname:bpname,
        }
      }

      if(toBin){
        this.abi_json_to_bin(function(binargs){
          callback()});
      }else{
        callback(action);
      }
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
              var startTime = $.eosforce.dateToTime(res.rows[0].request_time);
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

    //获取所有节点
    get_producers : function(callback,limit,error){
      if(!limit) var limit = -1;
      this.get_table_rows(
        function(res){
          if(res)
            callback(res);
          else
            return null;
        },
        {
          "code": "eosio",
          "scope": "eosio",
          "table": "bps",
          "limit": limit,
          "json":  true
        },error);
    },

    //获取节点信息
    get_producer_detial : function(callback,producer,error){
      if(!limit) var limit = -1;
      this.get_table_rows(
        function(res){
          if(res)
            callback(res);
          else
            return null;
        },
        {
          "code": "eosio",
          "scope": "eosio",
          "table": "bps",
          "table_key": producer,
          "json":  true
        },error);
    },

    //获取超级节点
    get_top_producers : function(callback,producer,error){
      this.get_info(function(res){
        $.eosforce.get_block(function(res2){
          $.eosforce.get_table_rows(
            function(res3){
              if(res3)
                callback(res3);
              else
                return null;
            },
            {
              "code": "eosio",
              "scope": "eosio",
              "table": "schedules",
              "table_key": res2.schedule_version,
              "json":  true
            },error);
        },res.head_block_num,error);
      },error);
    },

    //获取用户投票信息
    get_voter : function(callback,account,error){
      if(!account) account = this.account;
      return this.get_table_rows(
        function(res){
          if(res)
            callback(res);
          else
            return null;
        },
        {
          "code": "eosio",
          "scope": account,
          "table": "votes",
          "limit": -1,
          "json":  true
        },
        error
      );
    },

    //获取账户余额
    get_currency_balance : function(callback,account,error){
      if(!account) account = this.account;
      return this.post(
        function(res){
          balance = res.rows[0].available.substr(0,res.rows[0].available.length-4);
          callback(balance);
        },
        this.httpEndpoint+this.apiConfig.get_table_rows,{
          code : "eosio",
          "scope": "eosio",
          "table": "accounts",
          "table_key": account,
          "json":  true
        },
        error
      );
    },

    //获取矿工费
    get_required_fee : function(callback,transaction,error){
      console.log(transaction);
      this.post(
        function(res){ callback(res); },
        this.httpEndpoint+this.apiConfig.get_required_fee,
        transaction,
        error
      );
    },

    get : function(callback,url,error){
      $.ajaxSettings.async = false;
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
      $.ajaxSettings.async = true;
    },

    post : function(callback,url,data,error){
      $.ajaxSettings.async = false;
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
      $.ajaxSettings.async = true;
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
    },


  }
});