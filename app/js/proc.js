require('setImmediate')
var extend = require('extend')

	//@todo implement procLoop from strach pour avoir le moins de fonctions
	//    anonymes possibles (utiliser un prototype) pour utiliser moins de ram

	// au lieu de passer <next> on passe <proc> qui contient proc.next (==next)
	// mais aussi proc.receive (la mailbox) proc.exit (qui rend tout appel à
	// .next sans effet (set .next = noop))

	// proc.state qui est un objet vide dans lequel on laisse l'utilisateur
	// stocker ce qu'il veut

	// proc.receive N'EST pas implémenté car on est synchrone : on peut just
	// fetcher la mailbox et éventuellement faire un petit proc.next(300) s'il
	// n'y a rien

	// implémenter également proc.next(fun) et proc.next(fun, 300) qui remplace
	// la callback utilisée

var promise = require('ractive').Promise

var spawn = setImmediate

function noop() {
	/* hi ! */
}


var DEBUG_INCREMENT = 0

var ttrace = function() {
	var args = ['#'+ DEBUG_INCREMENT++].concat(Array.prototype.slice.call(arguments))
	console.log.apply(console, args)
}

function Proc(init) {
	var opts = typeof init === 'function' ? {initialize:init} : init
	extend(this, opts)
	console.log('opts', opts)
	this.__mailbox = new Mailbox(this)
	// initialization is synchronous
	this.initialize()
}

Proc.prototype.initialize = function() {
	throw new Error('Proc.spawn must me be called with a function as its first '
		+ 'argument, or with an object defining an "initialize" method.')
}

Proc.prototype.__loop = noop

Proc.prototype.next = function(/* loop */) {
	if (typeof arguments[0] === 'function') {
		this.__loop = arguments[0].bind(this)
	}
	this.trace('before spawn')
	spawn(this.__loop)
	this.trace('after spawn')
}

Proc.prototype.trace = ttrace


Proc.prototype.poke = function() {
	if (this.asleep) this.resume()
}

Proc.prototype.receive = function(pattern, handle) {
	// we boot a new chain and proxy the first tuple passed
	var chain = (new ReceiveChain()).receive(pattern, handle)
	// then we defer the execution to another timeframe, so the user can chain
	// calls to receive without the need to call something like .run() at the
	// chain end
	var self = this
	spawn(function(){
		ttrace('executing chain')
		console.error('@todo')
	})
	// then we return the chain
	return chain
}

// -- ReceiveChain ------------------------------------------------------------

function ReceiveChain () {
	this.stack = []
}

ReceiveChain.prototype.receive = function(pattern, handle) {
	ttrace('registering chain ')
	this.stack.push([pattern, handle])
	return this
}



// -- Mailbox is the message passing link between client and proc -------------

function Mailbox(proc) {
	this.proc = proc
	this.messages = []
}

Mailbox.prototype.send = function(message) {
	this.messages.push(message)
	this.proc.poke()
}

// -- Client is an API for the proc clients -----------------------------------

function Client (mailbox) {
	this.__mailbox = mailbox
}

Client.prototype.send = function (message) {
	return this.__mailbox.send(message)
}

// -- Proc static methods -----------------------------------------------------

Proc.spawn = function(opts) {
	var p = new Proc(opts)
	var api = new Client(p.__mailbox)
	return api
}

module.exports = Proc
