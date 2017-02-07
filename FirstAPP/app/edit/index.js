/**
 * Created by fuzhihong on 16/12/7.
 */
import React, {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    Dimensions,
    AsyncStorage,
    ProgressViewIOS,
    AlertIOS,
    Modal,
    TextInput
} from 'react-native';
import {AudioRecorder,AudioUtils} from 'react-native-audio';
var lodash=require('lodash');
var config=require('../common/config');
var request=require('../common/request');
var width=Dimensions.get('window').width;
var height=Dimensions.get('window').height;
var Video = require('react-native-video').default;
var Icon=require('react-native-vector-icons/Ionicons');
var ImagePicker = require('NativeModules').ImagePickerManager;
var CountDownText=require('react-native-sk-countdown').CountDownText;
var Progress=require('react-native-progress');
import Button from 'react-native-button';
var videoOptions = {
    title: '选择视频',
    cancelButtonTitle: '取消',
    takePhotoButtonTitle: '录制 10 秒视频',
    chooseFromLibraryButtonTitle: '选择已有视频',
    videoQuality: 'high',
    mediaType: 'video',
    durationLimit: 10,
    noData: false,
    storageOptions: {
        skipBackup: true,
        path: 'images'
    }
};

var defaultState={
    previewVideo:null,

    videoUploaded:false,
    videoUploading:false,
    videoUploadedProgress:0,
    video:null,
    videoId:null,
    audioId:null,

    videoReady:false,
    videoProgress:0.01,
    videoTotal:0,
    currentTime:0,
    playing:false,
    paused:false,
    videoOK:true,
    //video states

    rate:1,
    muted:true,
    resizeMode:'contain',
    repeat:false,

    //count down
    counting:false,
    recording:false,
    //audio
    audio:null,
    audioPath:AudioUtils.DocumentDirectoryPath+'/gougou.aac',
    recordDone:false,
    audioPlaying:false,

    audioUploaded:false,
    audioUploading:false,
    audioUploadedProgress:0.14,

    //modal
    modalVisible:false,
    title:null,
    publishProgress:0,
    publishing:false,
    willPublish:false
}

var Edit=React.createClass(
    {
        getInitialState(){
            var user=this.props.user||{};
            var state=lodash.clone(defaultState);
            state.user=user;
            return state
        },
        _onLoadStart(){
            console.log(this.props.row)
            console.log('start')
        },
        _onLoad(){
            console.log('load')
        },
        _onProgress(data){
            if(!this.state.videoReady){
                this.setState({
                    videoReady:true
                })
            }
            if(!this.state.playing){
                this.setState({
                    playing:true
                })
            }
            var duration=data.playableDuration;
            var currentTime=data.currentTime;
            var percent=Number((currentTime/duration).toFixed(2));
            this.setState({
                videoTotal:duration,
                currentTime:Number(currentTime.toFixed(2)),
                videoProgress:percent
            })
        },
        _onEnd(){
            if (this.state.recording) {
                AudioRecorder.stopRecording()

                this.setState({
                    videoProgress: 1,
                    recordDone: true,
                    recording: false,
                    audioPlaying:false
                })
            }
        },
        _onError(){
            this.setState({
                videoOk: false
            })
        },
        _replay(){
            this.refs.videoPlayer.seek(0)
        },
        _pause(){
            if(!this.state.paused){
                this.setState({
                    paused:true
                })
            }
        },
        _resume(){
            if(this.state.paused){
                this.setState({
                    paused:false
                })
            }
        },
        getToken(body){
            //accessToken:accessToken,
            //    cloud:'qiniu',
            //    type:'video'
            var signatureURL=config.api.base+config.api.signature;
            body.accessToken=this.state.user.accessToken;
            return request.post(signatureURL,body).catch((error) => {
                console.warn(error);
            })
        },
        _pickVideo(){
            var that=this;

            ImagePicker.showImagePicker(videoOptions, (response) => {
                if (response.didCancel) {
                    return;
                }
                var uri=response.uri;
                var state=lodash.clone(defaultState);
                state.previewVideo=uri;
                that.setState(state);
                that.getToken({
                        cloud:'qiniu',
                        type:'video'
                }).then((data)=>{
                        if(data&&data.success){
                            console.log(response.uri);
                            var token=data.data.token;
                            var key=data.data.key;
                            var body=new FormData();

                            body.append('token',token);
                            body.append('key',key);
                            body.append('file',{
                                type:'video/mp4',
                                uri:uri,
                                name:key
                            });
                            that._upload(body,'video')
                        }
                    })
            });
        },
        _upload(body,type){
            var that=this;
            var xhr=new XMLHttpRequest();
            var url=config.qiniu.upload;

            if(type==='audio'){
                url=config.CLOUDINARY.video
            }
            var state={};
            state[type+'UploadedProgress']=0;
            state[type+'Uploading']=true;
            state[type+'Uploaded']=false;

            this.setState(state);
            xhr.open('POST',url);
            xhr.onload=()=>{
                if(xhr.status!==200){
                    AlertIOS.alert('请求失败200');
                    console.log(xhr.responseText);
                    return
                }
                if(!xhr.responseText){
                    AlertIOS.alert('请求失败,无文本');
                    return
                }
                var response;
                try{
                    response=JSON.parse(xhr.response)
                }catch(err){
                    console.log(err)
                }
                console.log(response);
                if(response){
                    var user=this.state.user;
                    var newSate={}
                    newSate[type]=response;
                    newSate[type+'Uploading']=false;
                    newSate[type+'Uploaded']=true;
                    newSate[user]=user;
                    that.setState(newSate);
                    var updateURL=config.api.base+config.api[type];
                    var updateBody={
                        accessToken:user.accessToken
                    };
                    updateBody[type]=response;
                    if(type==='audio'){
                        updateBody.videoId=that.state.videoId
                    }
                    request.post(updateURL,updateBody).then((data)=>{
                            if(data&&data.success){
                                var mediaState={};
                                mediaState[type+'Id']=data.data;
                                if(type==='audio'){
                                    that._showModal();
                                    mediaState.willPublish=true
                                }
                                that.setState(mediaState)

                            }else{
                                if(type==='video'){
                                    AlertIOS.alert('视频同步出错')
                                }else if(type==='audio'){
                                    AlertIOS.alert('音频同步出错')
                                }
                            }
                        }
                    ).catch((err)=>{
                            console.log(err);
                            if(type==='video'){
                                AlertIOS.alert('视频同步出错')
                            }else if(type==='audio'){
                                AlertIOS.alert('音频同步出错')
                            }
                        })
                }
            };
            if(xhr.upload){
                xhr.upload.onprogress= (event) => {
                    if(event.lengthComputable){
                        var percent=Number((event.loaded/event.total).toFixed(2));
                        var progressState={};
                        progressState[type+'UploadedProgress']=percent;
                        that.setState(progressState)
                    }
                }
            }
            xhr.send(body)
        },
            _initAudio() {
                var audioPath=this.state.audioPath;


                console.log(audioPath)

                AudioRecorder.prepareRecordingAtPath(audioPath, {
                    SampleRate: 22050,
                    Channels: 1,
                    AudioQuality: 'High',
                    AudioEncoding: 'aac'
                })

                AudioRecorder.onProgress = (data) => {
                    this.setState({
                        currentTime: Math.floor(data.currentTime)
                    })
                }
                AudioRecorder.onFinished = (data) => {
                    this.setState({
                        finished: data.finished
                    })
                    console.log(`Finished recording: ${data.finished}`)
                }
            },
        componentDidMount(){
            var that=this;
            AsyncStorage.getItem('user')
                .then((data)=>{
                    console.log(data)
                    var user;
                    if(data){
                        user=JSON.parse(data)
                    }
                    if(user&&user.accessToken){
                        that.setState({
                            user:user
                        })
                    }
                })
            this._initAudio()
        },
        _record(){
            this.setState({
                videoProgress:0,
                counting:false,
                recording:true,
                recordDone:false
            });
            AudioRecorder.startRecording();
            this.refs.videoPlayer.seek(0)
        },
        _counting(){
            if(!this.state.counting&&!this.state.recording&&!this.state.audioPlaying){
                this.setState({
                    counting:true
                })
                this.refs.videoPlayer.seek(this.state.videoTotal)
            }
        },
        _preview(){
          if(this.state.audioPlaying){
              AudioRecorder.stopPlaying()
          }
          this.setState({
              videoProgress:0,
              audioPlaying:true
          });
            AudioRecorder.playRecording();
            this.refs.videoPlayer.seek(0);
        },
        _uploadAudio(){
            var that=this;
            var tags='app,audio';
            var folder='audio';
            var timestamp=Date.now();
            this.getToken({
                type:'audio',
                timestamp:timestamp,
                cloud:'cloudinary'
            }).catch((err)=>{console.log(err)})
                .then((data)=>{
                    if(data&&data.success){
                        var signature=data.data.token;
                        var key=data.data.key;
                        var body=new FormData();
                        body.append('folder',folder);
                        body.append('signature',signature);
                        body.append('tags',tags);
                        body.append('timestamp',timestamp);
                        body.append('api_key',config.CLOUDINARY.api_key);
                        body.append('resource_type','video');
                        body.append('file',{
                            type:'video/mp4',
                            uri:this.state.audioPath,
                            name:key
                        })
                        that._upload(body,'audio')
                    }
                })
        },
        _closeModal(){
            this.setState({
                modalVisible:false
            })
        },
        _showModal(){
            this.setState({
                modalVisible:true
            })
        },
        _publish(){
            var that=this;
            var body={
                title:this.state.title,
                videoId:this.state.videoId,
                audioId:this.state.audioId
            }
            var creationURL=config.api.base+config.api.creations;
            var user=this.state.user;
            if(user&&user.accessToken){
                body.accessToken=user.accessToken;
                this.setState({
                    publishing:true
                })
                request.post(creationURL,body)
                    .catch((err)=>{
                    console.log(err);
                    AlertIOS.alert('视频发布失败');
                }).then((data)=>{
                        if(data&&data.success){
                            console.log(data)
                            that._closeModal();
                            AlertIOS.alert('视频发布成功');
                            var state=lodash.clone(defaultState);
                            that.setState(state)
                        }else{
                            that.setState({
                                publishing:false
                            })
                            AlertIOS.alert('视频发布失败');
                        }
                    })
            }
        },
        render(){
            return (
                <View  style={styles.container}>
                    <View style={styles.toolbar}>
                        <Text style={styles.toolbarTitle}>
                            {
                                this.state.previewVideo?
                                    '点击按钮配音'
                                    :'理解狗狗 从配音开始'
                            }
                        </Text>
                        {
                            this.state.previewVideo&&this.state.videoUploaded
                            ?<Text style={styles.toolbarEdit} onPress={this._pickVideo}>更换视频</Text>
                            :null
                        }
                    </View>
                    <View style={styles.page}>
                        {
                            this.state.previewVideo
                            ?<View style={styles.videoContainer}>
                                <View style={styles.videoBox}>
                                    <Video  ref='videoPlayer'
                                            source={{uri:this.state.previewVideo}}
                                            style={styles.video}
                                            volume={4}
                                            paused={this.state.paused}
                                            rate={this.state.rate}
                                            muted={this.state.muted}
                                            resizeMode={this.state.resizeMode}
                                            repeat={this.state.repeat}
                                            onLoadStart={this._onLoadStart}
                                            onLoad={this._onLoad}
                                            onProgress={this._onProgress}
                                            onEnd={this._onEnd}
                                            onError={this._onError}
                                        />
                                    {
                                        !this.state.videoUploaded&&this.state.videoUploading
                                            ? <View style={styles.progressTipBox}>
                                            <ProgressViewIOS style={styles.progressBar}
                                                             progressTintColor='#ee735c'
                                                             progress={this.state.videoUploadedProgress}
                                                />
                                            <Text style={styles.progressTip}>
                                                正在生成静音视频,已完成{(this.state.videoUploadedProgress*100).toFixed(2)}%
                                            </Text>
                                        </View>
                                            :null
                                    }
                                    {
                                        this.state.recording||this.state.audioPlaying
                                            ?<View style={styles.progressTipBox}>
                                            <ProgressViewIOS style={styles.progressBar}
                                                             progressTintColor='#ee735c'
                                                             progress={this.state.videoProgress}
                                                />
                                            {
                                                this.state.recording
                                                ?<Text style={styles.progressTip}>
                                                    正在录制ing
                                                </Text>
                                                :null
                                            }
                                        </View>
                                            :null
                                    }
                                    {
                                        this.state.recordDone
                                        ? <View style={styles.previewBox}>
                                            <Icon name='ios-play' style={styles.previewIcon} />
                                            <Text style={styles.previewText} onPress={this._preview}>预览</Text>
                                        </View>
                                        :null
                                    }
                                </View>
                             </View>
                            :<TouchableOpacity style={styles.uploadContainer} onPress={this._pickVideo}>
                                <View style={styles.uploadBox}>
                                    <Image style={styles.uploadIcon} source={require('../assets/images/record.png')} />
                                    <Text style={styles.uploadTitle}>点我上传视频</Text>
                                    <Text style={styles.uploadDesc}>建议时长不超过10秒</Text>
                                </View>
                            </TouchableOpacity>
                        }
                        {
                            this.state.videoUploaded
                            ?<View style={styles.recordBox}>
                                <View style={[styles.recordIconBox,(this.state.recording||this.state.audioPlaying)&&styles.recordOn]}>
                                    {
                                        this.state.counting&&!this.state.recording
                                        ?<CountDownText
                                            style={styles.countBtn}
                                            countType='seconds' // 计时类型：seconds / date
                                            auto={true} // 自动开始
                                            afterEnd={this._record} // 结束回调
                                            timeLeft={4} // 正向计时 时间起点为0秒
                                            step={-1} // 计时步长，以秒为单位，正数则为正计时，负数为倒计时
                                            startText='准备录制' // 开始的文本
                                            endText='Go!' // 结束的文本
                                            intervalText={(sec) => {
                                        return sec===0?'Go':sec
                                    }} // 定时的文本回调
                                            />
                                        :<TouchableOpacity onPress={this._counting}>
                                            <Icon name='ios-mic' style={styles.recordIcon} />
                                        </TouchableOpacity>
                                    }
                                </View>
                            </View>
                            :null
                        }
                        {
                            this.state.videoUploaded&&this.state.recordDone
                            ?  <View style={styles.uploadAudioBox}>
                                {
                                    !this.state.audioUploaded&&!this.state.audioUploading
                                    ?<Text style={styles.uploadAudioText} onPress={this._uploadAudio}>下一步</Text>
                                    :null
                                }
                                {
                                    this.state.audioUploading
                                    ?      <Progress.Circle
                                        size={60}
                                        showsText={true}
                                        color={'#ee735c'}
                                        progress={this.state.audioUploadedProgress}
                                        />
                                    :null
                                }
                            </View>
                            :null
                        }
                    </View>
                    <Modal
                        animated={true}
                        visible={this.state.modalVisible}
                        >
                        <View style={styles.modalContainer}>
                            <Icon name='ios-close-outline'
                                  style={styles.closeIcon} onPress={this._closeModal}/>
                            {
                                this.state.audioUploaded&&!this.state.publishing
                                ? <View style={styles.fieldBox}>
                                    <TextInput
                                        placeholder={'给狗狗一句宣言吧'}
                                        style={styles.inputField}
                                        autoCapitalize={'none'}
                                        antoCorrect={false}
                                        defaultValue={this.state.title}
                                        onChangeText={
                                    (text) => {
                                     this.setState({
                                        title:text
                                     })
                                    }}>
                                    </TextInput>
                                </View>
                                :null
                            }
                            {
                                this.state.publishing
                                ?     <View style={styles.loadingBox}>
                                    <Text style={styles.loadingText}>耐心等一下,拼命为您生成视频...</Text>
                                    {
                                        this.state.willPublish
                                        ?<Text style={styles.loadingText}>正在合并视频音频...</Text>
                                        :null
                                    }
                                    {
                                        this.state.publishProgress>0.3
                                        ?<Text style={styles.loadingText}>开始上传!...</Text>
                                        :null
                                    }
                                    <Progress.Circle
                                        size={48}
                                        showsText={true}
                                        color={'#ee735c'}
                                        progress={this.state.publishProgress}
                                        />
                                </View>
                                :null
                            }
                            {
                                this.state.audioUploaded&&!this.state.publishing
                                ?  <View>
                                    <Button
                                        style={styles.btn}
                                        onPress={this._publish}
                                        >发布视频</Button>
                                </View>
                                :null
                            }
                        </View>
                    </Modal>
                </View>
            )
        }
    }
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FCFF'
    },
    toolbar:{
        flexDirection:'row',
        paddingTop:25,
        paddingBottom:12,
        backgroundColor:'#ee735c'
    },
    toolbarTitle:{
        flex:1,
        fontSize:16,
        color:'#fff',
        textAlign:'center',
        fontWeight:'600'
    },
    toolbarEdit:{
        position:'absolute',
        right:10,
        top:26,
        color:'#fff',
        textAlign:'right',
        fontWeight:'600',
        fontSize:14
    },
    page:{
        flex:1,
        alignItems:'center'
    },
    uploadContainer:{
        marginTop:90,
        width:width-40,
        paddingBottom:10,
        borderWidth:1,
        borderColor:'#ee735c',
        justifyContent:'center',
        borderRadius:6
    },
    uploadTitle:{
        textAlign:'center',
        marginBottom:10,
        fontSize:16,
        color:'#000'
    },
    uploadDesc:{
        color:'#999',
        textAlign:'center',
        fontSize:12
    },
    uploadIcon:{
        width:110,
        resizeMode:'contain'
    },
    uploadBox:{
        flex:1,
        flexDirection:'column',
        justifyContent:'center',
        alignItems:'center'
    },
    videoContainer:{
        width:width,
        justifyContent:'center',
        alignItems:'flex-start'
    },
    videoBox:{
        width:width,
        height:height*0.6
    },
    video:{
        width:width,
        height:height*0.6,
        backgroundColor:'#333'
    },
    progressTipBox:{
        position:'absolute',
        left:0,
        bottom:0,
        width:width,
        height:30,
        backgroundColor:'rgba(244,244,244,0.65)'
    },
    progressTip:{
        color:'#333',
        width:width-10,
        padding:5,
        textAlign:'left'
    },
    proressBar:{
        width:width
    },
    recordBox:{
        width:width,
        height:60,
        alignItems:'center'
    },
    recordIconBox:{
        width:68,
        height:68,
        borderRadius:34,
        backgroundColor:'#ee735c',
        borderWidth:1,
        borderColor:'#fff',
        alignItems:'center',
        justifyContent:'center',
        marginTop:-30
    },
    recordIcon:{
        fontSize:58,
        backgroundColor:'transparent',
        color:'#fff'
    },
    countBtn:{
        fontSize:32,
        fontWeight:'600',
        color:'#fff'
    },
    recordOn:{
        backgroundColor:'#ccc'
    },
    previewBox:{
        width:80,
        height:30,
        position:'absolute',
        right:5,
        bottom:30,
        borderColor:'#ee735c',
        borderWidth:1,
        borderRadius:3,
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'center',
        backgroundColor:'transparent'
    },
    previewIcon:{
        marginRight:5,
        fontSize:20,
        color:'#ee735c'
    },
    previewText:{
        fontSize:20,
        color:'#ee735c'
    },
    uploadAudioBox:{
        width:width,
        height:60,
        padding:5,
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'center'
    },
    uploadAudioText:{
        width:width-20,
        padding:5,
        borderRadius:5,
        borderColor:'#ee735c',
        textAlign:'center',
        fontSize:30,
        color:'#ee735c',
        borderWidth:1
    },
    modalContainer:{
        width:width,
        height:height,
        paddingTop:50,
        backgroundColor:'#fff'
    },
    btn:{
        width:width-40,
        padding:10,
        marginTop:20,
        marginLeft:10,
        marginRight:10,
        backgroundColor:'transparent',
        borderColor:'#ee735c',
        borderWidth:1,
        borderRadius:4,
        color:'#ee735c'
    },
    inputField:{
        height:40,
        textAlign: 'center',
        color:'#666',
        fontSize:14
    },
    closeIcon:{
        position:'absolute',
        fontSize:32,
        right:10,
        top:30,
        color:'#ee735c'
    },
    loadingBox:{
        width:width,
        height:height,
        marginTop:15,
        alignItems:'center'
    },
    fieldBox:{
        width:width-40,
        height:36,
        marginTop:36,
        marginLeft:20,
        marginRight:20,
        borderBottomWidth:1,
        borderBottomColor:'#eaeaea'
    },
    loadingText:{
        color:'#333',
        fontSize:16,
        marginTop:10
    }
});

module.exports=Edit;