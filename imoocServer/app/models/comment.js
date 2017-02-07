/**
 * Created by fuzhihong on 16/12/22.
 */
/**
 * Created by fuzhihong on 16/12/16.
 */

var mongoose=require('mongoose');
var ObjectId=mongoose.Schema.Types.ObjectId;
var Mixed=mongoose.Schema.Types.Mixed;
var CommentSchema=new mongoose.Schema({
    creation:{
        type:ObjectId,
        ref:'Creation'
    },
    content:String,
    replyBy:{
        type:ObjectId,
        ref:'User'
    },
    replyTo:{
        type:ObjectId,
        ref:'User'
    },
    reply:[
        {
            from:{
                type:ObjectId,
                ref:'User'
            },
            to:{
                type:ObjectId,
                ref:'User'
            },
            content:String
        }
    ],

    meta:{
        createAt:{
            type:Date,
            default:Date.now()
        },
        updateAt:{
            type:Date,
            default:Date.now()
        }
    }
});

CommentSchema.pre('save',function(next){
    if(!this.isNew){
        this.meta.updateAt=Date.now()
    }
    next()
});


module.exports=mongoose.model('Comment',CommentSchema);