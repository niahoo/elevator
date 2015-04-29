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
	console.log.apply(console, args)
}

ttrace = noop

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
	this.client = new Client(this.__mailbox)
	// initialization is synchronous
	var self = this
	spawn(function(){ //@todo here async useless
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
		console.error(err.stack)
		throw err
	})
}

Proc.prototype.maybeLoop = function(wrapper) {
	// ttrace('maybeloop', wrapper)
	if (wrapper instanceof Next || wrapper instanceof Receive) {
		return this.loop(wrapper.run(this))
	} else if (wrapper instanceof Exit) {
		// we stop here
		return
	} else {
		console.error(wrapper, 'is not a valid wrapper')
	}
}

Proc.prototype.next = function(fun, time) {
	ttrace('next time', time)
	return new Next(fun, time)
}

Proc.prototype.exit = function() {
	return new Exit()
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

function Exit() {}

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
	this.afterClause = undefined
	var self = this
}

Receive.prototype.receive = function (pattern, callback) {
	var predicate = this.getPredicateFunction(pattern)
	this.clauses.push([predicate, callback])
	return this
}

Receive.prototype.OFF_getPredicateFunction = function (pattern) {
	var pred = typeof pattern === 'object'
		? _.matches(pattern)
		: strictIsEqualTo(pattern)
	return function(t) {
		ttrace(pattern, ' not match ', t)
		return pred(t)
	}
}

Receive.prototype.getPredicateFunction = function (pattern) {
	return typeof pattern === 'object'
		? _.matches(pattern)
		: strictIsEqualTo(pattern)
}
//	this.chain = this.chain.then(function(acc){
//		// if previous clause has found a message, just pass the context through
//		if (acc.matched) return acc

//		// if no message is found, udefined is returned
//		var message = acc.mailbox.match(pattern)
//		if (message !== void 0) {
//			ttrace('receive clause succeeded')
//			return extend(acc,{matched:true, message:message, callback:callback})
//		} else {
//			ttrace('receive clause failed')
//			acc.failedClauses.push([pattern,callback])
//			return acc
//		}
//	})
//	return this
// }

Receive.prototype.after = function (timeout, callback) {
	this.afterClause = [timeout, callback]
	return this
}

Receive.prototype.run = function (callbackContext) {
	ttrace('Receive run')
	if (! this.afterClause) {
		// if no .after clause has been set, we set one with Infinity as a
		// timeout
		ttrace('auto setting infinity clause')
		this.after(Infinity)
	}
	// we send all the clauses to the mailbox which knows how to handle them (we
	// should define an interface because this violates encapsulation ?)

	// The mailbox returns a promise resulting in a match context with the
	// message and the associated callback
	return this.mailbox.withMatch(this.clauses, this.afterClause[0], this.afterClause[1])
		.then(function(matchContext){
			return new Next(function(){
				ttrace('match context', matchContext)
				// we call the user callback, bound to the proc context, passing
				// the message. The callback must return a wrapper (this.next(),
				// this.receive(), ...)
				// if a timeout occured, the message is undefined
				return matchContext.callback.bind(callbackContext)(matchContext.message)
			})
		})
}

// -- Mailbox -----------------------------------------------------------------

function Mailbox() {
	this.stack = []
	this.onMessage = false
}

Mailbox.prototype.push = function (message) {

	ttrace('mailbox push called', message)
	// we check if a message handler is set. If yes, we only stack the message
	// if the handler returns falsy (message NOT consumed)
	if (!this.onMessage || !this.onMessage(message)) {
		this.stack.push(message)
	}
}

// accepts a clauses array such as defined per Receiv & returns a match context
// or undefined
Mailbox.prototype.withMatch = function (clauses, timeout, timeoutCallback) {
	ttrace('withMatch mailbox stack', this.stack)
	var slen = this.stack.length,
	    clen = clauses.length,
	    message,
	    clause,
	    predicate,
	    callback,
	    i,
	    j,
	    self = this
	for (i = 0; i < slen; i++) {
		message = this.stack[i]
		ttrace('test message', message)
		for (j = 0; j < clen; j++) {
			clause = clauses[j]
			predicate = clause[0]
			callback = clause[1]
			if (predicate(message)) {
				// we found a matching message. We delete it
				this.stack.splice(i,1)
				return Promise.resolve({
					matched: true,
					message:message,
					callback:callback
				})
			}
		}
	}

	// we did not find a matching message. we will set a timeout and resolve it
	// as soon as we receive a matching message

	// onMessage should not be bound since the Receive promise wrapper should
	// not be resolved until the following code is executed (or if the previous
	// search matcses, onMessage won't be bound)
	if (this.onMessage) {
		console.error('onMessage already bound') //@todo remove this line
		throw new Error('mailbox onMessage already bound')
	}


	var timer

	return new Promise(function(resolve, reject){
		self.onMessage = function(message){
			ttrace('mailbox onMessage called')
			// when we get a message, we check for the clauses to match
			for (j = 0; j < clen; j++) {
				clause = clauses[j]
				predicate = clause[0]
				callback = clause[1]
				if (predicate(message)) {
					self.onMessage = false
					// a clearTimeout should be useless as the promise can only
					// be resolved once ; but doing so we dicard any debug trace
					// in the timeout callback. (@todo in production, no debug
					// => no clearTimeout)
					clearTimeout(timer)
					resolve({
						matched: true,
						message:message,
						callback:callback
					})
					// we return true, which means that the message will not be
					// pushed on the stack (as we use it now)
					return true
				}
			}
			return false
		}
		// set the onmessage listener. If the timeout is 0, a matching message has already be
		if (_.isFinite(timeout)) {
			// if the timeout occurs, we resolve the Promise with the associated
			// callback and an undefined message
			ttrace('waiting for ' + timeout)
			var resolveTimeout = function(){
				self.onMessage = false
				resolve({
					matched: false,
					message:undefined,
					callback:timeoutCallback
				})
			}
			// if timeout is 0 we resolve synchronously
			if (timeout > 0) timer = setTimeout(resolveTimeout, timeout)
			else /* timeout === 0 */ resolveTimeout()
		}
	})
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
	return proc.client
}

module.exports = Proc
