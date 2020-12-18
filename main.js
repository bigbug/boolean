/**
 * Uses software parts from boolean.py (https://github.com/bastikr/boolean.py):
 * 	Copyright (c) 2009-2020 Sebastian Kraemer, basti.kr@gmail.com and others SPDX-License-Identifier: BSD-2-Clause
 */

const {isEqual, uniqWith, get, sortBy, some, concat, groupBy, forOwn, uniq, isObject} = require("lodash");

const TOKEN_AND = 1;
const TOKEN_OR = 2;
const TOKEN_NOT = 3;
const TOKEN_LPAR = 4;
const TOKEN_RPAR = 5;
const TOKEN_TRUE = 6;
const TOKEN_FALSE = 7;
const TOKEN_SYMBOL = 8;

const TOKEN_TYPES = {
    TOKEN_AND: 'AND',
    TOKEN_OR: 'OR',
    TOKEN_NOT: 'NOT',
    TOKEN_LPAR: '(',
    TOKEN_RPAR: ')',
    TOKEN_TRUE: 'TRUE',
    TOKEN_FALSE: 'FALSE',
    TOKEN_SYMBOL: 'SYMBOL',
};

// parsing error code and messages
const PARSE_UNKNOWN_TOKEN = 1;
const PARSE_UNBALANCED_CLOSING_PARENS = 2;
const PARSE_INVALID_EXPRESSION = 3;
const PARSE_INVALID_NESTING = 4;
const PARSE_INVALID_SYMBOL_SEQUENCE = 5;
const PARSE_INVALID_OPERATOR_SEQUENCE = 6;

const PARSE_ERRORS = {
    PARSE_UNKNOWN_TOKEN: 'Unknown token',
    PARSE_UNBALANCED_CLOSING_PARENS: 'Unbalanced parenthesis',
    PARSE_INVALID_EXPRESSION: 'Invalid expression',
    PARSE_INVALID_NESTING: 'Invalid expression nesting such as (AND xx)',
    PARSE_INVALID_SYMBOL_SEQUENCE: 'Invalid symbols sequence such as (A B)',
    PARSE_INVALID_OPERATOR_SEQUENCE: 'Invalid operator sequence without symbols such as AND OR or OR OR',
};

const ALLOWED_IN_TOKEN = ['.', ':', '_'];

const tokenize = (expr) => {
	const TOKENS = {
		'+': TOKEN_AND,
		'|': TOKEN_OR, '/': TOKEN_OR,
		'-': TOKEN_NOT,
		'(': TOKEN_LPAR, ')': TOKEN_RPAR,
		//'[': TOKEN_LPAR, ']': TOKEN_RPAR,
		'1': TOKEN_TRUE,
		'0': TOKEN_FALSE,
	};
	let position = 0;
	let length = expr.length;

	let res = [];

	while (position < length) {
		let tok = expr[position];

		let sym = /^[a-z0-9]+$/i.test(tok) || tok === '_';
		if (sym) {
			position += 1;
			while (position < length) {
				let char = expr[position];
				if (/^[a-z0-9]+$/i.test(char) || ALLOWED_IN_TOKEN.includes(char)) {
					position += 1;
					tok += char;
				} else {
					break;
				}
			}
			position -= 1;
		}

		if(TOKENS[tok.toLowerCase()]) {
			res.push({
				token: TOKENS[tok.toLowerCase()],
				tok,
				position
			});
		} else {
			if(sym) {
				res.push({
					token: TOKEN_SYMBOL,
					tok,
					position
				});
			} else if(![' ', '\t', '\r', '\n'].includes(tok)) {
				throw new Error(PARSE_UNKNOWN_TOKEN + " TOKEN:" + tok);
			}
		}
		position++;
	}
	return res;
};

const is_sym = (t) => {
	return [TOKEN_TRUE, TOKEN_FALSE, TOKEN_SYMBOL].includes(t);
};

const is_operator = (t) => {
	return [TOKEN_AND, TOKEN_OR].includes(t);
};

const parse = (tok) => {
	let prev_token = null;

	let exp = {};
	let and = [exp];
	let or = [and];

	let brackets = [{or, and}];

	//let ors = [or];
	//let ands = [];

	tok.map(({token, tok, position}) => {
		if(prev_token) {
			if(is_sym(prev_token.token) && is_sym(token)) {
				throw new Error(PARSE_INVALID_SYMBOL_SEQUENCE);
			}
			if(is_operator(prev_token.token) && is_operator(token)) {
				throw new Error(PARSE_INVALID_OPERATOR_SEQUENCE);
			}
		} else {
			if(is_operator(token)) {
				throw new Error(PARSE_INVALID_OPERATOR_SEQUENCE);
			}
		}
		prev_token = {token, tok, position};

		if(token===TOKEN_NOT) {
			// Imitate and for "a-a"
			if(exp.sym) {
				exp = {};
				and.push(exp);
			}
			exp.not = true;
		} else if(token===TOKEN_SYMBOL) {
			exp.sym = {type: TOKEN_SYMBOL, value: tok};
		} else if(token===TOKEN_TRUE) {
			exp.sym = {type: TOKEN_TRUE};
		} else if(token===TOKEN_FALSE) {
			exp.sym = {type: TOKEN_FALSE};
		} else if(token===TOKEN_AND) {
			exp = {};
			and.push(exp);
		} else if(token===TOKEN_OR) {
			exp = {};
			and = [exp];
			or.push(and);
		} else if(token===TOKEN_LPAR) {
			let newExp = {};
			brackets.push({and, or});
			and = [newExp];
			or = [and];
			exp.brack = or;
			exp = newExp;
		} else if(token===TOKEN_RPAR) {
			let obj = brackets.pop();
			and = obj.and;
			or = obj.or;
			exp = {};
			and.push(exp);
		}
	});
	return or;
};

let literal = (exp) => {
	if(exp.not && exp.sym.type===TOKEN_FALSE) {
		return {not: false, sym:{type: TOKEN_TRUE}};
	}
	if(exp.not && exp.sym.type===TOKEN_TRUE) {
		return {not: false, sym:{type: TOKEN_FALSE}};
	}
	return exp;
};

let demorgan_ands_to_ors = or => {
	let newOr = [];
	if(or.length!==1) {
		throw new Error("PARSE ERRROR DE MORGAN");
	}
	or[0].map(el=>{
		el.not = !el.not;
		newOr.push([el]);
	});
	return newOr;
};

let is_negation = (obja, objb) => {
	obja.not = !obja.not;
	objb.not = !!objb.not;
	if(isEqual(obja, objb)) {
		obja.not = !obja.not;
		return true;
	}
	obja.not = !obja.not;
	return false;
};

let simplify = or => {
	let ors = or;
	ors = or.map(and=>{
		let ands = and.filter(i=>!isEqual(i,{})).map(el=>{
			if(el.brack) {
				return {not: el.not, brack: simplify(el.brack)};
			}
			return literal(el);
		});
		
		let res = false;
		// search for and true
		if(ands.length>1) {
			ands = ands.filter(i=>!(i.sym && i.sym.type===TOKEN_TRUE));
		}
		// Search for and False
		ands.map(i=>{
			if(i.sym && i.sym.type===TOKEN_FALSE) {
				res = true;
			}
		});
		if(res) {
			return [{not: false, sym: {type: TOKEN_FALSE}}];
		} else {
			// filter duplicates
			ands = uniqWith(ands, isEqual);
			return ands;
		}
	});
	let res = false;

	ors = ors.filter(and=>and.filter(i=>!isEqual(i,{})).length!==0).filter(and=>and.length!==0);

	

	// filter ors for empty brackets
	ors = ors.filter(i=>(i.length!==0 && !(i.length===1 && i[0].brack && i[0].brack.length===0)));



	// if only inner bracket, then return inner bracket
	for(let a=0; a<ors.length; a++) {
	for(let b=0; b<ors[a].length; b++) {
	//if(ors[a].length===1) {
		if(ors[a][b].brack) {
			if(ors[a][b].not && ors[a][b].brack && ors[a][b].brack.length===1 && ors[a][b].brack[0].length===1) {
				// double not
				if(ors[a][b].brack[0][0].not) {
					let res = ors[a][b].brack[0][0];
					res.not = false;
					ors[a][b] = res;
				} else {
					// not false
					if(ors[a][b].brack[0][0].sym && ors[a][b].brack[0][0].sym.type===TOKEN_FALSE) {
						ors[a][b] = {not: false, sym: {type: TOKEN_TRUE}};
					}
					/*if(!ors[a][b].not) {
						ors[a][b].brack = simplify(ors[a][b].brack);
					}*/
				}
			}
			if(ors[a][b].brack) {
				if(!ors[a][b].not) {
					//return ors[a][b].brack;
					// Unpack only ands 

					if(ors[a][b].brack.length===1) {
						ors[a][b].brack[0].map(e=>ors[a].push(e));
						ors[a][b] = {};
					}
					/*if(ors[a][b].brack.length===1&&ors[a][b].brack[0].length===1) {
						ors[a][b] = ors[a][b].brack[0][0];
					}*/
				} else {
					// if only ands then perform de morgan
					if(ors[a][b].brack.length===1) {
						if(ors[a][b].brack[0].length===1) {
							ors[a][b].brack[0][0].not = ors[a][b].brack[0][0].not ? (ors[a][b].not ? false : true) : ors[a][b].not;
							ors[a][b] = ors[a][b].brack[0][0];
							ors[a][b] = literal(ors[a][b]);
						} else {
							if(ors.length===1) {
								return demorgan_ands_to_ors(ors[a][b].brack);
							} else {
								ors[a][b].brack = demorgan_ands_to_ors(ors[a][b].brack);
								ors[a][b].not = !ors[a][b].not;
							}
						}
					}
				}
			}
		}
	}
	ors[a] = ors[a].filter(i=>!isEqual(i, {}));
	}

	

	ors = ors.map(ands=>{
		let res = false;
		// search for and true
		if(ands.length>1) {
			ands = ands.filter(i=>!(i.sym && i.sym.type===TOKEN_TRUE));
		}
		// Search for and False
		ands.map(i=>{
			if(i.sym && i.sym.type===TOKEN_FALSE) {
				res = true;
			}
		});
		if(res) {
			return [{not: false, sym: {type: TOKEN_FALSE}}];
		} else {
			// filter duplicates
			ands = uniqWith(ands, isEqual);
			return ands;
		}
	});
	// Search for or False
	if(ors.length>1) {
		ors = ors.filter(i=>!(i.length===1 && i[0].sym && i[0].sym.type===TOKEN_FALSE));
	}
	// Search for or True
	ors.map(i=>{
		if(i.length!==1)
			return;
		if(i[0].sym && i[0].sym.type===TOKEN_TRUE) {
			res = true;
		}
	});
	if(res) {
		return [[{not: false, sym: {type: TOKEN_TRUE}}]];
	}

	// sort
	ors = ors.map(and => sortBy(and, i=>get(i, "sym.value")));

	// filter duplicates
	ors = ors.map(and=>{
		return uniqWith(and, (x,y)=>{
			x.not = !!x.not;
			y.not = !!y.not;
			return isEqual(x,y);
		});
	});
	ors = uniqWith(ors, isEqual);

	// search for a and not a
	let anotares = false;
	ors.map(i=>{
		if(i.length!==uniqWith(i, is_negation).length) {
			anotares = true;
		}
	});
	if(anotares) {
		return [[{not: false, sym: {type: TOKEN_FALSE}}]];
	}

	// search for a or not a
	if(ors.length !== uniqWith(ors, (a,b)=>{
		if(a.length!==1 || b.length!==1)
			return false;
		return is_negation(a[0], b[0])
	}).length) {
		return [[{not: false, sym: {type: TOKEN_TRUE}}]];
	}

	// check for includes
	for(let a=0; a<ors.length; a++)
	for(let b=0; b<ors.length; b++) {
		if(a===b) continue;
		
		// Is A a superset of B?
		let res = true;
		if(ors[a].length===1 && ors[b].length===1 && ors[a][0].brack && ors[b][0].brack && ors[a][0].brack.length===1 && ors[b][0].brack.length===1) {
			ors[a][0].brack[0].map(and => {
				if(!some(ors[b][0].brack[0], (e)=>isEqual(e,and))) {
					res = false;
				}
			});
		} else {
			ors[a].map(and => {
				if(!some(ors[b], (e)=>{
					and.not = !!and.not;
					e.not = !!e.not;
					return isEqual(e,and);
				})) {
					res = false;
				}
			});
		}
		if(res) {
			ors[b] = [{not: false, sym: {type: TOKEN_FALSE}}];
		}
	}

	// Search for or False
	if(ors.length>1) {
		ors = ors.filter(i=>!(i.length===1 && i[0].sym && i[0].sym.type===TOKEN_FALSE));
	}

	return ors;
};

function forceDisjunctive(or, not=false) {
	console.log("forceDisj");
	let res = []
	or.map(and=>{
		let orsFromAnd = []
		and.filter(i=>!isEqual(i,{})).map(an => {
			if(an.sym) {
				let symObj = {...an, not: not?!an.not:an.not};
				if(symObj.not && get(symObj, "sym.type")===TOKEN_TRUE) {
					symObj.not = false
					symObj.sym.type = TOKEN_FALSE
				} else if(symObj.not && get(symObj, "sym.type")===TOKEN_FALSE) {
					symObj.not = false
					symObj.sym.type = TOKEN_TRUE
				}
				if(orsFromAnd.length===0)
					orsFromAnd.push([symObj]);
				else {
					orsFromAnd.map(a=>{
						a.push(symObj)
						return a
					})
				}
			} else if(an.brack) {
				
				let brackRes = forceDisjunctive(an.brack, not?!an.not:an.not)
				if(orsFromAnd.length===0) {
					orsFromAnd = brackRes
				} else {
					let newOrsFromAnd = []
					brackRes.map(b => {
						orsFromAnd.map(a=>{
							b.map(c => {
								if(!some(a, c))
									newOrsFromAnd.push(uniq([...a, ...b]))
							})
							/*if(!isEqual(a, b)) {
								let addElement = uniq([...a, ...b]);
								if(!some(newOrsFromAnd, addElement))
									newOrsFromAnd.push(addElement)
							}*/
						})
						//newOrsFromAnd = cleanSameLiteral(newOrsFromAnd)
					})
					if(!isEqual(newOrsFromAnd, cleanSameLiteral(newOrsFromAnd))) {
						console.log("excess1!")
					}
					newOrsFromAnd = cleanSameLiteral(newOrsFromAnd)
					orsFromAnd = newOrsFromAnd
				}
			} else {
				throw new Error("Unexpected type");
			}
		})
		res = [...res, ...orsFromAnd]

		if(!isEqual(res, cleanSameLiteral(res))) {
			console.log("excess2!")
		}
	})
	if(not) {
		res = [res.map(i=>{
			return {brack: i.map(j=>[j])}
		})]
		res = forceDisjunctive(res)
	}
	res = cleanTrivialLiterals(res)
	if(!isEqual(res, cleanSameLiteral(res))) {
		console.log("excess3!")
	}
	return res;
}

function forceDisjunctive2(or, not=false) {
	//console.log("forceDisj2");
	let or2 = or;
	if(not) {
		or2 = [or2.map(i=>{
			return {brack: i.filter(j=>!isEqual(j,{})).map(j=>{
				if(isObject(j)) {
					j.not = !j.not
				} else {
					j = j.map(k=>{
						k.not = !k.not
					})
				}
				return [j]
			})}
		})]
		not = false
	}
	let res = []
	or2.map(and=>{
		let orsFromAnd = []
		and.filter(i=>!isEqual(i,{})).map(an => {
			if(an.sym) {
				let symObj = {...an, not: an.not};
				if(symObj.not && get(symObj, "sym.type")===TOKEN_TRUE) {
					symObj.not = false
					symObj.sym.type = TOKEN_FALSE
				} else if(symObj.not && get(symObj, "sym.type")===TOKEN_FALSE) {
					symObj.not = false
					symObj.sym.type = TOKEN_TRUE
				}
				if(orsFromAnd.length===0)
					orsFromAnd.push([symObj]);
				else {
					orsFromAnd.map(a=>{
						a.push(symObj)
						return a
					})
				}
			} else if(an.brack) {
				
				let brackRes = forceDisjunctive2(an.brack, an.not)
				if(orsFromAnd.length===0) {
					orsFromAnd = brackRes
				} else {
					let newOrsFromAnd = []
					brackRes.map(b => {
						orsFromAnd.map(a=>{
							/*b.map(c => {
								if(!some(a, c))
									newOrsFromAnd.push(uniq([...a, ...b]))
							})*/
							let addElement = uniq([...a, ...b]);
							newOrsFromAnd.push(addElement)
							/*if(!isEqual(a, b)) {
								let addElement = uniq([...a, ...b]);
								if(!some(newOrsFromAnd, addElement))
									newOrsFromAnd.push(addElement)
							}*/
						})
						//newOrsFromAnd = cleanSameLiteral(newOrsFromAnd)
					})
					/*if(!isEqual(newOrsFromAnd, cleanSameLiteral(newOrsFromAnd))) {
						console.log("excess1!")
					}*/
					newOrsFromAnd = cleanSameLiteral(newOrsFromAnd)
					orsFromAnd = newOrsFromAnd
				}
			} else {
				throw new Error("Unexpected type");
			}
		})
		res = [...res, ...orsFromAnd]

		/*if(!isEqual(res, cleanSameLiteral(res))) {
			console.log("excess2!")
		}*/
	})
	res = cleanTrivialLiterals(res)
	/*f(!isEqual(res, cleanSameLiteral(res))) {
		console.log("excess3!")
	}*/
	return res;
}

function cleanSameLiteral(ors) {
	return ors.map(and=>{
		return uniqWith(and, (i,j)=>(!!i.not==!!j.not && get(i, "sym.value")===get(j, "sym.value")))
	})
}

function removeOrTrue(ors) {
	let res = ors
	
	res = res.filter(i=>i.length!==1 || get(i, "[0].sym.type")!==TOKEN_TRUE)
	
	return res
}

function cleanOrTrue(ors) {
	let res = ors
	
	let foundOrTrue = false
	res = res.map(r => {
		if(r.length===1 && get(r, "[0].sym.type")===TOKEN_TRUE) {
			foundOrTrue = true
		}
		return r
	})
	if(foundOrTrue) {
		return [[{sym: {type: TOKEN_TRUE}}]]
	}
	return res
}

function cleanTrivialLiterals(ors) {
	let res = ors

	if(ors.length>1)
		res = cleanOrTrue(res)

	res = res.filter(and => {
		let foundAndFalse = false
		and.map(r => {
			if(get(r, "sym.type")===TOKEN_FALSE) {
				foundAndFalse = true
			}
		})
		if(foundAndFalse) {
			return false
		}
		return true
	})

	res = res.filter(i => i.length!==1 || get(i, "[0].sym.type")!==TOKEN_FALSE)
	res = res.map(i=>{
		if(i.length===1) return i
		if(i.length<2) return i
		let a = i.filter(j => get(j, "sym.type")!==TOKEN_TRUE);
		if(a.length===0) {
			return [{sym:{type: TOKEN_TRUE}}]
		}
		return a;
	})

	if(res.length===0 || res[0].length===0) {
		res = [[{sym: {type: TOKEN_FALSE}}]]
	}

	return res
}

function cleanNotSatisfiableAndInDisj(ors) {
	return ors.filter(and=>{
		let good = true;
		let bla = groupBy(and, i=>get(i, "sym.value"))
		forOwn(bla, (v)=>{
			let prev = get(v, "[0].not")
			v.map(i=>{
				if(get(i, "not")!=prev) {
					good = false
				}
			})
		})
		return good;
	})
}

function sortAnds(ors) {
	return ors.map(and => {
		return sortBy(and, i=>get(i, "sym.value"))
	})
}

let stringify = (or) => {
	return or.map(and=>{
		let r = (and.length===1 || or.length===1) ? "" : "(";
		r += and.map(el=>{
			let s = el.not ? "-" : "";
			if(el.sym) {
				if(el.sym.type===TOKEN_TRUE) {
					s += "1";
				} else if(el.sym.type===TOKEN_FALSE) {
					s += "0";
				} else if(el.sym.type===TOKEN_SYMBOL) {
					s += el.sym.value;
				} else {
					throw new Error(PARSE_INVALID_NESTING);
				}
				return s;
			} else if(el.brack) {
				return s+
					"("+
					stringify(el.brack)+
					")";
			} else {
				throw new Error(PARSE_INVALID_NESTING);
			}
		}).join("+");
		r += (and.length===1 || or.length===1) ? "" : ")";
		return r;
	}).join("|");
};

let simp = (expr) => {
	return stringify(simplify(parse(tokenize(expr))));
};

let disj = (expr) => {
	let res = forceDisjunctive2(parse(tokenize(expr)));
	res = cleanNotSatisfiableAndInDisj(res)
	res = cleanSameLiteral(res)
	res = sortAnds(res)
	res = stringify(res)
	return res;
}

let impl = (expr) => {
	let res = forceDisjunctive2(parse(tokenize(expr)));
	res = cleanNotSatisfiableAndInDisj(res)
	res = cleanSameLiteral(res)
	res = sortAnds(res)
	res = cleanDuplicates(res)
	res = cleanImply(res)
	res = stringify(res)
	return res;
}

let cleanImply = (expr) => {
	let a = expr.map(()=>0)
	for(let i=0; i<expr.length; i+=1) {
		for(let j=0; j<expr.length; j++) {
			if(i===j) continue

			let syms = expr[i].map(r=>((r.not)?"-":"")+get(r, "sym.value"))
			let syms2 = expr[j].map(r=>((r.not)?"-":"")+get(r, "sym.value"))
			
			if(syms.filter(r=>!syms2.includes(r)).length===0) {
				a[j]++
			}
		}
	}
	return expr.filter((i, idx) => a[idx]===0)
}

let implies = (a,b) => {
	let syms = a.map(r=>((r.not)?"-":"")+get(r, "sym.value"))
	let syms2 = b.map(r=>((r.not)?"-":"")+get(r, "sym.value"))
	
	if(syms.filter(r=>!syms2.includes(r)).length===0) {
		return true
	}
	return false
}

let cleanDuplicates = (ors) => {
	return uniqWith(ors, (a,b)=>stringify([a])===stringify([b]))
}

let lcrCode = (expr) => {
	let res = forceDisjunctive2(parse(tokenize(expr)));
	res = cleanNotSatisfiableAndInDisj(res)
	res = cleanSameLiteral(res)
	res = sortAnds(res)
	res = cleanDuplicates(res)
	return res
}

let lcr = (rule, otherRules) => {
	let rl = lcrCode(rule)
	if(otherRules.length===0) {
		return stringify([[{sym: {type: TOKEN_TRUE}}]])
	}
	let othr = otherRules.map(e=>lcrCode(e))
	let literals = []
	othr.map(i=>i.map(o=>literals.push(o)))
	literals = removeOrTrue(literals)
	rl = removeOrTrue(rl)
	if(rl.length===1 && rl[0].length===1 && get(rl[0][0], "sym.type") === TOKEN_TRUE) {
		rl = []
	}
	
	rl.map(ij=>{
		literals = literals.filter(kl => {
			let res = [ij, kl]
			res = cleanDuplicates(res)
			res = cleanImply(res)
			const stra = stringify(res)
			const strb = stringify([kl])
			return stra !== strb
			//return !implies(ij, kl)
		})
	})

	let ltr = literals.map(i=>{
		return {not: true, brack: [i]}
	})

	let res
	if(rl.length===0) {
		res = [ltr]
	} else {
		res = rl.map(ij=>{
			return [...ij, ...ltr]
		})
	}

	res = forceDisjunctive2(res);
	res = cleanNotSatisfiableAndInDisj(res)
	res = cleanSameLiteral(res)
	res = sortAnds(res)
	res = cleanDuplicates(res)
	res = cleanImply(res)
	res = stringify(res)
	return res
}

let replaceToVal = (ors, truthy = [], falsy = [], makeOthers = null) => {
	let res = ors.map(and => {
		return and.map(el => {
			if(el && get(el, "sym.type")===TOKEN_SYMBOL) {
				let sym = get(el, "sym.value");
				let not = get(el, "not", false)
				if(truthy.includes(sym)) {
					return {not, sym: {type: TOKEN_TRUE}}
				} else if(falsy.includes(sym)) {
					return {not, sym: {type: TOKEN_FALSE}}
				} else if(makeOthers) {
					if(makeOthers===TOKEN_TRUE) {
						return {not, sym: {type: TOKEN_TRUE}}
					} else if(makeOthers===TOKEN_FALSE) {
						return {not, sym: {type: TOKEN_FALSE}}
					}
				}
			} else if(el && el.brack) {
				return replaceToVal(el.brack, truthy, falsy, makeOthers)
			}
			return el
		}
		)
	})
	return res;
}


let eval = (expr, truthy = [], falsy= [], makeOthers = null) => {
	let res = forceDisjunctive2(parse(tokenize(expr)));
	res = replaceToVal(res, truthy, falsy, makeOthers);
	res = forceDisjunctive2(res);
	res = cleanNotSatisfiableAndInDisj(res)
	res = cleanSameLiteral(res)
	res = sortAnds(res)
	res = cleanDuplicates(res)
	res = cleanImply(res)
	res = stringify(res)
	return res;
}

let evalAnswer = eval("-A", ['A'])
console.log(evalAnswer)
//console.log(impl("a+(a|b)"))
//let lcrAnswer = lcr("a", ["a+b"]);
//console.log(lcrAnswer)
//console.log(impl("-(A+(B+(C+-D+-E)))"))
//console.log(impl("(A+B)|(A+C)"))
//console.log(impl("-(421+513+(531|365)+-K26+(5XXL+-581L|2XXL)|(K34+(M256|M176)|ME05)+(460|494))|K26)"))
//onsole.log(impl("(421+513+(531|365)+-K26+((B01+(M256|M176|M177)|ME05)+(5XXL+-512L+-516L+-521L+-526L+-581L|2XXL)|(K34+B01+(M256|M176|M177)|ME05)+(460|494))|K26)"))
//onsole.log(eval("-x+-y", [], [], TOKEN_FALSE));



//console.log(disj("A+B|(C+D+(E|D))"))
//console.log(disj("-(A+B)"))
// -(A+B) = -A | -B
// -(A|B) = -A + -B
// -(A|B+C) = -A + -(B+C) = -A + (-B | -C) = -A+-B | -A+-C

exports.tokenize = tokenize;
exports.parse = parse;
exports.default = simp;
exports.disj = disj;
exports.impl = impl;
exports.lcr = lcr;
exports.eval = eval;
exports.evaluate = eval;
exports.TOKEN_FALSE = TOKEN_FALSE;
exports.TOKEN_TRUE = TOKEN_TRUE;