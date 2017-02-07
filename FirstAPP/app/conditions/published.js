/**
 * Created by fuzhihong on 16/12/28.
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
    TextInput,
    ActivityIndicatorIOS,
    TouchableHighlight,
    ListView
} from 'react-native';

var width=Dimensions.get('window').width;
var height=Dimensions.get('window').height;
var Icon=require('react-native-vector-icons/Ionicons');
import Button from 'react-native-button';
var request=require('../common/request');
var config=require('../common/config');
var utils=require('../common/utils')
var cachedResult={
    nextPage:1,
    items:[],
    total:0
};

var Item=React.createClass({
    getInitialState(){
        var row=this.props.row;
        return {
            row:row
        }
    },
    render(){
        var row=this.state.row;
        return (
            <TouchableHighlight>
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




var Published=React.createClass(
    {
        getInitialState(){
            var ds=new ListView.DataSource({rowHasChanged:(r1,r2)=>r1!==r2});
            return {
                dataSource:ds.cloneWithRows([]),
                isLoadingTail:false,
                user:null
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
                            that._fetchData(1)
                        })
                    }
                })
        },
        _renderFooter(){
            if(!this._hasMore()&&cachedResult.total!==0){
                return (
                    <View style={styles.loadingMore}><Text style={styles.loadingMoreText}>没有更多了...</Text></View>
                )
            }
            if(!this.state.isLoadingTail){
                return <View style={styles.loadingMore}></View>
            }
            return (
                <ActivityIndicatorIOS
                    style={styles.loadingMore}
                    />
            )
        },
        _fetchData(page){
            this.setState({
                isLoadingTail:true
            });

            request.get(config.api.base+config.api.published,{accessToken:this.state.user.accessToken,page:page})
            .then((data)=>{
                    var that=this;
                    if(data&&data.success){
                        if(data.data.length>0){
                           var items=cachedResult.items.slice();
                           items=items.concat(data.data);
                            cachedResult.items=items;
                            cachedResult.total=data.total;
                            cachedResult.nextPage+=cachedResult.nextPage
                        }
                        that.setState({
                            isLoadingTail:false,
                            dataSource:that.state.dataSource.cloneWithRows(cachedResult.items)
                        })
                    }
                })
        },
        _hasMore(){
            return cachedResult.items.length!==cachedResult.total
        },
        _fetchMoreData(){
            if(!this._hasMore()||this.state.isLoadingTail){
                return
            }
            var page=cachedResult.nextPage;
            _fetchData(page)
        },
        _renderRow(row){
            console.log(row)
            return <Item row={row}/>
        },
        render(){
            return (
                <View  style={styles.container}>
                    <ListView
                        renderFooter={this._renderFooter}
                        dataSource={this.state.dataSource}
                        onEndReached={this._fetchMoreData}
                        onEndReachedThreshold={20}
                        renderRow={this._renderRow}
                        enableEmptySections={true}
                        showsVerticalScrollIndicator={false}
                        automaticalllyAdjustContentInsets={false}
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

module.exports=Published;
