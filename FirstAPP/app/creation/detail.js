/**
 * Created by fuzhihong on 16/12/7.
 */

var Video=require('react-native-video').default;
import Icon from 'react-native-vector-icons/Ionicons';
import Button from 'react-native-button';
var request=require('../common/request');
var config=require('../common/config');
var utils=require('../common/utils');

import React, {
    StyleSheet,
    Text,
    View,
    Dimensions,
    ActivityIndicatorIOS,
    TouchableOpacity,
    ScrollView,
    Image,
    ListView,
    TextInput,
    Modal,
    AlertIOS,
    AsyncStorage
} from 'react-native';

var cachedResults={
    nextPage:1,
    items:[],
    total:0
}

var width=Dimensions.get('window').width ;    //获取设备的宽高

var Detail=React.createClass(
    {
        getInitialState(){
            var data=this.props.row;
            var ds=new ListView.DataSource({rowHasChanged:(r1,r2)=>r1!==r2});
            return {
                data:data,
                dataSource:ds.cloneWithRows([]),
                rate:1,
                muted:false,
                resizeMode:'contain',
                repeat:false,
                videoReady:false,
                videoProgress:0.01,
                videoTotal:0,
                currentTime:0,
                playing:false,
                paused:false,
                videoOK:true,
                isLoadingTail:false,
                user:null,

                modalVisible:false,
                animated:true,
                content:'',
                isSending:false,
                transparent:true
            }
        },

        _backToList(){
            this.props.navigator.pop()
        },
        _onLoadStart(){
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
            this.setState({
                videoProgress:1,
                playing:false
            })
        },
        _onError(){
            this.setState({
                videoOK:false
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
                        },function(){
                            that._fetchData()
                        })
                    }
                })
        },
        _fetchData(page){
            var that=this;
            var url=config.api.base+config.api.comment;
            if(page!==0){
                this.setState({
                    isLoadingTail:true
                })
            }
            request.get(url,{
                creation:this.state.data._id,
                accessToken:this.state.user.accessToken,
                page:page}
            )
                .then((data) => {
                    if(data&&data.success){
                        if(data.data.length>0){
                            var items=cachedResults.items.slice();
                            if(page!==0){
                                items=items.concat(data.data);
                                cachedResults.nextPage+=1;
                            }
                            cachedResults.items=items;
                            cachedResults.total=data.total;

                                if(page!==0){
                                    that.setState({
                                        isLoadingTail:false,
                                        dataSource:that.state.dataSource.cloneWithRows(cachedResults.items)
                                    })
                                }
                        }
                    }
                })
                .catch((error) => {
                    if(page!==0){
                        this.setState({
                            isLoadingTail:false});
                    }
                    console.warn(error);
                });
        },
        //判断是否有更多
        _hasMore(){
            return cachedResults.items.length !== cachedResults.total
        },
        _fetchMoreData(){
            if(!this._hasMore() || this.state.isLoadingTail){
                return
            }
            var page=cachedResults.nextPage
            this._fetchData()

        },
        //到底的时候判断还有无  小菊花
        _renderFooter(){
            if(!this._hasMore()&&cachedResults.total!==0){
                return (
                    <View style={styles.loadingMore}><Text style={styles.loadingMoreText}>没有更多了...</Text></View>
                )
            }
            if(!this.state.isLoadingTail){
                return <View style={styles.loadingMore} />
            }
            return (
                <ActivityIndicatorIOS
                    style={styles.loadingMore}
                    />
            );
        },
        _renderRow(row){
            return (
                <View
                    key={row.id}
                    style={styles.replyBox}
                    >
                    <Image style={styles.replyAvatar} source={{uri:utils.avatar(row.replyBy.avatar)}} />
                    <View style={styles.reply}>
                        <Text style={styles.replyNickName}>{row.replyBy.nickname}</Text>
                        <Text style={styles.replyContent}>{row.content}</Text>
                    </View>
                </View>
            )
        },
        _focus(){
            this._setModalVisible(true)
        },
        _closeModal(){
            this._setModalVisible(false)
        },
        _setModalVisible(isVisible){
            this.setState({
                modalVisible:isVisible
            })
        },
        _submit(){
            var that=this;
            if(!this.state.content){
                return AlertIOS.alert('留言不能为空!')
            }
            if(this.state.isSending){
                return AlertIOS.alert('正在提交中!')
            }
            this.setState({
                isSending:true
            },function(){
                var body={
                    accessToken:this.state.user.accessToken,
                    comment:{
                        creation:this.state.data._id,
                        content:this.state.content
                    }
                };
                var url=config.api.base+config.api.comment;
                request.post(url,body)
                    .then(function(data){
                        if(data&&data.success){
                            var items=cachedResults.items.slice();
                            var content=that.state.content;
                            items=data.data.concat(items);
                            cachedResults.items=items;
                            cachedResults.total+=1;
                            that.setState({
                                content:'',
                                isSending:false,
                                dataSource:that.state.dataSource.cloneWithRows(cachedResults.items)
                            });
                            that._setModalVisible(false)
                        }
                    }).catch((err)=>{
                        that.setState({
                            content:'',
                            isSending:false
                        });
                        that._setModalVisible(false)
                        return AlertIOS.alert('评论提交错误:'+err)
                    })
            })

        },

        _renderHeader(){
            var data=this.state.data;
            return (
                <View style={styles.listHeader}>
                    <View style={styles.infoBox}>
                        <Image style={styles.avatar} source={{uri:utils.avatar(data.author.avatar)}} />
                        <View style={styles.descBox}>
                            <Text style={styles.nickName}>{data.author.nickname}</Text>
                            <Text style={styles.title}>{data.title}</Text>
                        </View>
                    </View>
                    <View style={styles.commentBox}>
                        <View style={styles.comment}>
                            <TextInput placeholder='This dog is so cute!'
                                       style={styles.content}
                                       multiline={true}
                                       onFocus={this._focus}
                                />
                        </View>
                    </View>
                    <View style={styles.commentArea}>
                        <Text style={styles.commentTitle}>精彩评论</Text>
                    </View>
                </View>

            )
        },
        render(){
            var data=this.props.row;
            return (
                <View  style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backBox}>
                            <Icon name='ios-arrow-back' style={styles.backIcon} onPress={this._backToList} />
                            <Text style={styles.backText}>返回</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle} numberOflines={1}>视频详情页</Text>
                    </View>
                    <View style={styles.videoBox}>
                        <Video  ref='videoPlayer'
                                source={{uri:utils.video(data.qiniu_video)}}
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
                            !this.state.videoOK && <Text style={styles.failText}>视频出错了!很抱歉</Text>
                        }
                        {
                            !this.state.videoReady && <ActivityIndicatorIOS style={styles.loading} color='#ee735c' />
                        }
                        {
                            this.state.videoReady && !this.state.playing
                                ?<Icon
                                   onPress={this._replay}
                                   name='ios-play'
                                   size={48}
                                   style={styles.playIcon}
                                />:null
                        }
                        {
                            this.state.videoReady && this.state.playing
                            ?<TouchableOpacity onPress={this._pause} style={styles.pauseBtn}>
                                {
                                    this.state.paused
                                        ?<Icon
                                           onPress={this._resume}
                                           name='ios-play'
                                           size={48}
                                           style={styles.resumeIcon}
                                         />
                                        :<Text></Text>
                                }
                            </TouchableOpacity>
                            :null
                        }
                        <View style={styles.progressBox}>
                            <View style={[styles.progressBar,{width:width*this.state.videoProgress}]}>

                            </View>
                        </View>
                    </View>
                        <ListView
                            dataSource={this.state.dataSource}
                            renderRow={this._renderRow}
                            enableEmptySections={true}
                            showsVerticalScrollIndicator={false}
                            automaticalllyAdjustContentInsets={false}
                            onEndReached={this._fetchMoreData}
                            onEndReachedThreshold={20}
                            renderFooter={this._renderFooter}
                            renderHeader={this._renderHeader}
                            style={styles.infoContainer}
                            />
                        <Modal
                                animated={this.state.animated}
                                visible={this.state.modalVisible}
                                transparent={this.state.transparent}
                                >
                            <View style={styles.modalContainer}>
                                <Icon name='ios-close-outline' style={styles.closeIcon} onPress={this._closeModal} />
                                <View style={styles.commentBox}>
                                    <View style={styles.comment}>
                                        <TextInput placeholder='This dog is so cute!'
                                                   style={styles.content}
                                                   multiline={true}
                                                   defaultValue={this.state.content}
                                                   onChangeText={(text)=>{
                                                        this.setState({
                                                            content:text
                                                        })
                                                   }}
                                            />
                                    </View>
                                </View>
                                <Button style={styles.submitBtn} onPress={this._submit}>评论</Button>
                            </View>
                         </Modal>
                </View>
            )
        }
    }
);

const styles = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: '#F5FCFF',
    },
    header:{
        flexDirection:'row',
        justifyContent:'center',
        alignItems:'center',
        paddingTop:20,
        paddingLeft:10,
        paddingRight:10,
        height:64,
        width:width,
        borderBottomWidth:1,
        borderColor:'rgba(0,0,0,.1)',
        backgroundColor:'#fff'
    },
    backBox:{
        position:'absolute',
        left:12,
        top:32,
        width:50,
        flexDirection:'row',
        alignItems:'center'
    },
    modalContainer:{
        flex:1,
        paddingTop:45,
        backgroundColor:'#fff'
    },
    submitBtn:{
        width:width-20,
        padding:16,
        marginBottom:20,
        borderWidth:1,
        borderColor:'#ee735c',
        borderRadius:4,
        color:'#ee735c',
        fontSize:18,
        marginLeft:10
    },
    closeIcon:{
        alignSelf:'center',
        fontSize:30,
        color:'#ee357c'
    },
    headerTitle:{
        width:width-120,
        textAlign:'center'
    },
    backIcon:{
        position:'relative',
        top:1.5,
        color:'#999',
        fontSize:20,
        marginRight:5
    },
    backText:{
        color:'#999'
    },
    videoBox:{
        width:width ,
        height:width*0.56,
        backgroundColor:'#000'
    },
    video:{
        width:width ,
        height:width*0.56,
        backgroundColor:'#000'
    },
    failText:{
        textAlign:'center',
        position:'absolute',
        left:0,
        top:100,
        width:width,
        alignSelf:'center',
        color:'#fff',
        backgroundColor:'transparent'
    },
    loading:{
        position:'absolute',
        left:0,
        top:80,
        width:width,
        alignSelf:'center',
        backgroundColor:'transparent'
    },
    progressBox:{
        width:width,
        height:2,
        backgroundColor:'#ccc'
    },
    progressBar:{
        width:1,
        height:2,
        backgroundColor:'#ff6600'
    },
    playIcon:{
        position:'absolute',
        top:90,
        left:width/2-30,
        width:60,
        height:60,
        paddingTop:8,
        paddingLeft:22,
        backgroundColor:'transparent',
        borderColor:'#fff',
        borderWidth:1,
        borderRadius:30,
        color:'#ed7b66'
    },
    pauseBtn:{
        position:'absolute',
        top:0,
        left:0,
        width:width,
        height:width*0.56,

    },
    resumeIcon:{
        position:'absolute',
        top:80,
        left:width/2-30,
        width:60,
        height:60,
        paddingTop:8,
        paddingLeft:22,
        backgroundColor:'transparent',
        borderColor:'#fff',
        borderWidth:1,
        borderRadius:30,
        color:'#ed7b66'
    },
    infoContainer:{
        marginTop:5
    },
    infoBox:{
        width:width,
        flexDirection:'row',
        justifyContent:'center',
        marginTop:10
    },
    avatar:{
        width:60,
        height:60,
        marginRight:10,
        marginLeft:10,
        borderRadius:30
    },
    descBox:{
        flex:1
    },
    nickname:{
        fontSize:18
    },
    title:{
        marginTop:8,
        fontSize:16,
        color:'#666'
    },
    replyBox:{
        flexDirection:'row',
        justifyContent:'flex-start',
        marginTop:10,
        paddingLeft:10
    },
    replyAvatar:{
        width:40,
        height:40,
        marginRight:10,
        marginLeft:10,
        borderRadius:20
    },
    replyNickName:{
        color:'#666'
    },
    replyContent:{
        marginTop:4,
        color:'#666'
    },
    reply:{
        paddingLeft:10,
        paddingRight:10,
        flex:1
    },
    loadingMore:{
        marginVertical:20
    },
    loadingMoreText:{
        color:'#777',
        textAlign:'center'
    },
    listHeader:{
        width:width,
        marginTop:5
    },
    commentBox:{
        marginTop:10,
        marginBottom:10,
        padding:8,
        width:width
    },
    content:{
        marginTop:2,
        paddingLeft:2,
        color:'#333',
        borderWidth:1,
        borderColor:'#ddd',
        borderRadius:4,
        fontSize:14,
        height:80
    },
    commentArea:{
        width:width,
        marginTop:3,
        paddingBottom:6,
        paddingLeft:10,
        paddingRight:10,
        borderBottomWidth:1,
        borderBottomColor:'#eee'
    },
    commentTitle:{
        color:'#777'
    }
});

module.exports=Detail