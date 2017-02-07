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
    Image,
    Dimensions
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import Button from 'react-native-button';
var request=require('../common/request');
var config=require('../common/config');
var CountDownText=require('react-native-sk-countdown').CountDownText;
var Swiper=require('react-native-swiper');
var width=Dimensions.get('window').width;
var height=Dimensions.get('window').height;
var SwiperPage=React.createClass(
    {
        getInitialState(){
            return {
                loop:false
            }
        },
        _enter(){
            this.props.enterSwiperPage()
        },
        render(){
            return (
                <Swiper style={styles.container}
                        dot={<View style={styles.dot} />}
                        activeDot={<View style={styles.activeDot} />}
                        showsButtons={true}
                        paginationStyle={styles.pagination}
                        loop={this.state.loop}
                    >
                    <View style={styles.slide}>
                        <Image style={styles.image} source={require('../assets/images/s1.jpg')} />
                    </View>
                    <View style={styles.slide}>
                        <Image style={styles.image} source={require('../assets/images/s2.jpg')} />
                    </View>
                    <View style={styles.slide}>
                        <Image style={styles.image} source={require('../assets/images/s3.jpg')} />
                        <Button
                            style={styles.btn}
                            onPress={this._enter}
                            >马上体验</Button>
                    </View>
                </Swiper>
            )
        }
    }
);

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    slide:{
        flex:1,
        width:width
    },
    image:{
        flex:1,
        width:width
    },
    btn:{
        position:'absolute',
        width:width-20,
        height:50,
        padding:10,
        bottom:70,
        left:10,
        backgroundColor:'#ee735c',
        borderColor:'#ee735c',
        borderWidth:1,
        borderRadius:4,
        color:'#fff'
    },
    dot: {
        width: 14,
        height: 14,
        backgroundColor: 'transparent',
        borderColor: '#ff6600',
        borderRadius: 7,
        borderWidth: 1,
        marginLeft: 12,
        marginRight: 12
    },
    activeDot: {
        width: 14,
        height: 14,
        borderWidth: 1,
        marginLeft: 12,
        marginRight: 12,
        borderRadius: 7,
        borderColor: '#ee735c',
        backgroundColor: '#ee735c',
    },
    pagination:{
        bottom:30
    }
});

module.exports=SwiperPage;