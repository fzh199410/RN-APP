/**
 * Created by fuzhihong on 16/12/14.
 */
var mongoose=require('mongoose');
var ObjectId=mongoose.Schema.Types.ObjectId;
var Mixed=mongoose.Schema.Types.Mixed;
var AudioSchema=new mongoose.Schema({
    author:{
        type:ObjectId,
        ref:'User'
    },
    video:{
        type:ObjectId,
        ref:'Video'
    },
    qiniu_key:String,
    persistentId:String,
    qiniu_final_key:String,
    qiniu_detail:Mixed,
    qiniu_video:String,
    qiniu_thumb:String,
    //cloudinary
    public_id:String,
    detail:Mixed,

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

AudioSchema.pre('save',function(next){
    if(!this.isNew){
        this.meta.updateAt=Date.now()
    }
    next()
});


module.exports=mongoose.model('Audio',AudioSchema);