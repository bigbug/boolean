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
  import booljs from "boolean";
  console.log(booljs("a+1+b|0");
```
## Open Tasks/Laws
Currently not implemente laws from https://booleanpy.readthedocs.io/en/latest/concepts.html#laws:
* Associativity: x|(y|z) = x|y|z
* Distributivity: x+(y|z) = x+y|x+z, x|y+z = (x|y)+(x|z)
* De-Morgan: -(x|y) = (-x)+(-y)
* Elimination: x+y|x+(-y) = x, (x|y)+(x|(-y)) = x 

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
