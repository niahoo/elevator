var extend = require('extend')
require('setImmediate')
var _ = require('lodash')
var spawn = setImmediate
var Promise = require('es6-promise').Promise


function noop() {
	/* hi ! */
}

function strictIsEqualTo(a) {
	return function(b) {
		return a === b
	}
}

var gid = (function () {
	var gid = 0
	return function() {
		return ++gid
	}
})

var DEBUG_INCREMENT = 0

var ttrace = function() {
	var args = ['%c#'+ DEBUG_INCREMENT++]
		.concat('color:#aaa')
		.concat(Array.prototype.slice.call(arguments))
	// console.log.apply(console, args)
}

function logArgs () {
	console.log('logArgs', arguments)
}

var bif = (function(){
	var t = 0
	return function() {
		var d = new Date(), t2 = d.getTime()
		console.log('%cprev call was ' + (t2-t), 'color:lightblue')
		t = t2
	}
}())

// How it works
//
// The user provides an `initialize` function. This function is wrapped into a
// `Next` object and passed to `maybeLoop` which receives wrappers. `maybeLoop`
// checks that it is actually a wrapper and calls `.run()` on the wrapper,
// passing proc context. Wrappers must return promises. Then, `maybeLoop` send
// the response from `wrapper.run()` to `proc.loop()` which receives promises.
// `proc.loop()` adds a `.then()` to the promise, accepting a new promises (such
// as a new `Next` resulting from the user calling `this.next`)


function Proc(init) {
	var opts = typeof init === 'function' ? {initialize:init} : init
	extend(this, opts)
	this.__mailbox = new Mailbox()
	// initialization is synchronous
	var self = this
	spawn(function(){
		var handle = self.next(self.initialize)
		self.maybeLoop(handle)
	})
}

Proc.prototype.loop = function(promise) {
	// bif()
	// ttrace('loop', promise)
	var self = this
	promise.then(function(val){
		self.maybeLoop(val)
	}).catch(function(err){
		console.error(err)
		throw err
	})
}

Proc.prototype.maybeLoop = function(wrapper) {
	// ttrace('maybeloop', wrapper)
	if (wrapper instanceof Next || wrapper instanceof Receive) {
		return this.loop(wrapper.run(this))
	} else {
		console.error(wrapper, 'is not a valid wrapper')
	}
}

Proc.prototype.next = function(fun, time) {
	ttrace('next time', time)
	return new Next(fun, time)
}

Proc.prototype.receive = function(pattern, fun) {
	return new Receive(this.__mailbox).receive(pattern, fun)
}

// this function allows the user to perform async work and then call the resolve
// function passing the new looping function. Then we use the .next function to
// turn the new loop fun into a promise (and to force spawn)
Proc.prototype.async = function(fun) {
	var bound = fun.bind(this)
	var self = this
	return new Promise(function(resolve, reject) {
		var next = function(f, time) {
			resolve([f,time])
		}
		bound(next)
	}).then(function(data){
		return self.next(data[0],data[1])
	})
}

Proc.prototype.onError = function(err, ret) {
	console.log('onError ret', ret)
	console.log('onError err', err)
	throw err
}

// -- Promise wrappers --------------------------------------------------------

function Next(fun, time) {
	this.fun = fun
	this.time = time
}

Next.prototype.run = function (context) {
	var bound = this.fun.bind(context), self = this
	return new Promise(function(resolve, reject){
		var work = function(){ resolve(bound()) }
		// -- Asynchronicity is forced here since .next receives the optional
		// time parameter
		if (self.time > 0) setTimeout(work, self.time)
		else spawn(work)
	})
}


function Receive(mailbox, time) {
	this.mailbox = mailbox
	this.clauses = []
	this.hasTimeoutClause = false
	var self = this
	this.promise = new Promise(function(resolve){
		self.resolver = function(context) {
			resolve(context)
		}
	})
	// the chain handles the last added .then() to the chain, starting with the
	// promise itself
	this.chain = this.promise
}

Receive.prototype.initialMatchContext = function () {
	return {
		matched: false,
		callback:undefined,
		mailbox:this.mailbox,
		failedClauses:[]
	}
}

Receive.prototype.receive = function (pattern, callback) {
	this.chain = this.chain.then(function(acc){
		// if previous clause has found a message, just pass the context through
		if (acc.matched) return acc

		var message = acc.mailbox.match(pattern)
		if (message) {
			ttrace('receive clause succeeded')
			return extend(acc,{matched:message, callback:callback})
		} else {
			ttrace('receive clause failed')
			acc.failedClauses.push([pattern,callback])
			return acc
		}
	})
	return this
}

Receive.prototype.run = function () {
	this.resolver(this.initialMatchContext())
	//@todo if !this.hasTimeoutClause add an infinity clause
	return this.chain.then(function(acc){
		console.log('match context', acc)
		if (acc.matched) {
			// calling the user callback into a Next
			return new Next(function(){
				// 'this' here is the proc context as passed into
				// Next.prototype.run(), so we bind the callback.
				// We also pass the message found in the mailbox
				return acc.callback.bind(this)(acc.matched)
			})
		}
	})
}

Receive.prototype.resolver = function () {/* overriden in promise in construction */}

// -- Mailbox -----------------------------------------------------------------

function Mailbox() {
	this.stack = []
}

Mailbox.prototype.push = function (message) {
	this.stack.push(message)
}

Mailbox.prototype.match = function (pattern) {
	ttrace('matching',pattern)
	var predicate
	if (typeof pattern === 'object') {
		predicate = _.matches(pattern)
	} else {
		predicate = strictIsEqualTo(pattern)
	}
	var index = _.findIndex(this.stack, predicate)
	if (index !== -1) {
		// message found, drop it from the stack
		var message = this.stack[index]
		this.stack.splice(index,1)
		ttrace('found', message)
		return message
	} else {
		return false
	}
}

// -- Client -----------------------------------------------------------------

function Client(mailbox) {
	this.mailbox = mailbox
}

Client.prototype.send = function (message) {
	var self = this
	// @todo _.cloneDeep overkill ?
	ttrace('send message',message)
	spawn(function(){ self.mailbox.push(_.cloneDeep(message)) })
}


// -- API ---------------------------------------------------------------------

Proc.spawn = function(init) {
	var proc = new Proc(init)
	var client = new Client(proc.__mailbox)
	return client
}

module.exports = Proc
