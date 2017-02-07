/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */

var List=require('./app/creation/index');
var Edit=require('./app/edit/index');
var Account=require('./app/account/index');
var Login=require('./app/account/login');
var Icon=require('react-native-vector-icons/Ionicons');
var SwiperPage=require('./app/account/swiper')

import React, {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TabBarIOS,    //下边菜单栏
  Navigator,  //导航器,
  AsyncStorage,
  ActivityIndicatorIOS,
  Dimensions
} from 'react-native';
var width=Dimensions.get('window').width;
var height=Dimensions.get('window').height;



var FirstAPP=React.createClass(
    {
      getInitialState(){
        return{
          selectedTab:'account',
          logined:false,
          user:null,
          booted:false,
          entered:false
        }
      },
      componentDidMount(){
          this._asyncAppStatus()
      },
      _asyncAppStatus(){
          var that=this;
          AsyncStorage.multiGet(['user','entered'])
            .then((data)=>{
                  //[['user','{}'],['entered','yes']]
                  var userData=data[0][1];
                  var enteredData=data[1][1];
                  var user;
                  var newState={booted:true};
                  if(data){
                      user=JSON.parse(userData)
                  }
                  if(user&&user.accessToken){
                      newState.user=user;
                      newState.logined=true
                  }else{
                      newState.logined=false
                  }
                  if(enteredData==='yes'){
                      newState.entered=true
                  }
                  that.setState(newState)
              })
      },
        _afterLogin(user){
            var that=this;
            user=JSON.stringify(user);
            AsyncStorage.setItem('user',user)
                .then(()=>{
                    that.setState({
                        logined:true,
                        user:JSON.parse(user)
                    })
                })
        },
        _logout(){
            AsyncStorage.removeItem('user');
            this.setState({
                logined:false,
                user:null
            })
        },
        _enterSlide(){
            this.setState({
                entered:true
            },function(){
                AsyncStorage.setItem('entered','yes')
            })
        },
      render() {
          if(!this.state.booted){
              return (
                  <View style={styles.bootPage}>
                      <ActivityIndicatorIOS color='#ee7335c' />
                  </View>
              )
          }
          if(!this.state.entered){
              return <SwiperPage enterSwiperPage={this._enterSlide}/>
          }
          if(!this.state.logined){
              return <Login afterLogin={this._afterLogin}/>
          }
          //tintColor选中颜色  bartintcolor 背景颜色  TabBarIOS iostab组件
          return (
              <TabBarIOS
                  bartintcolor='#46A3FF'
                  unselectedTintColor="yellow"
                  tintColor="#ee735c">
                  <Icon.TabBarItem
                      iconName='ios-videocam-outline'
                      selectedIconName='ios-videocam'
                      selected={this.state.selectedTab === 'list'}
                      onPress={() => {
            this.setState({
              selectedTab: 'list',
            });
          }}>
                      <Navigator
                          initialRoute={{name:'list',component:List}}
                          configureScene={(route)=>{return Navigator.SceneConfigs.FloatFromRight}}
                          renderScene={(route,navigator)=>{var Component=route.component;return <Component {...route.params} navigator={navigator} /> }}
                          />
                  </Icon.TabBarItem>
                  <Icon.TabBarItem
                      iconName='ios-home-outline'
                      selectedIconName='ios-home'
                      //badge={this.state.notifCount > 0 ? this.state.notifCount : undefined}  提示消息个数
                      selected={this.state.selectedTab === 'edit'}
                      onPress={() => {
            this.setState({
              selectedTab: 'edit',
              notifCount: this.state.notifCount + 1,
            });
          }}>
                      <Edit/>
                  </Icon.TabBarItem>
                  <Icon.TabBarItem
                      iconName='ios-more-outline'
                      selectedIconName='ios-more'
                      renderAsOriginal
                      selected={this.state.selectedTab === 'account'}
                      onPress={() => {
            this.setState({
              selectedTab: 'account',
              presses: this.state.presses + 1
            });
          }}>
                      <Account user={this.state.user} logout={this._logout}/>
                  </Icon.TabBarItem>
              </TabBarIOS>
          )
      }
    }
)


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF'
  },
    bootPage:{
        width:width,
        height:height,
        backgroundColor:'#fff',
        justifyContent:'center'
    }
});

AppRegistry.registerComponent('FirstAPP', () => FirstAPP);
