/**
 * Created by fuzhihong on 16/12/13.
 */
/**
 * Created by fuzhihong on 16/12/7.
 */
import React, {
    StyleSheet,
    Text,
    View,
    AsyncStorage,
    TextInput,
    AlertIOS
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import Button from 'react-native-button';
var request=require('../common/request');
var config=require('../common/config');
var CountDownText=require('react-native-sk-countdown').CountDownText;

var Login=React.createClass(
    {
        getInitialState(){
            return {
                phoneNumber:'',
                verifyCode:'',
                codeSent:false,
                countingDone:false
            }
        },
        _sendCode(){
            var that=this;
            var phoneNumber=this.state.phoneNumber;
            if(!phoneNumber){
                return AlertIOS.alert('手机号不能为空!')
            }
            var url=config.api.base+config.api.signup;
            var body={
                phoneNumber:phoneNumber
            }
            request.post(url,body)
                    .then((data)=>{
                    if(data&&data.success){
                        that.setState({
                            codeSent:true
                        })
                    }else{
                        AlertIOS.alert('获取验证码失败!')
                    }
                }).catch((err)=>{
                    console.log(err)
                    AlertIOS.alert('获取验证码失败,请检查网络!')
                })
        },
        _showVerifyCode(){
            this.setState({
                loading:false
            })
        },
        _countingDone(){
            this.setState({
                countingDone:true
            })
        },

        _submit(){
            var that=this
            var phoneNumber=this.state.phoneNumber;
            var verifyCode=this.state.verifyCode;
            if(!phoneNumber){
                return AlertIOS.alert('手机号不能为空!')
            }
            if(!verifyCode){
                return AlertIOS.alert('验证码不能为空!')
            }
            var url=config.api.base+config.api.verify;
            var body={
                phoneNumber:phoneNumber,
                verifyCode:verifyCode
            }
            request.post(url,body)
                .then((data)=>{
                    if(data&&data.success){
                        this.props.afterLogin(data.data)
                    }else{
                        AlertIOS.alert('获取验证码失败')
                    }
                }).catch((err)=>{
                    AlertIOS.alert('获取验证码失败,请检查网络!')
                })
        },
        render(){
            return (
                <View  style={styles.container}>
                    <View style={styles.loginBox}>
                        <Text style={styles.title}>快速登录</Text>
                        <TextInput
                            placeholder='请输入手机号'
                            autoCaptialize={'none'}
                            autoCorrect={false}
                            keyboardType={'number-pad'}
                            style={styles.inputField}
                            onChangeText={
                                (text)=>{
                                    this.setState({
                                        phoneNumber:text
                                    })
                                }
                            }
                            >
                        </TextInput>
                        {
                            this.state.codeSent
                            ?<View style={styles.verifyCodeBox}>
                                <TextInput
                                    placeholder='请输入验证码'
                                    autoCaptialize={'none'}
                                    autoCorrect={false}
                                    keyboardType={'number-pad'}
                                    style={styles.inputField}
                                    onChangeText={
                                (text)=>{
                                    this.setState({
                                        verifyCode:text
                                    })
                                }
                            }
                                    >
                                </TextInput>
                                {
                                    this.state.countingDone
                                    ?<Button style={styles.countBtn}
                                             onPress={this._sendCode}>获取验证码
                                     </Button>
                                    :<CountDownText
                                        style={styles.countBtn}
                                        countType='seconds' // 计时类型：seconds / date
                                        auto={true} // 自动开始
                                        afterEnd={this._countingDone} // 结束回调
                                        timeLeft={60} // 正向计时 时间起点为0秒
                                        step={-1} // 计时步长，以秒为单位，正数则为正计时，负数为倒计时
                                        startText='获取验证码' // 开始的文本
                                        endText='获取验证码' // 结束的文本
                                        intervalText={(sec) => sec + '秒重新获取'} // 定时的文本回调
                                        />
                                }
                            </View>
                            :null
                        }
                        {
                            this.state.codeSent
                            ?<Button
                                style={styles.btn}
                                onPress={this._submit}
                                >登录</Button>
                            :<Button
                                style={styles.btn}
                                onPress={this._sendCode}
                                >获取验证码</Button>
                        }
                    </View>
                </View>
            )
        }
    }
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding:10,
        backgroundColor: '#f9f9f9'
    },
    loginBox:{
        marginTop:30
    },
    title:{
        marginBottom:20,
        color:'#333',
        fontSize:20,
        textAlign:'center'
    },
    inputField:{
        flex:1,
        height:40,
        padding:5,
        color:'#666',
        fontSize:16,
        backgroundColor:'#fff',
        borderRadius:4
    },
    btn:{
        padding:10,
        marginTop:10,
        backgroundColor:'transparent',
        borderColor:'#ee735c',
        borderWidth:1,
        borderRadius:4,
        color:'#ee735c'
    },
    verifyCodeBox:{
         marginTop:10,
        flexDirection:'row',
        justifyContent:'space-between'
    },
    countBtn:{
        width:110,
        height:40,
        padding:10,
        marginLeft:8,
        backgroundColor:'transparent',
        borderColor:'#ee735c',
        borderWidth:1,
        borderRadius:2,
        textAlign:'center',
        fontWeight:'600',
        fontSize:14,
        color:'#ee735c'
    }

});

module.exports=Login;