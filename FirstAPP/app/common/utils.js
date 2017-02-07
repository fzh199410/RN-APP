/**
 * Created by fuzhihong on 16/12/22.
 */
var config=require('./config')

exports.thumb=function(key){
    if(key.indexOf('http')>-1){return key}
}

exports.avatar=function(key){
    if(!key){
        return config.backup.avatar
    }
    if(key.indexOf('http')>-1){return key}
    if(key.indexOf('data:image')>-1) return key
    if(key.indexOf('avatar/')>-1){
        return config.CLOUDINARY.baseURL+'/image/upload/'+key
    }
    return config.qiniu.avatar+key
}

exports.video=function(key){
    if(key.indexOf('http')>-1){return key}
    if(key.indexOf('video/')>-1){
        return config.CLOUDINARY.baseURL+'/video/upload/'+key
    }
    return config.qiniu.video+key
}