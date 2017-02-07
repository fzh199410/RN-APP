/**
 * Created by fuzhihong on 16/12/22.
 */

var mongoose=require('mongoose');
var Comment=mongoose.model('Comment');
var Creation=mongoose.model('Creation');
var xss=require('xss');

var userFields=[
    'avatar',
    'nickname',
    'gender',
    'age',
    'breed'
]
exports.findComment=function *(next){
    var id=this.query.creation;
    var page=parseInt(this.query.page,10)||1;
    var count=5;
    var offset=(page-1)*count
    if(!id){
        this.body={
            success:false,
            err:'id不能为空'
        }
        return next
    }
    var queryArray=[
        yield Comment.find({
            creation:id
        }).skip(offset)
            .populate('replyBy',userFields.join(' '))
            .sort({'meta.createAt':-1})
            .exec(),
        Comment.count({creation:id}).exec()
    ]
    var data=yield queryArray

    this.body={
        success:true,
        data:data[0],
        total:data[1]
    }
};

exports.saveComment=function *(next){
    var commentData=this.request.body.comment;
    var user=this.session.user;
    var creation=yield Creation.findOne({
        _id:commentData.creation
    }).exec()
    if(!creation){
        this.body={
            success:false,
            err:'视频不见了'
        }
        return next
    }
    var comment
    if(commentData.cid){  //非第一次评论
        comment=yield Comment.findOne({
            _id:commentData.cid
        }).exec()
        var reply={
            from:commentData.from,
            to:commentData.to,
            content:commentData.content
        }
        comment.reply.push(reply)
        comment=yield comment.save()

        this.body={
            success:true
        }
    }else{
        comment={
            creation:creation._id,
            replyBy:user._id,
            replyTo:creation.author,
            content:commentData.content
        };
        comment=new Comment(comment);
        comment=yield comment.save();


        this.body={
            success:true,
            data:[comment]
        }
    }
}

