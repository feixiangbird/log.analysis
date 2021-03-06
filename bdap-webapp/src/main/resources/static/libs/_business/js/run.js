var run = {
		changeNodeStyle : function(nodeName, state){
			var thisObj = this;
			$.each(NODE_RUNTIME_STATE, function(i, obj){
				if(obj.state == state) {
					var fillColor = "fill:" + obj.color;
					var currentClass = $("#"+nodeName).attr("class");
					if(currentClass.indexOf("success") != -1 || currentClass.indexOf("fail") != -1){
						return;
					}
					//currentClass = currentClass.replace("success", "").replace("fail", "");
					if(thisObj.isSuccessful(state)){
						currentClass = currentClass + " success";
					}else if(thisObj.isFailed(state)){
						currentClass = currentClass + "  fail";
					}
					d3.select("#"+nodeName).attr("class",currentClass);
//					d3.select("#"+nodeName).attr("style", fillColor);
				}
			});
		},
		isSuccessful : function(state){
			if(state == 'OK' || state == 'DONE' || state == 'SUCCEEDED'){
				return true;
			}
			return false;
		},
		isFailed : function(state){
			if(state == 'ERROR' || state == 'KILLED' || state == 'FAILED'){
				return true;
			}
			return false;
		},
		
		runFlow : function(flowname){
			var isRunned = false;
			var thisObj = this;
			$.messager.confirm('Info', 'will you run the flow?', function(i) {
				if (i) {
					isRunned = true;
					if(isEmpty(flowname) && isEmpty(WHOLE_FLOW_NAME)){
						return;
					}
					if(!isEmpty(flowname)){
						WHOLE_FLOW_NAME = flowname;
					}else {
						flowname = WHOLE_FLOW_NAME;
					}
					
					var flowid = flowname;
					var requestURL = "/dashview/{userName}/flow/";
					if(flowid == undefined || flowid == "") {
						return;
					}
					requestURL += flowid;
					$.ajax({
		                type: "post",
		                url: getAjaxAbsolutePath(requestURL),
		                success: function(data, textStatus){
						  console.info(data);
						  var instanceid = data;
						  if(isEmpty(instanceid)){
								console.info("run fail.");
								return;
							}
							// save instance
							interact.saveFlowInstance(flowname, instanceid);
							FLOW_CURRENT_STAGE = "RUNNING";
							var detailInfor = "Instance '" + instanceid + "' is created.";
							msgShow('Info', detailInfor, 'info');
							WHOLE_INSTANCE_ID = instanceid;
							//open websocket
							thisObj.connectWebSoket(instanceid);
		                },
		                error: function(e){
		                	console.info(e);
		                }
					});	
				}else{
					isRunned = false;
				}
			});
			
		},
		
		connectWebSoket : function(instanceid){
			if(instanceid == undefined || $.trim(instanceid) == ''){
				return;
			}
			//test id
			//instanceid = "0000277-170104195305044-oozie-dbad-W";
			wsURI += instanceid;
			var websocket;
			var thisObj = this;
	        //判断当前浏览器是否支持WebSocket
	        if('WebSocket' in window){
	            websocket = new WebSocket(wsURI);
	        }
	        else{
	            alert('Not support websocket')
	        }
	        if(websocket == null) return;

	        //连接发生错误的回调方法
	        websocket.onerror = function(){
	        	thisObj.messageHandler(websocket, "error");
	        };

	        //连接成功建立的回调方法
	        websocket.onopen = function(event){
	        	thisObj.messageHandler(websocket, "open");
	        }

	        //接收到消息的回调方法
	        websocket.onmessage = function(event){
	        	thisObj.messageHandler(websocket, event.data);
	        }

	        //连接关闭的回调方法
	        websocket.onclose = function(){
	        	thisObj.messageHandler(websocket, "close");
	        }

	        //监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
	        window.onbeforeunload = function(){
	            websocket.close();
	        }
	    },
	    messageHandler : function(websocket, str){
			console.info(str);
			var jsonResult =  JSON.parse(str);
			
			var instanceid = jsonResult.instanceId;
			var nodeName = jsonResult.nodeName;
			var status = jsonResult.status;
			if(!isEmpty(nodeName)){
				this.changeNodeStyle(nodeName, status);
			}else{
				if(status == 'KILLED' || status == 'FAILED') {
					websocket.close();
				}
			}
			
		},
		
		getFlowLog : function(){
			console.info("WHOLE_INSTANCE_ID:   "+ WHOLE_INSTANCE_ID);
			if(!isEmpty(WHOLE_INSTANCE_ID)) {
				var url = "/dashview/pages/flowlog.html?type=flowlog&instanceid=" + WHOLE_INSTANCE_ID;
				window.open(url,'Flow Log',"fullscreen=0",false);
			}
		},
		getFlowNodeLog : function(nodename){
			console.info("WHOLE_INSTANCE_ID:   "+ WHOLE_INSTANCE_ID);
			if(!isEmpty(WHOLE_INSTANCE_ID) && !isEmpty(nodename)) {
				var url = "/dashview/pages/flowlog.html?type=flownodelog&nodename="+nodename+"&instanceid=" + WHOLE_INSTANCE_ID;
				window.open(url,nodename ,"fullscreen=0,titlebar=yes",true);
			}
		},
		
		getFlowInstanceData : function(dataName){
			console.info("WHOLE_INSTANCE_ID:   "+ WHOLE_INSTANCE_ID);
			if(!isEmpty(WHOLE_INSTANCE_ID) && !isEmpty(dataName)){
				var url = "/dashview/pages/flowlog.html?type=flownodedata&dataname="+dataName+"&instanceid=" + WHOLE_INSTANCE_ID;
				window.open(url,dataName ,"fullscreen=0,titlebar=yes",true);
			}
		},
		
		getFlowInstanceNodeStatus : function(nodename){
			var thisObj = this;
			if(!isEmpty(nodename)){
				var requestURL = "/dashview/{userName}/flow/instances/{instanceId}/nodes/{nodeName}";
				requestURL = requestURL.replace("{instanceId}", WHOLE_INSTANCE_ID).replace("{nodeName}", nodename);
				$.ajax({
	                type: "get",
	                url: getAjaxAbsolutePath(requestURL),
	                success: function(data, textStatus){
					  console.info(data);
					  //{"nodeId":"0000467-170104195305044-oozie-dbad-W@d1csvtransform","nodeName":"d1csvtransform","type":"map-reduce","status":"OK","outputFilePaths":null,"startTime":1484124372000,"endTime":1484124404000}
					  if(isEmpty(data)){
						  return;
					  }
					  var status = data.status;
					  thisObj.changeNodeStyle(nodename, status);
					  return data;
	                },
	                error: function(e){
	                	console.info(e);
	                }
				});	
			}
		},
		
		changeAllNodeColor : function(){
			var nodes = result.nodes;
			var thisObj = this;
			$.each(nodes, function(i, node){
				var nodename = node.name; 
				thisObj.getFlowInstanceNodeStatus(nodename);
			});
			if(!isEmpty(WHOLE_INSTANCE_ID) &&(FLOW_CURRENT_STAGE == 'RUNNING' || FLOW_CURRENT_STAGE == 'VIEW')){
				thisObj.connectWebSoket(WHOLE_INSTANCE_ID);
			}
			
		}


}