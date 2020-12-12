var assert = require('assert');
const { lcr } = require('../main');

const simp = require("./../main").default;
const disj = require("./../main").disj;
const impl = require("./../main").impl;

let expr = [
	//{expr: "a|-a", res: "1"},
	{expr: "1", res: "1", disj: "1", impl: "1"},
	{expr: "i|i+a", res: "i"},
	{expr: "a+i|i", res: "i", disj: "(a+i)|i"},
	{expr: "(b)+a+(a)+(a+b)", res: "a+b", disj: "a+b"},

	{expr: "a+b+(a+b)", res: "a+b"},
	{expr: "(a+b)|(a+b+(a+b))", res: "a+b"},
	{expr: "a+b+a+(c|1)|(d+0)|(b)+a+(a)+(a+b)", res: "a+b"},
	{expr: "(b)+a+(a)+(a+b)", res: "a+b"},
	{expr: "a|(-a)", res: "1"},
	//{expr: "a+-a", res: "1"},
	{expr: "a", res: "a"},
	{expr: "a|1", res: "1", disj: "1"},
	{expr: "a+1", res: "a", disj: "a"},
	{expr: "a|0", res: "a", disj: "a"},
	{expr: "a+0", res: "0", disj: "0"},
	{expr: "a|-1", res: "a", disj: "a"},
	{expr: "a-1", res: "0", disj: "0"},
	{expr: "a|-0", res: "1", disj: "1"},
	{expr: "a+-0", res: "a", disj: "a"},
	{expr: "(a+b)", res: "a+b"},
	{expr: "-(a+b+0)", res: "1"},
	{expr: "-(a+b)", res: "-a|-b", disj: "-a|-b"},
	{expr: "-(a|b)", disj: "-a+-b"},
	{expr: "-(a+b+1)", res: "-a|-b"},
	{expr: "-(a|b)", res: "-(a|b)"},
	{expr: "-(a|b|1)", res: "0"},
	{expr: "-(a|b|0)", res: "-(a|b)"},
	{expr: "-(a|-(b+1)|0)", res: "-(a|-b)"},
	{expr: "-(-(a|0)|-(b+1))", res: "-(-a|-b)"},
	{expr: "a|a|a", res: "a"},
	{expr: "a|(a)", res: "a"},
	{expr: "a|((a))", res: "a"},
	{expr: "a|-a", res: "1"},
	{expr: "a+-a", res: "0"},
	{expr: "(a+-a)", res: "0"},
	{expr: "(a-a)", res: "0"},
	{expr: "100", res: "100"},
	{expr: "a01", res: "a01"},
	{expr: "10a", res: "10a"},
	{expr: "a+b|b+a", res: "a+b", impl: "a+b"},
	{expr: "a+b+a+(c|1)|(d+0)|(b)+a+(a)-(a+b)", res: "a+b", disj: "a+b", impl: "a+b"},
	{expr: "(a+b)|(a+b+c)", res: "a+b", impl: "a+b"},
	{expr: "(a+b+(c+(d+(e+f+g+(h+(i))))|i))", res: "a+b+i"},
	{expr: "(a+b+(a-b))", res: "0"},
	{expr: "(a+b+(a-b))|(a+b)", res: "a+b"},
	{expr: "(C213+FV+1)|C205+FC|(C205+FW+M265+(801/802))", res: "(C213+FV)|(C205+FC)|(C205+FW+M265+(801|802))"},
	{expr: "M654+(O41|M256)", res: "M654+(O41|M256)", disj: "(M654+O41)|(M256+M654)"},
	
	{expr: "M654+-(-O41+M256)", disj: "(M654+O41)|(-M256+M654)"},
	{expr: "M654+O42+(O41|M256)", disj: "(M654+O41+O42)|(M256+M654+O42)"},
	{expr: "(A|B)+(C|D)", disj: "(A+C)|(B+C)|(A+D)|(B+D)"},
	{expr: "(A|B)+(C+-A)", disj: "-A+B+C"},
	{expr: "(A|B)+(C|-A)", disj: "(A+C)|(B+C)|(-A+B)"},
	{expr: "M654|M654+801", disj: "M654|(801+M654)", impl: "M654"},
	{expr: "M654|(M654+801)", disj: "M654|(801+M654)"},
	{expr: "((M654))|((((M654+801))))", disj: "M654|(801+M654)"},
	{expr: "(A+(B+(C+-(D+-E))))", disj: "(A+B+C+-D)|(A+B+C+E)"},
	{expr: "(A+(B+(C+-(D|-E))))", disj: "A+B+C+-D+E"},
	{expr: "B+A+C", disj: "A+B+C"},
	{expr: "A|A+B|A+B+C|B+C", impl: "A|(B+C)"},

	//{expr: "M654+-(O41+M256)", res: "M654+(-O41|-M256)", disj: "M654-O41|M654-M256"}
];
/*expr.map(i=>{
	console.log("check " + i.expr);
	let res = simp(i.expr);
	if(res!==i.res) {
		console.log("ERR: " + i.expr + " resolves to " + res + " instead of "+i.res);
	}
})*/;

describe('Expressions', function () {
    expr.map(i=>{
        describe(i.expr, ()=>{
            if(i.res) {
				it(i.expr, ()=>{
					let res = simp(i.expr);
					assert.equal(res, i.res);
				})
			}
			if(i.disj) {
				it("Disj: "+i.expr, ()=>{
					let res = disj(i.expr);
					assert.equal(res, i.disj);
				})
			}
			if(i.impl) {
				it("Impl: "+i.expr, ()=>{
					let res = impl(i.expr);
					assert.equal(res, i.impl);
				})
			}
        });
    });
});

const lcrTests = [
	{
		rules: ["1", "A", "A+B"],
		lcrs: ["-A", "A+-B", "A+B"]
	},
	{
		rules: ["1"],
		lcrs: ["1"]
	},
	{
		rules: ["1", "y", "x|x+y"],
		lcrs: ["-x+-y", "-x+y", "x"]
	}
]

describe('Long code rules', () => {
	lcrTests.map(t => {
		for(i=0; i<t.rules.length; i+=1) {
			let rules = []
			let exp = t.lcrs[i]
			for(j=0; j<t.rules.length; j+=1) {
				if(i===j) continue
				rules.push(t.rules[j])
			}
			//console.log(i)
			let res = lcr(t.rules[i], rules)
			//console.log(res)
			it("LCR: " + t.rules[i] + JSON.stringify(rules), ()=>{
				//console.log(res)
				//console.log(i)
				//console.log(exp)
				assert.equal(res, exp)
			})
		}
	})
})