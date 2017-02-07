/**
 * Created by fuzhihong on 16/12/7.
 */
import React, {
    StyleSheet,
    Text,
    View,
    ListView,
    TouchableHighlight,
    Image,
    Dimensions,
    ActivityIndicatorIOS,
    RefreshControl,
    AlertIOS,
    AsyncStorage
} from 'react-native';

var width=Dimensions.get('window').width     //获取设备的宽高
import Icon from 'react-native-vector-icons/Ionicons';
var Mock=require('mockjs')
var request=require('../common/request');
var config=require('../common/config');
var utils=require('../common/utils')

var cachedResults={
    nextPage:1,
    items:[],
    total:0
}

var Detail=require('./detail')
var Item=React.createClass(
    {
        getInitialState(){
            var row=this.props.row
            return {
                up:row.voted,
                row:row
            }
        },
        _up(){
          var that=this;
          var up=!this.state.up;
          var row=this.state.row;
            var url=config.api.base+config.api.up;
            var body={
                _id:row._id,
                up:up?'yes':'no',
                accessToken:this.props.user.accessToken
            };
            request.post(url,body)
                .then(function(data){
                    if(data&&data.success){
                        that.setState({
                            up:up
                        })
                    }else{
                        AlertIOS.alert('点赞失败,稍后重试')
                    }
                }).catch(function(err){
                    console.log(err)
                })
        },
        render(){
            var row=this.state.row;
            return (
                <TouchableHighlight onPress={this.props.onSelect}>
                    <View style={styles.item}>
                        <Text style={styles.title}>{row.title}</Text>
                        <Image source={{uri:utils.thumb(row.qiniu_thumb)}} style={styles.thumb}>
                            <Icon name='ios-play' size={28} style={styles.play}/>
                        </Image>
                        <View style={styles.itemFooter}>
                            <View style={styles.handleBox}>
                                <Icon onPress={this._up} name={this.state.up?'ios-heart':'ios-heart-outline'} size={28} style={[styles.up,this.state.up?null:styles.down]}/>
                                <Text style={styles.handleText} onPress={this._up}>喜欢</Text>
                            </View>
                            <View style={styles.handleBox}>
                                <Icon name='ios-chatboxes-outline' size={28} style={styles.commentIcon}/>
                                <Text style={styles.handleText}>评论</Text>
                            </View>
                        </View>
                    </View>
                </TouchableHighlight>
            )
        }
    });
var List=React.createClass(
    {
        getInitialState(){
            var ds=new ListView.DataSource({rowHasChanged:(r1,r2)=>r1!==r2});
            return {
                dataSource:ds.cloneWithRows([]),
                isLoadingTail:false,
                isRefreshing:false,
                user:null
            }
        },
        _renderRow(row){
            return <Item
                    key={row._id}
                    user={this.state.user}
                    onSelect={()=>this._loadPage(row)}
                    row={row}/>
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
                            that._fetchData(1)
                        })
                    }
                })
        },
        //获取数据
        _fetchData(page){
            if(page!==0){
                this.setState({
                    isLoadingTail:true
                })
            }else{
                this.setState({
                    isRefreshing:true
                })
            }
            var user=this.state.user
                request.get(config.api.base+config.api.find,{accessToken:this.state.user.accessToken,page:page})
                .then((data) => {
                        if(data&&data.success){
                            if(data.data.length>0){
                                data.data.map(function(item){
                                    if(item.votes.indexOf(user._id)>-1){
                                        item.voted=true
                                    }else{
                                        item.voted=false
                                    }
                                    return item
                                });
                                var items=cachedResults.items.slice();
                                var that=this;
                                if(page!==0){
                                    items=items.concat(data.data);
                                    cachedResults.nextPage+=1;
                                }else{
                                    items=items=data.data.concat(items);
                                }

                                cachedResults.items=items;
                                cachedResults.total=data.total;
                                if(page!==0){
                                    that.setState({
                                        isLoadingTail:false,
                                        dataSource:that.state.dataSource.cloneWithRows(cachedResults.items)
                                    })
                                }else{
                                    that.setState({
                                        isRefreshing:false,
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
                        }else{
                            this.setState({
                                isRefreshing:false});
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
            this._fetchData(page)

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
        //下拉刷新
        _onRefresh(){
            if(!this._hasMore()||this.state.isRefreshing){
                return false
            }
            this._fetchData(0)
        },
        _loadPage(row){
          this.props.navigator.push({
              name:'detail',
              component:Detail,
              params:{
                  row:row
              }
          })
        },
        render(){
            return (
                <View  style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>狗狗说</Text>
                    </View>
                    <ListView
                        renderFooter={this._renderFooter}
                        dataSource={this.state.dataSource}
                        onEndReached={this._fetchMoreData}
                        onEndReachedThreshold={20}
                        renderRow={this._renderRow}
                        enableEmptySections={true}
                        showsVerticalScrollIndicator={false}
                        automaticalllyAdjustContentInsets={false}
                        refreshControl={
                          <RefreshControl
                            refreshing={this.state.isRefreshing}
                            onRefresh={this._onRefresh}
                            tintColor="#ff6600"
                            title="拼命加载中..."
                            titleColor="#00ff00"
                          />
                        }
                        />
                </View>
            )
        }
    }
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FCFF',
    },
    header:{
        paddingTop:25,
        paddingBottom:12,
        backgroundColor:'#ee735c'
    },
    headerTitle:{
        color:'#fff',
        fontSize:16,
        textAlign:'center',
        fontWeight:'600'
    },
    item:{
        width:width,
        marginBottom:10,
        backgroundColor:'#fff'
    },
    thumb:{
        width:width,
        height:width*0.5,
        resizeMode:'cover'
    },
    title:{
        padding:10,
        fontSize:18,
        color:'#333'
    },
    itemFooter:{
        flexDirection:'row',
        justifyContent:'space-between',
        backgroundColor:'#eee'
    },
    handleBox:{
        padding:10,
        flexDirection:'row',
        width:width/2-0.5,
        justifyContent:'center',
        backgroundColor:'#fff'
    },
    play:{
        position:'absolute',
        bottom:14,
        right:14,
        width:46,
        height:46,
        paddingTop:9,
        paddingLeft:18,
        backgroundColor:'transparent',
        borderColor:'#fff',
        borderWidth:1,
        borderRadius:23,
        color:'#ed7b66'
    },
    handleText:{
        paddingLeft:12,
        fontSize:18,
        color:'#333'
    },
    down:{
        fontSize:22,
        color:'#333'
    },
    up:{
        fontSize:22,
        color:'#ed7b66'
    },
    commentIcon:{
        fontSize:22,
        color:'#333'
    },
    loadingMore:{
        marginVertical:20
    },
    loadingMoreText:{
        color:'#777',
        textAlign:'center'
    }
});

module.exports=List