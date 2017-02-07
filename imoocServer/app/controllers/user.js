/**
 * Created by fuzhihong on 16/12/14.
 */
'use strict'
var mongoose=require('mongoose');
var User=mongoose.model('User');
var Creation=mongoose.model('Creation')
var sms=require('../service/sms');
var xss=require('xss');
var uuid=require('uuid');

exports.signup=function *(next){
    var phoneNumber=xss(this.request.body.phoneNumber.trim());

    var user=yield User.findOne({
        phoneNumber:phoneNumber
    }).exec();

    var verifyCode=sms.getCode();
    if(!user){
        var accessToken=uuid.v4();
        user=new User({
            verifyCode:verifyCode,
            phoneNumber:xss(phoneNumber),
            accessToken:accessToken,
            nickname:'小狗狗',
            avatar:'https://res.cloudinary.com/tencent/image/upload/v1481630723/avatar/vz6epuvtwtyxyriigwww.jpg'
        })

    }else{
        user.verifyCode=verifyCode
    }
    try{
        user=yield user.save()
    }catch(err){
        this.body={
            success:false
        };
        return next
    }
    var msg='您的验证码是: '+user.verifyCode;
    try{
        sms.send(user.phoneNumber,msg);
    }catch(err){
        console.log(err);
        this.body={
            success:true,
            err:'短信服务异常'
        };
        return next
    }
    this.body={
        success:true
    }

};

exports.verify=function *(next){
    var verifyCode=this.request.body.verifyCode;
    var phoneNumber=this.request.body.phoneNumber;
    if(!verifyCode||!phoneNumber){
        this.body={
            success:false,
            err:' 验证未通过'
        };
        return next
    }
    var user=yield User.findOne({
        verifyCode:verifyCode,
        phoneNumber:phoneNumber
    }).exec();

    if(user){
        user.verified=true;
        user = yield user.save();
        this.body={
            success:true,
            data:{
                nickname:user.nickname,
                accessToken:user.accessToken,
                avatar:user.avatar
            }
        }
    }else{
        this.body={
            success:false,
            err:'验证未通过'
        }
    }
};

exports.update=function *(next){
    var body=this.request.body;
    var user=this.session.user;
    var fields='avatar,gender,age,nickname,breed'.split(',');
    fields.forEach(function(field){
        if(body[field]){
            user[field]=xss(body[field].trim())
        }
    });
    user=yield user.save();
    this.body={
        success:true,
        data:{
            nickname:user.nickname,
            accessToken:user.accessToken,
            avatar:user.avatar,
            age:user.age,
            breed:user.breed,
            gender:user.gender,
            _id:user._id
        }
    }
};

exports.publishedList=function *(next){
    var page=parseInt(this.query.page,10)||1;
    var pageCount=2;
    var offset=(page-1)*pageCount;
    var user=this.session.user;
    if(!user){
        this.body={
            success:false,
            err:'找不着用户'
        }
        return next
    }

    var publishedList=yield Creation.find({
        author:user._id
    }).exec();

    var total=yield Creation.count({author:user._id});
    this.body={
        success:true,
        data:publishedList,
        total:total
    }
};