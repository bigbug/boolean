var assert = require('assert');

const simp = require("./../main").default;

console.log(simp);

let expr = [
	//{expr: "a|-a", res: "1"},
	{expr: "i|i+a", res: "i"},
	{expr: "a+i|i", res: "i"},
	{expr: "(b)+a+(a)+(a+b)", res: "a+b"},

	{expr: "a+b+(a+b)", res: "a+b"},
	{expr: "(a+b)|(a+b+(a+b))", res: "a+b"},
	{expr: "a+b+a+(c|1)|(d+0)|(b)+a+(a)+(a+b)", res: "a+b"},
	{expr: "(b)+a+(a)+(a+b)", res: "a+b"},
	{expr: "a|(-a)", res: "1"},
	//{expr: "a+-a", res: "1"},
	{expr: "a", res: "a"},
	{expr: "a|1", res: "1"},
	{expr: "a+1", res: "a"},
	{expr: "a|0", res: "a"},
	{expr: "a+0", res: "0"},
	{expr: "(a+b)", res: "a+b"},
	{expr: "-(a+b+0)", res: "1"},
	{expr: "-(a+b)", res: "-a|-b"},
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
	{expr: "a+b|b+a", res: "a+b"},
	{expr: "a+b+a+(c|1)|(d+0)|(b)+a+(a)-(a+b)", res: "a+b"},
	{expr: "(a+b)|(a+b+c)", res: "a+b"},
	{expr: "(a+b+(c+(d+(e+f+g+(h+(i))))|i))", res: "a+b+i"},
	{expr: "(a+b+(a-b))", res: "0"},
	{expr: "(a+b+(a-b))|(a+b)", res: "a+b"},
	{expr: "(C213+FV+1)|C205+FC|(C205+FW+M265+(801/802))", res: "(C213+FV)|(C205+FC)|(C205+FW+M265+(801|802))"},
];
expr.map(i=>{
	console.log("check " + i.expr);
	let res = simp(i.expr);
	if(res!==i.res) {
		console.log("ERR: " + i.expr + " resolves to " + res + " instead of "+i.res);
	}
});

describe('Expressions', function () {
    expr.map(i=>{
        describe(i.expr, ()=>{
            it(i.expr, ()=>{
                let res = simp(i.expr);
                assert.equal(res, i.res);
            })
        });
    });
});