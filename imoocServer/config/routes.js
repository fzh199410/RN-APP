/**
 * Created by fuzhihong on 16/12/14.
 */
'use strict';

var Router=require('koa-router');
var User=require('../app/controllers/user');
var App=require('../app/controllers/app');
var Creation=require('../app/controllers/creation');
var Comment=require('../app/controllers/comment');
module.exports=function(){
  var router=new Router({
      prefix:'/api'
  })
  //用户管理
    router.post('/user/signup',App.hasBody,User.signup);
    router.post('/user/verify',App.hasBody,User.verify);
    router.post('/user/update',App.hasBody,App.hasToken,User.update);
    router.get('/user/published',App.hasToken,User.publishedList);
  //用户发布列表

  //视频制作
    router.post('/creations',App.hasBody,App.hasToken,Creation.save);
    router.post('/creations/video',App.hasBody,App.hasToken,Creation.video);
    router.post('/creations/audio', App.hasBody, App.hasToken, Creation.audio);
    router.get('/find',App.hasToken,Creation.find);
   //获取签名
    router.post('/signature',App.hasBody,App.hasToken,App.signature);
   //评论
    router.get('/comments',App.hasToken,Comment.findComment);
    router.post('/comments',App.hasBody,App.hasToken,Comment.saveComment);
   //点赞
    router.post('/up',App.hasBody,App.hasToken,Creation.up);
  return router
};