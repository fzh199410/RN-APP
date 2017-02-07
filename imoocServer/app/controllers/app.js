/**
 * Created by fuzhihong on 16/12/14.
 */
var mongoose=require('mongoose');
var User=mongoose.model('User');
var robot=require('../service/robot');
var uuid=require('uuid')

exports.signature=function *(next){
    var body=this.request.body;
    var cloud=body.cloud;
    var result;
    if(cloud==='qiniu'){
        console.log('七牛获取token');
        result=robot.getQiniuToken(body)
    }else{
        console.log('外国获取token');
        result=robot.getCloudinaryToken(body)
    }
    this.body={
        success:true,
        data:{
            token:result.token,
            key:result.key
        }
    }
};
exports.hasBody=function *(next){

    var body=this.request.body||{};
    if(Object.keys(body).length===0){
        this.body={
            success:false,
            err:'是不是漏掉什么了'
        }
        return next
    }
    yield next
};
exports.hasToken=function *(next){
    var accessToken=this.query.accessToken;
    if(!accessToken){
        accessToken=this.request.body.accessToken
    }
    if(!accessToken){
        this.body={
            success:false,
            err:'Token丢失了'
        };
        return next
    }
    var user=yield User.findOne({
        accessToken:accessToken
    }).exec();
    if(!user){
        this.body={
            success:false,
            err:'用户没登录'
        };
        return next
    }
    this.session=this.session||{};
    this.session.user=user;
    yield next
};