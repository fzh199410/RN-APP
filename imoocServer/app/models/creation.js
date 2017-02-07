/**
 * Created by fuzhihong on 16/12/16.
 */
var mongoose=require('mongoose');
var ObjectId=mongoose.Schema.Types.ObjectId;
var Mixed=mongoose.Schema.Types.Mixed;
var CreationSchema=new mongoose.Schema({
    author:{
        type:ObjectId,
        ref:'User'
    },
    video:{
        type:ObjectId,
        ref:'Video'
    },
    audio:{
        type:ObjectId,
        ref:'Audio'
    },
    votes:[String],
    up:{
        type:Number,
        default:0
    },
    title:String,
    qiniu_thumb:String,
    qiniu_video:String,
    cloudinary_thumb:String,
    cloudinary_video:String,
    finish:{
        type:Number,
        default:0
    },
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

CreationSchema.pre('save',function(next){
    if(!this.isNew){
        this.meta.updateAt=Date.now()
    }
    next()
});


module.exports=mongoose.model('Creation',CreationSchema);