/**
 * Created by fuzhihong on 16/12/15.
 */
'use strict'
var qiniu=require('qiniu');
var cloudinary=require('cloudinary')
var config=require('../../config/config');
var sha1=require('sha1');
var uuid=require('uuid');
var Promise=require('bluebird');

qiniu.conf.ACCESS_KEY = config.qiniu.AK;
qiniu.conf.SECRET_KEY = config.qiniu.SK;
qiniu.conf.UP_HOST='http://up-z2.qiniu.com';

cloudinary.config(config.CLOUDINARY)
//构建上传策略函数

exports.getQiniuToken=function(body){
    var key=uuid.v4();
    var type=body.type;
    var putPolicy;
    var options={
        persistentNotifyUrl:config.notify
    }
    if(type==='avatar'){
        //putPolicy.callbackUrl = 'http://your.domain.com/callback';
        //putPolicy.callbackBody = 'filename=$(fname)&filesize=$(fsize)';
        key+='.jpeg';
        putPolicy=new qiniu.rs.PutPolicy("fuzhihong19940110:"+key);
    }else if(type==='video'){
        key += '.mp4'
        options.scope = 'gougouvideo:' + key
        options.persistentOps = 'avthumb/mp4/an/1'
        putPolicy = new qiniu.rs.PutPolicy2(options)
    }else if(type==='audio'){
        //TODO
    }
    var token=putPolicy.token();
    return {
        key:key,
        token:token
    };
};


exports.getCloudinaryToken=function(body){
    var type=body.type;
    var timestamp=body.timestamp;
    var folder,tags;
    if(type==='avatar'){
        folder='avatar';
        tags='app,avatar'
    }else if(type==='video'){
        folder='video';
        tags='app,video'
    }else if(type==='audio'){
        folder='audio';
        tags='app,audio'
    }
    var signature='folder='+folder+'&tags='+tags+'&timestamp='+timestamp+config.CLOUDINARY.api_secret;
    signature=sha1(signature);
    var key=uuid.v4()
    return {
        token:signature,
        key:key
    }
}
exports.uploadToCloudinary=function(url){
    return new Promise(function(resolve,reject){
        cloudinary.uploader.upload(url,function(res){
            if(res&&res.public_id){
                resolve(res)
            }else{
                reject(res)
            }
        },{resource_type:'video',folder:'video'})
    })
};
exports.saveToQiniu=function(url,key){

    var client = new qiniu.rs.Client();

    return new Promise(function(resolve, reject) {
        client.fetch(url, 'gougouvideo', key, function(err, ret) {
            if (!err) {
                resolve(ret)
            }
            else {
                reject(err)
            }
        })
    })
}