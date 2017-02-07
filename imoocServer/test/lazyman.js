/**
 * Created by fuzhihong on 17/1/3.
 */
function _LazyMan(name){
    this.tasks=[];
    var that=this;
    var fn=function(n){
        var name=n;
        return function () {
            console.log('Hi!My name is'+name);
            that.next()
        }
    }(name);
    this.tasks.push(fn);
    setTimeout(function(){
        console.log(that.tasks);
        that.next();
        return this
    },0)
}
_LazyMan.prototype.next=function(){
    var fn=this.tasks.shift();
    fn&&fn()
};
_LazyMan.prototype.eat=function(name){
    var that=this;
    var fn=(function(n){
        return function(){
            console.log('Eat'+n);
            that.next()
        }
    })(name)
    this.tasks.push(fn)
    return this
};
_LazyMan.prototype.sleep=function(time){
    var that=this;
    var fn=(function (t) {
        return function(){
            setTimeout(function(){
                console.log('Wake up after'+t+'s')
                that.next()
            },t*1000)
         
        }
    })(time)
    this.tasks.push(fn)
    return this
}
_LazyMan.prototype.sleepFirst=function(time){
    var that=this;
    var fn=(function(t){
        return function(){
            setTimeout(function(){
                console.log('Wake up after'+t+'s')
                that.next()
            },t*1000)
        }
    })(time)
    this.tasks.unshift(fn)
    return this
};

function LazyMan(name){
    return new _LazyMan(name)
}