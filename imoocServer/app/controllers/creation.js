/**
 * Created by fuzhihong on 16/12/16.
 */
/**
 * Created by fuzhihong on 16/12/14.
 */
var mongoose=require('mongoose');
var User=mongoose.model('User');
var Video=mongoose.model('Video');
var Audio=mongoose.model('Audio');
var Creation=mongoose.model('Creation');
var robot=require('../service/robot');
var config=require('../../config/config');
var Promise=require('bluebird');
var xss=require('xss');
var lodash=require('lodash');

var userFields=[
    'avatar',
    'nickname',
    'gender',
    'age',
    'breed'
]

exports.find=function *(next){
    var page=parseInt(this.query.page,10)||1;
    var count=2;
    var offset=(page-1)*count

    var queryArray=[
        yield Creation.find({
            finish:100
        }).sort({'meta.createAt':-1})
            .skip(offset)
            .populate('author',userFields.join(' '))
            .exec(),
        yield Creation.count({finish:100}).exec()
    ]

    var data= queryArray
    this.body={
        success:true,
        data:data[0],
        total:data[1]
    }
}

function AsyncMedia(videoId,audioId){
    if(!videoId){return}
    console.log('AsyncMedia'+videoId);
    console.log(audioId);
    var query={
        _id:audioId
    };
    if(!audioId){
        query={
            video:videoId
        }
    }
    Promise.all([
        Video.findOne({_id:videoId}).exec(),
        Audio.findOne(query).exec()
    ]).then(function(data){
        var video=data[0];
        var audio=data[1];
        if(!video||!video.public_id||!audio||!audio.public_id){
            console.log('检查数据有效性!');
            return
        }
        console.log('开始同步音频视频');
        var video_public_id = video.public_id
        var audio_public_id = audio.public_id.replace(/\//g, ':')
        var videoName = video_public_id.replace(/\//g, '_') + '.mp4'
        var videoURL = 'http://res.cloudinary.com/tencent/video/upload/e_volume:-100/e_volume:400,l_video:' + audio_public_id + '/' + video_public_id + '.mp4'
        var thumbName = video_public_id.replace(/\//g, '_') + '.jpg'
        var thumbURL = 'http://res.cloudinary.com/tencent/video/upload/' + video_public_id + '.jpg'
        audio.qiniu_video=videoURL;
        audio.qiniu_thumb=thumbURL;
        audio.save().then(function(_audio){
                        Creation.findOne({
                            video:video._id,
                            audio:audio._id
                        }).exec()
                        .then(function(_creation){
                                if(_creation){
                                    if(!_creation.qiniu_video){
                                        _creation.qiniu_thumb=_audio.qiniu_thumb;
                                        _creation.qiniu_video=_audio.qiniu_video;
                                        _creation.save()
                                    }
                                }
                            });
                        console.log(_audio);
                        console.log('同步成功')
                    });
        //robot
        //    .saveToQiniu(videoURL,videoName)
        //    .catch(function(err) {
        //        console.log(err)
        //    })
        //    .then(function(res){
        //        if(res&&res.key){
        //            console.log(res.key)
        //            audio.qiniu_video=res.key;
        //            audio.save().then(function(_audio){
        //                console.log(_audio);
        //                console.log('同步视频成功')
        //            });
        //        }else{
        //            console.log('同步视频失败')
        //        }
        //    });
        //robot
        //    .saveToQiniu(thumbURL,thumbName)
        //    .catch(function(err) {
        //        console.log(err)
        //    })
        //    .then(function(res){
        //        if(res&&res.key){
        //            console.log(res.key)
        //            audio.qiniu_thumb=res.key;
        //            audio.save().then(function(_audio){
        //                console.log(_audio);
        //                console.log('同步封面成功')
        //            });
        //        }else{
        //            console.log('同步封面失败')
        //        }
        //    })
    })

}

exports.video=function *(next){
    var body=this.request.body;
    var videoData=body.video;
    var user=this.session.user;

    if(!videoData||!videoData.key){
        this.body={
            success:false,
            err:'视频没有上传成功!'
        };
        return next
    }
    var video=yield Video.findOne({
        qiniu_key:videoData.key
    }).exec()

    if(!video){
        video=new Video({
            author:user.id,
            qiniu_key:videoData.key,
            persistentId:videoData.persistentId
        })
        video=yield video.save()
    };
    console.log('开始上传视频到cloud!')
    var url=config.qiniu.video+video.qiniu_key
    robot.uploadToCloudinary(url)
         .catch((err)=>{
        console.log(err)
            }).then(function(data){
                if(data&&data.public_id){
                    video.public_id=data.public_id;
                    video.detail=data;
                    video.save().then(function(_video){
                        console.log('视频上传到cloud成功!');
                        AsyncMedia(_video._id)
                    })
                }
        });
    this.body={
        success:true,
        data:video._id
    }
};

exports.audio=function *(next){
    var body=this.request.body;
    var audioData=body.audio;
    var videoId=body.videoId;
    var user=this.session.user;
    if(!audioData||!audioData.public_id){
        this.body={
            success:false,
            err:'音频上传失败!'
        }
    }
    var audio=yield Audio.findOne({
        public_id:audioData.public_id
    }).exec()
    var video=yield Video.findOne({
        _id:videoId
    }).exec()
    if(!audio){
        var _audio={
            author:user._id,
            public_id:audioData.public_id,
            detail:audioData
        }
        if(video){
            _audio.video=video._id
        }
        audio=new Audio(_audio);
        audio=yield audio.save()
    }
    //异步操作
    AsyncMedia(video._id,audio._id);
    this.body={
        success:true,
        data:audio._id
    }
};

exports.save=function *(next){
    var body=this.request.body;
    var videoId=body.videoId;
    var audioId=body.audioId;
    var title=body.title;
    var user=this.session.user;
    console.log(videoId,audioId,title);
    var video=yield Video.findOne({
        _id:videoId
    }).exec();
    var audio=yield Audio.findOne({
        _id:audioId
    }).exec();
    if(!video||!audio){
        this.body={
            success:'false',
            err:'音频或者视频素材为空'
        }
        return next
    }
    var creation=yield Creation.findOne({
        audio:audioId,
        video:videoId
    }).exec();
    if(!creation){
        var creationData={
            author:user._id,
            title:xss(title),
            video:videoId,
            audio:audioId,
            finish:20
        }
        var video_public_id=video.public_id;
        var audio_public_id=audio.public_id;
        if(video_public_id&&audio_public_id){
            creationData.cloudinary_thumb='http://res.cloudinary.com/tencent/video/upload/' + video_public_id + '.jpg';
            creationData.cloudinary_video=creationData.qiniu_video='http://res.cloudinary.com/tencent/video/upload/e_volume:-100/e_volume:400,l_video:' + audio_public_id.replace(/\//g,':') + '/' + video_public_id + '.mp4';
            creationData.finish+=20
        }
        if(audio.qiniu_thumb){
            creationData.qiniu_thumb=audio.qiniu_thumb;
            creationData.finish+=30
        }
        if(audio.qiniu_video){
            creationData.qiniu_video=audio.qiniu_video;
            creationData.finish+=30
        }
        creation=new Creation(creationData)
    }
    creation=yield creation.save();
    console.log(creation);
    this.body={
        success:true,
        data:{
            _id:creation._id,
            finish:creation.finish,
            title:creation.title,
            qiniu_thumb:creation.qiniu_thumb,
            qiniu_video:creation.qiniu_video,
            author:{
                avatar:user.avatar,
                nickname:user.nickname,
                gender:user.gender,
                breed:user.breed,
                _id:user._id
            }
        }
    }
}


exports.up=function *(next){

    var body=this.request.body;
    var user=this.session.user;
    var creation=yield Creation.findOne({
        _id:body._id
    }).exec()

    if(!creation){
        this.body={
            success:false,
            err:'找不到视频'
        };
        return next
    }
    if(body.up==='yes'){
        creation.votes.push(String(user._id))
    }else{
        creation.votes=lodash.without(creation.votes,String(user._id))
    }
    creation.up=creation.votes.length;
    yield creation.save();

    this.body={
        success:true
    }
}