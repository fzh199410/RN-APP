/**
 * Created by fuzhihong on 16/12/7.
 */
import React, {
    StyleSheet,
    Text,
    View,
    AsyncStorage,
    TouchableOpacity,
    Dimensions,
    Image,
    AlertIOS,
    Modal,
    TextInput
} from 'react-native';
var width=Dimensions.get('window').width;     //获取设备的宽高
var height=Dimensions.get('window').height;
var Icon=require('react-native-vector-icons/Ionicons');
var request=require('../common/request');
var config=require('../common/config');
var ImagePicker=require('NativeModules').ImagePickerManager;
var sha1=require('sha1');
var Progress=require('react-native-progress');
import Button from 'react-native-button';

var Published=require('../conditions/published');

var photoOptions = {
    title: '选择头像',
    cancelButtonTitle:'取消',
    takePhotoButtonTitle:'拍照',
    chooseFromLibraryButtonTitle:'相册选取',
    quality:0.75,
    allowsEditing:true,
    noData:false,
    storageOptions: {
        skipBackup: true,
        path: 'images'
    }
};

function avatar(id,type){
    if(id.indexOf('http')>-1){
        return id
    }
    if(id.indexOf('data:image')>-1){
        return id
    }
    if(id.indexOf('avatar/')>-1){
        return config.CLOUDINARY.baseURL+'/'+type+'/upload/'+id
    }
    return 'http://oh3pw68gg.bkt.clouddn.com/'+id

}


var Account=React.createClass(
    {
        getInitialState(){
            var user=this.props.user||{};
            return {
                user:user,
                avatarProgress:0,
                avatarUploading:false,
                modalVisible:false,
                optVisible:false,
                objVisible:false,
                shopVisible:false,
                publishedVisible:false
            }
        },
        getQiniuToken(){
            var signatureURL=config.api.base+config.api.signature;
            var accessToken=this.state.user.accessToken;
            return request.post(signatureURL,{
                accessToken:accessToken,
                type:'avatar',
                cloud:'qiniu'
            }).catch((error) => {
                console.warn(error);
            })
        },
        _pickPhoto(){
            var that=this;

            ImagePicker.showImagePicker(photoOptions, (response) => {
                if (response.didCancel) {
                    return;
                }
                //var avatarData='data:image/jpeg;base64,' + response.data;

                var uri=response.uri;


                that.getQiniuToken()
                    .then((data)=>{
                        if(data&&data.success){
                            var token=data.data.token;
                            var key=data.data.key;
                            var body=new FormData();

                            body.append('token',token);
                            body.append('key',key);
                            body.append('file',{
                                type:'image/jpeg',
                                uri:uri,
                                name:key
                            });
                            that._upload(body)
                        }
                    })
            });
        },
        _upload(body){
            var that=this;
            var xhr=new XMLHttpRequest();
            var url=config.qiniu.upload;
            this.setState({
                avatarUploading:true,
                avatarProgress:0
            });
            xhr.open('POST',url);
            xhr.onload=()=>{
                if(xhr.status!==200){
                    AlertIOS.alert('请求失败200');
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
                if(response){
                    var user=this.state.user;
                    if(response.public_id){
                        user.avatar=response.public_id
                    }
                    if(response.key){
                        user.avatar=response.key
                    }
                    that.setState({
                        avatarUploading:false,
                        avatarProgress:0,
                        user:user
                    });
                    that._asyncUser(true)
                }
            };
            if(xhr.upload){
                xhr.upload.onprogress= (event) => {
                    if(event.lengthComputable){
                        var percent=Number((event.loaded/event.total).toFixed(2));
                        that.setState({
                            avatarProgress:percent
                        })
                    }
                }
            }
            xhr.send(body)
        },
        _asyncUser(isAvatar){
            var user=this.state.user;
            var that=this;
            if(user&&user.accessToken){
                 var url=config.api.base+config.api.update;
                     request.post(url,user)
                        .then((data)=>{
                             if(data&&data.success){
                                 var user=data.data;
                                 if(isAvatar){
                                     AlertIOS.alert('头像更新成功');
                                 }
                                 that.setState({
                                    user:user
                                 },function(){
                                     that._closeEdit()
                                     AsyncStorage.setItem('user',JSON.stringify(user))
                                 })
                             }
                         })
            }
        },
        _edit(state){
            if(state==='modal'){
                this.setState({
                    modalVisible:true
                })
            }else if(state==='published'){
                this.setState({
                    publishedVisible:true
                })
            }else if(state==='obj'){
                this.setState({
                    objVisible:true
                })
            }else if(state==='opt'){
                this.setState({
                    optVisible:true
                })
            }else if(state==='shop'){
                this.setState({
                    shopVisible:true
                })
            }
        },
        _closeEdit(state){
            if(state==='modal'){
                this.setState({
                    modalVisible:false
                })
            }else if(state==='published'){
                this.setState({
                    publishedVisible:false
                })
            }else if(state==='obj'){
                this.setState({
                    objVisible:false
                })
            }else  if(state==='opt'){
                this.setState({
                    optVisible:false
                })
            }else  if(state==='shop'){
                this.setState({
                    shopVisible:false
                })
            }
        },
        _changeUserState(type,value){
            var user=this.state.user;
            user[type]=value;
            this.setState({
                user:user
            })
        },
        _save(){
            this._asyncUser()
        },
        _logout(){
            this.props.logout()
        },
        componentDidMount(){
            var that=this;
            AsyncStorage.getItem('user')
                .then((data)=>{
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
        },
        render(){
            var user=this.state.user;
            return (
                <View  style={styles.container}>
                    <View style={styles.toolbar}>
                        <Text style={styles.toolbarTitle}>我的账户</Text>
                        <Text style={styles.toolbarEdit} onPress={()=>this._edit('modal')}>编辑</Text>
                    </View>
                    {
                        user.avatar
                        ?<TouchableOpacity onPress={this._pickPhoto} style={styles.avatarContainer}>
                            <Image style={styles.avatarContainer} source={{uri:avatar(user.avatar,'image')}} >
                                <View style={styles.avatarBox} >
                                    {
                                        this.state.avatarUploading
                                        ?<Progress.Circle
                                            size={75}
                                            showsText={true}
                                            color={'#ee735c'}
                                            progress={this.state.avatarProgress}
                                            />
                                        :<Image source={{uri:avatar(user.avatar,'image')}} style={styles.avatar}/>
                                    }
                                </View>
                                <Text style={styles.avatarTip}>点击更换头像</Text>
                            </Image>
                        </TouchableOpacity>
                        : <TouchableOpacity onPress={this._pickPhoto} style={styles.avatarContainer}>
                        <Text style={styles.avatarTip}>添加头像</Text>
                        <View style={styles.avatarBox}>
                            {
                                this.state.avatarUploading
                                ?<Progress.Circle
                                    size={75}
                                    showsText={true}
                                    color={'#ee735c'}
                                    progress={this.state.avatarProgress}
                                    />
                                :<Icon name='ios-cloud-upload-outline' style={styles.plusIcon}/>
                            }
                        </View>
                        </TouchableOpacity>
                    }
                    <TouchableOpacity  style={styles.featureBox} onPress={()=>this._edit('published')}>
                        <Icon name='ios-color-wand' style={styles.featureIcon}/>
                        <Text style={styles.featureText}>我的发布</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.featureBox} onPress={()=>this._edit('obj')}>
                            <Icon name='ios-people' style={styles.featureIcon}/>
                            <Text style={styles.featureText}>找找对象</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.featureBox} onPress={()=>this._edit('opt')}>
                            <Icon name='ios-paw' style={styles.featureIcon} />
                            <Text style={styles.featureText}>改下属性</Text>
                    </TouchableOpacity>
                    <TouchableOpacity  style={styles.featureBox} onPress={()=>this._edit('shop')}>
                            <Icon name='ios-cart' style={styles.featureIcon}/>
                            <Text style={styles.featureText}>购购物去</Text>
                    </TouchableOpacity>

                    <Modal
                        animated={true}
                        visible={this.state.modalVisible}
                        >
                        <View style={styles.modalContainer}>
                            <Icon name='ios-close-outline'
                                  style={styles.closeIcon} onPress={()=>this._closeEdit('modal')}/>
                            <View style={styles.fieldItem}>
                                <Text style={styles.label}>昵称</Text>
                                <TextInput
                                    placeholder={'请出入你的昵称'}
                                    style={styles.inputField}
                                    autoCapitalize={'none'}
                                    antoCorrect={false}
                                    defaultValue={user.nickname}
                                    onChangeText={
                                    (text) => {
                                     this._changeUserState('nickname',text)
                                    }}
                                    >
                                </TextInput>
                            </View>
                            <View style={styles.fieldItem}>
                                <Text style={styles.label}>品种</Text>
                                <TextInput
                                    placeholder={'请出入狗狗的品种'}
                                    style={styles.inputField}
                                    autoCapitalize={'none'}
                                    antoCorrect={false}
                                    defaultValue={user.breed}
                                    onChangeText={
                                    (text) => {
                                     this._changeUserState('breed',text)
                                    }}
                                    >
                                </TextInput>
                            </View>
                            <View style={styles.fieldItem}>
                                <Text style={styles.label}>年龄</Text>
                                <TextInput
                                    placeholder={'请出入狗狗的年龄'}
                                    style={styles.inputField}
                                    autoCapitalize={'none'}
                                    antoCorrect={false}
                                    defaultValue={user.age}
                                    onChangeText={
                                    (text) => {
                                     this._changeUserState('age',text)
                                    }}
                                    >
                                </TextInput>
                            </View>
                            <View style={styles.fieldItem}>
                                <Text style={styles.label}>性别</Text>
                                <Icon.Button
                                    onPress={()=>{
                                        this._changeUserState('gender','male')
                                    }}
                                    style={[styles.gender,user.gender==='male'&&styles.genderChecked]}
                                    name='ios-paw-outline'
                                    >男孩子</Icon.Button>
                                <Icon.Button
                                    onPress={()=>{
                                        this._changeUserState('gender','female')
                                    }}
                                    style={[styles.gender,user.gender==='female'&&styles.genderChecked]}
                                    name='ios-paw'
                                    >女孩子</Icon.Button>
                            </View>
                            <Button
                                style={styles.btn}
                                onPress={this._save}
                                >保存</Button>
                        </View>
                    </Modal>
                    <Modal
                        animated={true}
                        visible={this.state.publishedVisible}
                        >
                        <View style={styles.modalContainer}>
                            <Icon name='ios-close-outline'
                                  style={styles.closeIcon}
                                  onPress={()=>this._closeEdit('published')}/>
                            <Published/>
                        </View>
                    </Modal>
                    <Modal
                        animated={true}
                        visible={this.state.objVisible}
                        >
                        <View style={styles.modalContainer}>
                            <Icon name='ios-close-outline'
                                  style={styles.closeIcon}
                                  onPress={()=>this._closeEdit('obj')}/>
                            <Text>this is obj</Text>
                        </View>
                    </Modal>
                    <Modal
                        animated={true}
                        visible={this.state.optVisible}
                        >
                        <View style={styles.modalContainer}>
                            <Icon name='ios-close-outline'
                                  style={styles.closeIcon}
                                  onPress={()=>this._closeEdit('opt')}/>
                            <Text>this is opt</Text>
                        </View>
                    </Modal>
                    <Modal
                        animated={true}
                        visible={this.state.shopVisible}
                        >
                        <View style={styles.modalContainer}>
                            <Icon name='ios-close-outline'
                                  style={styles.closeIcon}
                                  onPress={()=>this._closeEdit('shop')}/>
                            <Text>this is shop</Text>
                        </View>
                    </Modal>
                    <Button
                        style={styles.btn}
                        //onPress={this._logout}
                        >登出</Button>
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
    btn:{
        padding:10,
        marginTop:25,
        marginLeft:10,
        marginRight:10,
        backgroundColor:'transparent',
        borderColor:'#ee735c',
        borderWidth:1,
        borderRadius:4,
        color:'#ee735c'
    },
    avatarContainer:{
        width:width,
        height:140,
        alignItems:'center',
        justifyContent:'center',
        backgroundColor:'#666'
    },
    avatarBox:{
        marginTop:15,
        alignItems:'center',
        justifyContent:'center',
    },
    plusIcon:{
        padding:20,
        paddingLeft:25,
        paddingRight:25,
        color:'#999',
        fontSize:28,
        backgroundColor:'#fff',
        borderRadius:8
    },
    avatarTip:{
        fontSize:14,
        color:'#fff',
        backgroundColor:'transparent'
    },
    avatar:{
        marginBottom:15,
        width:width*0.2,
        height:width*0.2,
        resizeMode:'cover',
        borderRadius:width*0.1,
        borderWidth:2,
        borderColor:'#ee735c'
    },
    modalContainer:{
        flex:1,
        paddingTop:50,
        backgroundColor:'#fff'
    },
    fieldItem:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        height:50,
        paddingLeft:15,
        paddingRight:15,
        borderColor:'#eee',
        borderBottomWidth:1
    },
    label:{
        color:'#ccc',
        marginRight:10,
    },
    closeIcon:{
        position:'absolute',
        width:40,
        height:40,
        fontSize:26,
        right:10,
        top:30,
        color:'#ee735c'
    },
    inputField:{
        height:50,
        flex:1,
        color:'#666',
        fontSize:14
    },
    gender:{
        backgroundColor:'#ccc'
    },
    genderChecked:{
        backgroundColor:'#ee735c'
    },
    featureBox:{
        flexDirection:'row',
        width:width,
        backgroundColor:'#fff',
        paddingTop:15,
        paddingLeft:20,
        paddingRight:20,
        paddingBottom:15,
        marginTop:10,
        marginBottom:10,
        alignItems:'center',
        justifyContent:'flex-start'
    },
    featureIcon:{
        fontSize:24,
        color:'#ee735c',
        marginLeft:30,
    },
    featureText:{
        fontSize:16,
        color:'#ee735c',
        marginLeft:90
    }

});

module.exports=Account;