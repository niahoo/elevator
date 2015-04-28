
var Proc = require('proc')

var p = Proc.spawn(function (){
	console.log('initializing')
	console.log('initializing args', arguments)
	console.log('calling next into initilize')
	return this.next(mainState)
})

function mainState() {
	console.log('%c ~~ entering mainState', 'color:orange')
	return this.receive('wakeup', function(){
		console.log('received wakeup')
		return this.next(mainState)
	}).receive({type:'val'}, function(message){
		console.log('received value : ', message.val)
		return this.next(mainState)
	}).receive(150, handle_150)
	console.log('~~ finishing mainState')
}

var XXX = 5


function subState() {
	console.log('%c ~~ entering subState', 'color:darkgreen')
	return this.async(function(next){
		console.log('setting timeout')
		setTimeout(function(){
			if (XXX-- > 0)
				next(mainState, 100)
		}, 300)
	})
}

function handle_150(val) {
	console.log(val + ' === 150')
	return this.next(subState)
}
p.send('wakeup')
p.send({type:'val', val:'spa'})
p.send('wakeup')
p.send(150)
p.send('wakeup')
p.send('wakeup')


console.log('proc p',p)
