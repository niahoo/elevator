require('setImmediate')

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

function Proc(initFun) {
	this.mailbox = new Mailbox(this)
	this.loopFun = noop
}

Proc.prototype.next = function(fun) {
	if (typeof arguments[0] === 'function') {
		this.loopFun = arguments[0]
	}
	spawn(this.loopFun, this)
}

Proc.prototype.poke = function() {
	if (this.asleep) this.resume()
}

Proc.prototype.receive = function(match, handle) {
}

// -- Proc static methods -----------------------------------------------------

// -- Proc static methods -----------------------------------------------------

Proc.spawn = function(init) {
	var p = new Proc()
	var api = new Client(p)
	return api
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

function Client (proc) {
	this.mailbox = proc.mailbox
}

Client.prototype.send = function (message) {
	return this.mailbox.send(message)
}

// -- Proc static methods -----------------------------------------------------

Proc.spawn = function(init) {
	var p = new Proc()
	var api = new Client(p)
	// spawn(function(){ p.next(init) })
	setTimeout(function(){ p.next(init) }, 500)
	return api
}

module.exports = Proc
