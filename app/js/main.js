/*var graphics = require('graphics')
var elevator = require('elevator')
var Storey = require('model/Storey')
var CONF = require('conf')

console.log('WontRepair initializing')

window.WontRepair = function(node) {
	// initialize
	var storeys = [new Storey(0), new Storey(1), new Storey(2)]
	var elv = elevator.createElevator()
	var renderer = graphics.createRenderer({
		domnode:node,
		elevator:elv,
		storeys: storeys
	})
	window.elv = elv // DEBUG
	setTimeout(function(){ elv.addWaypointUp(1) }, 1000)
}

console.log('WontRepair installed')
*/

var Proc = require('proc')
var p = Proc.spawn(function(){
	console.log('initializing')
	console.log('calling next into initilize')
	this.next(loop)
})

function loop() {
	this.trace('entering loop')
	console.log(' - this : ', this)
	this.receive('wakeup', function(){
		console.log('received wakeup')
		this.next()
	}).receive({type:'val'}, function(message){
		console.log('received value : ', message.val)
		this.next()
	}).receive(150, handle_150)
}

function handle_150(val) {
	console.log(val + ' === 150')
	this.next()
}

p.send('wakeup')
p.send({type:'val', val:'spa'})
p.send('wakeup')
p.send(150)
p.send('wakeup')


console.log('proc p',p)
