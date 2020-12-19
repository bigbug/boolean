# boolean.js
Function for simplifying boolean expressions. Loosely based on boolean.py from bastikr.

![Travis Status](https://api.travis-ci.org/bigbug/boolean.svg?branch=master)

## Install

Using npm:
```
  npm install boolean-simp
```

## Usage

Currently defined tokens:
* '+': AND
* '-': NOT
* '|', '/': OR
* '(': Left bracket
* ')': Right bracket

```
  import {disj, impl, lcr, evaluate} from "boolean-simp";
  console.log(disj("a+1+b|0"); // a+b
  console.log(disj("a|a+b")); // a|(a+b)
  console.log(impl("a|a+b")); // a
  console.log(lcr("1", ["a+b"])); // -(a+b) = -a | -b
  console.log(evaluate("a+b", ["a"], [])); // b
```

## Functions
* disj(rule): Transforms a rule into disjunctive normal form
* impl(rule): Uses implications to mitigate terms
* lcr(rule, Array of rules): Calculate long code rules from a given rule set
* evaluate(rule, Array of truthy literals, Array of falsy literals, MakeOthers = null|TOKEN_FALSE|TOKEN_TRUE): Evaluates and/or simplifies the rule given the truthy/falsy literals. The parameter MakeOthers can be used for flagging literals which are neither in the truthy array nor in the falsy array.

## License
MIT License

Copyright (c) 2020 bigbug

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
