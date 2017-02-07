/**
 * Created by fuzhihong on 16/12/7.
 */
module.exports={
    header: {
        'method': 'POST',
        'headers':{
            'Accept': 'application/json',
            'Content-Type': 'application/json; charset=utf-8'
        }
    },
    backup:{
        avatar:'http://res.cloudinary.com/gougou/image/upload/gougou.png'
    },
    qiniu:{
        upload:'http://up-z2.qiniu.com',
        avatar:'http://oh3pw68gg.bkt.clouddn.com/',
        video:'http://oi9rt8kp1.bkt.clouddn.com/'
    },
    CLOUDINARY:{
        cloud_name: 'tencent',
        api_key: '384111758127354',
        api_secret: 'R0IfloCM_o6f_bULJEjwSOspvhI',
        baseURL:'https://res.cloudinary.com/tencent',
        image:'https://api.cloudinary.com/v1_1/tencent/image/upload',
        video:'https://api.cloudinary.com/v1_1/tencent/video/upload',
        audio:'https://api.cloudinary.com/v1_1/tencent/raw/upload'
    },
    api:{
        base:'http://127.0.0.1:1234/',
        //base:'http://rap.taobao.org/mockjs/11176/',
        find:'api/find',
        creations:'api/creations',
        up:'api/up',
        comment:'api/comments',
        verify:'api/user/verify',
        signup:'api/user/signup',
        signature:'api/signature',
        update:'api/user/update',
        video:'api/creations/video',
        audio: 'api/creations/audio',
        published:'api/user/published'
    }
};