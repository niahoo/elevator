
var Proc = require('proc')

var OKSTYLE = 'color:green'

var p = window.p = Proc.spawn(function (){
	console.log('initializing')
	console.log('initializing args', arguments)
	console.log('calling next into initilize')
	return this.next(mainState)
})

function mainState() {
	console.log('%c ~~ entering mainState', 'color:orange')
	return this.receive('wakeup', function(){
		console.log('%creceived wakeup', OKSTYLE)
		return this.next(mainState)
	}).receive({type:'val'}, function(message){
		console.log('%creceived value : ', OKSTYLE, message.val)
		return this.next(mainState)
	}).receive(150, handle_150)
	.after(30000, function(){ return this.next(subState)})
}

var XXX = 5


function subState() {
	console.log('%c ~~ entering subState', 'color:darkgreen')
	return this.async(function(next){
		console.log('setting timeout')
		setTimeout(function(){
			if (XXX-- > 0)
				next(mainState)
		}, 300)
	})
}

function handle_150(val) {
	console.log('%c' + val + ' === 150', OKSTYLE)
	return this.next(mainState)
}
p.send('wakeup')
p.send({type:'val', val:'spa'})
p.send('wakeup')
p.send(150)
p.send('wakeup')
p.send('wakeup')


console.log('proc p',p)
