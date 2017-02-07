/**
 * Created by fuzhihong on 16/12/7.
 */
var queryString=require('query-string');
var lodash=require('lodash');
var Mock=require('mockjs');
var config=require('./config');
var request={};

request.get=function(url,params){
    console.log(queryString.stringify(params))
    if(params){
        url+='?'+queryString.stringify(params)
    }
    return fetch(url)
        .then((response) => response.json())
        .then((responseText) => Mock.mock(responseText))
}
request.post=function(url,body){
    var options=lodash.extend(config.header,{
        body: JSON.stringify(body)
    })
    console.log(url)
    console.log(options)
    return fetch(url,options)
        .then((response)=>response.json())
        .then((response) => Mock.mock(response))
}
module.exports=request;