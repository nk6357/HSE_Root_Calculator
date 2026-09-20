const input=document.getElementById("inroot");
const accuracyInput=document.getElementById("accuracy");
const calculateButton=document.getElementById("Calculate");
const numericResult=document.getElementById("numeric-result");
const analyticResult=document.getElementById("analytic-result");

// класс для комплексных чисел
class Complex {
    constructor(real, imag) {
        this.re = real;
        this.im = imag;
    }

    add(other) {
        return new Complex(this.re + other.re, this.im + other.im);
    }

    sub(other) {
        return new Complex(this.re - other.re, this.im - other.im);
    }

    mul(other) {
        return new Complex(
            this.re * other.re - this.im * other.im,
            this.re * other.im + this.im * other.re
        );
    }

    div(other) {
        const denom = other.re * other.re + other.im * other.im;
        if (Math.abs(denom) < 1e-15) {
            return null;
        }
        return new Complex(
            (this.re * other.re + this.im * other.im) / denom,
            (this.im * other.re - this.re * other.im) / denom
        );
    }

    pow(n) {
        if (!Number.isInteger(n)) {
            return null;
        }
        if (n === 0) return new Complex(1, 0);
        if (n < 0) {
            const pos = this.pow(-n);
            return new Complex(1, 0).div(pos);
        }

        let result = new Complex(1, 0);
        let base = new Complex(this.re, this.im);
        let exp = n;

        while (exp > 0) {
            if (exp % 2 === 1) {
                result = result.mul(base);
            }
            base = base.mul(base);
            exp = Math.floor(exp / 2);
        }

        return result;
    }

    toString(accuracy) {
        const re = formatNumber(this.re, accuracy);
        const im = formatNumber(Math.abs(this.im), accuracy);
        const reNum = parseFloat(re);
        const imNum = parseFloat(im);

        if (Math.abs(reNum) < 1e-10 && Math.abs(imNum) < 1e-10) return "0";
        if (Math.abs(imNum) < 1e-10) return re.toString();
        if (Math.abs(reNum) < 1e-10) {
            if (Math.abs(imNum - 1) < 1e-10) return this.im > 0 ? "i" : "-i";
            return this.im > 0 ? im + "i" : "-" + im + "i";
        }

        const sign = this.im >= 0 ? "+" : "-";
        if (Math.abs(imNum - 1) < 1e-10) {
            return re + sign + "i";
        }
        return re + sign + im + "i";
    }
}

//форматирование числа
function formatNumber(number, accuracy) {
    if (accuracy > 15) {
        return number.toFixed(accuracy);
    }
    return Number(number.toFixed(accuracy));
}

//аналитическая форма кв корня
function analyticSqrt(number) {
    if (number === 0) {
        return "0";
    }
    let outside=1;
    let inside=number;

    for (let i=2; i*i<=inside; i++) {
        while (inside % (i*i)===0) {
            inside = inside/(i*i);
            outside = outside*i;
        }
    }
    if (inside===1) {
        return outside.toString();
    }
    if (outside===1) {
        return "√" + inside;
    }
    return outside +"√"+ inside;
}

// аналитическая форма для отрицательных
function analyticSqrtNegative(number) {
    const pos = Math.abs(number);
    const a = analyticSqrt(pos);

    if (a === "1") {
        return "i";
    }
    return a + "·i";
}

// проверяем скобки
function checkBrackets(str) {
    let cnt = 0;
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '(') cnt++;
        if (str[i] === ')') cnt--;
        if (cnt < 0) return false;
    }
    return cnt === 0;
}

// проверка на странные символы
function hasInvalidCharacters(str) {
    const allowed = /^[0-9a-zA-Z+\-*/()^.\sPi]+$/;
    return !allowed.test(str);
}

// пустые скобки ()
function hasEmptyBrackets(str) {
    return /\(\s*\)/.test(str);
}

// проверяем правильность функций
function checkFunctionFormat(str) {
    const trig = /(sin|cos|tan|ctg)\^?\d*\([^)]*\)/g;
    const matches = str.match(trig);

    if (matches) {
        for (let m of matches) {
            const inside = m.match(/\(([^)]*)\)/);
            if (inside && inside[1].trim() === '') {
                return false;
            }
        }
    }

    const logs = /(ln|log\d+)\^?\d*\([^)]*\)/g;
    const logMatches = str.match(logs);

    if (logMatches) {
        for (let m of logMatches) {
            const inside = m.match(/\(([^)]*)\)/);
            if (inside && inside[1].trim() === '') {
                return false;
            }
        }
    }

    return true;
}

// операторы подряд
function hasInvalidOperators(str) {
    if (/[\+\*\/\^]{2,}/.test(str)) return true;
    if (/^[\+\*\/\^]/.test(str)) return true;
    if (/[\+\-\*\/\^]$/.test(str)) return true;
    return false;
}

// деление на 0
function checkDivisionByZero(str) {
    if (/\/\s*0(?!\d)/.test(str)) {
        return true;
    }
    return false;
}

// P в pi
function replacePi(str) {
    return str.replace(/P/g, '(' + Math.PI.toString() + ')');
}

// градусы в радианы
function degreesToRadians(deg) {
    return deg * (Math.PI / 180);
}

// считаем тригонометрию
function calculateTrig(func, angle, power) {
    // тангенс и котангенс не определены в некоторых точках
    if (func === 'tan') {
        const normalized = angle % 180;
        if (Math.abs(normalized - 90) < 0.0001 || Math.abs(normalized + 90) < 0.0001) {
            return 'undefined';
        }
    }
    if (func === 'ctg') {
        const normalized = angle % 180;
        if (Math.abs(normalized) < 0.0001) {
            return 'undefined';
        }
    }

    const rad = degreesToRadians(angle);
    let res;

    if (func === 'sin') {
        res = Math.sin(rad);
    } else if (func === 'cos') {
        res = Math.cos(rad);
    } else if (func === 'tan') {
        res = Math.tan(rad);
    } else if (func === 'ctg') {
        res = 1 / Math.tan(rad);
    } else {
        return null;
    }

    if (power !== 1) {
        res = Math.pow(res, power);
    }

    return res;
}

// считаем логарифмы
function calculateLog(base, val, power) {
    let res;

    if (val <= 0) {
        return null;
    }

    if (base === 'e') {
        res = Math.log(val);
    } else {
        res = Math.log(val) / Math.log(base);
    }

    if (power !== 1) {
        res = Math.pow(res, power);
    }

    return res;
}

// есть ли буквы-переменные 
function hasVariables(str) {
    const cleaned = str
        .replace(/sin|cos|tan|ctg|log|ln|Pi|P/g, '')
        .replace(/[0-9+\-*/()^.\s]/g, '');

    const allowed = /^[xyabi]*$/;
    return cleaned.length > 0 && allowed.test(cleaned) ? true : cleaned.length > 0;
}

// вычисляем выражение
function evaluateExpression(str) {
    try {
        str = str.replace(/\^/g, '**');
        const res = eval(str);
        return res;
    } catch (e) {
        return null;
    }
}

// вычисляем комплексные выражения
function evaluateComplexExpression(str, accuracy) {
    str = str.trim().replace(/\s+/g, '');

    // разбиваем на : числа, операторы, скобки, комплексные числа
    const tokens = [];
    let i = 0;

    while (i < str.length) {
        if (str[i] === ' ') {
            i++;
            continue;
        }

        if ('()+-*/^'.includes(str[i])) {
            tokens.push(str[i]);
            i++;
            continue;
        }

        let num = '';
        let start = i;

        if (str[i] === '-' || str[i] === '+') {
            num += str[i];
            i++;
        }

        while (i < str.length && (str[i].match(/[0-9.]/) || str[i] === 'i')) {
            num += str[i];
            i++;
            if (str[i-1] === 'i') break;
        }

        if (num.length === 1 && '+-'.includes(num)) {
            tokens.push(num);
            continue;
        }

        if (i < str.length && str[i] === 'i') {
            num += 'i';
            i++;
        }

        // проверяем формат a+bi или a-bi
        if (i < str.length && (str[i] === '+' || str[i] === '-')) {
            const signPos = i;
            i++;
            let imagPart = str[signPos];

            while (i < str.length && str[i].match(/[0-9.]/)) {
                imagPart += str[i];
                i++;
            }

            if (i < str.length && str[i] === 'i') {
                num += imagPart + 'i';
                i++;
            } else {
                i = signPos;
            }
        }

        if (num.length > 0) {
            tokens.push(num);
        }
    }

    if (tokens.length === 1) {
        const complex = parseComplexNumber(tokens[0]);
        if (complex !== null && Math.abs(complex.im) > 1e-10) {
            const roots = complexSqrt(complex.re, complex.im);
            return roots[0].toString(accuracy) + ", " + roots[1].toString(accuracy);
        }
        return null;
    }


    if (tokens.length === 3) {
        const left = parseComplexNumber(tokens[0]);
        const op = tokens[1];
        const right = parseComplexNumber(tokens[2]);

        if (left && right && '+-*/^'.includes(op)) {
            let result;
            if (op === '+') result = left.add(right);
            else if (op === '-') result = left.sub(right);
            else if (op === '*') result = left.mul(right);
            else if (op === '/') result = left.div(right);
            else if (op === '^') {
                // для степени нужно целое число
                if (Math.abs(right.im) < 1e-10 && Number.isInteger(right.re)) {
                    result = left.pow(right.re);
                }
            }

            if (result) {
                return result.toString(accuracy);
            }
        }
    }

    return null;
}

// парсим комплексные числа (2+3i)
function parseComplexNumber(str) {
    str = str.trim().replace(/\s+/g, '');

    if (str === 'i') return new Complex(0, 1);
    if (str === '-i') return new Complex(0, -1);

    const pattern1 = /^([+-]?\d+\.?\d*)\s*([+-])\s*(\d+\.?\d*)i$/;
    const match = str.match(pattern1);
    if (match) {
        const re = parseFloat(match[1]);
        const im = parseFloat(match[2] + match[3]);
        return new Complex(re, im);
    }

    const pattern2 = /^([+-]?\d+\.?\d*)\s*([+-])\s*i$/;
    const match2 = str.match(pattern2);
    if (match2) {
        const re = parseFloat(match2[1]);
        const im = match2[2] === '+' ? 1 : -1;
        return new Complex(re, im);
    }

    const pattern3 = /^([+-]?\d+\.?\d*)i$/;
    const match3 = str.match(pattern3);
    if (match3) {
        return new Complex(0, parseFloat(match3[1]));
    }

    const pattern4 = /^([+-]?\d+\.?\d*)$/;
    const match4 = str.match(pattern4);
    if (match4) {
        return new Complex(parseFloat(match4[1]), 0);
    }

    return null;
}

function complexSqrt(re, im) {
    const mod = Math.sqrt(re * re + im * im);
    const arg = Math.atan2(im, re);

    const sqrtMod = Math.sqrt(mod);
    const halfArg = arg / 2;

    const re1 = sqrtMod * Math.cos(halfArg);
    const im1 = sqrtMod * Math.sin(halfArg);

    const re2 = -re1;
    const im2 = -im1;

    return [
        new Complex(re1, im1),
        new Complex(re2, im2)
    ];
}

function formatComplexNumber(re, im, acc) {
    const signIm = im >= 0 ? "+" : "-";
    re = formatNumber(re, acc);
    im = formatNumber(Math.abs(im), acc);

    const reNum = parseFloat(re);
    const imNum = parseFloat(im);
    if (Math.abs(reNum) < 1e-10 && Math.abs(imNum) < 1e-10) return "0";
    if (Math.abs(reNum) < 1e-10) {
        if (Math.abs(imNum - 1) < 1e-10) return signIm === "+" ? "i" : "-i";
        return signIm === "+" ? im + "i" : "-" + im + "i";
    }
    if (Math.abs(imNum) < 1e-10) return re.toString();

    if (Math.abs(imNum - 1) < 1e-10) {
        return re + signIm + "i";
    }

    return re + signIm + im + "i";
}

// проверка символьных выражений
function checkSymbolic(str) {
    // переменная в степени 2: a^2
    if (/^[a-z]\^2$/.test(str)) {
        const v = str.charAt(0);
        return "|" + v + "|";
    }

    // переменная в другой степени: a^3, a^4
    const varPow = /^([a-z])\^(\d+)$/;
    const m1 = str.match(varPow);
    if (m1) {
        const v = m1[1];
        const p = parseInt(m1[2]);
        const half = p / 2;
        if (Number.isInteger(half)) {
            return "|" + v + "|^" + half;
        } else {
            const intP = Math.floor(half);
            if (intP >= 1) {
                return "|" + v + "|^" + intP + "·√(" + v + ")";
            } else {
                return "√(" + str + ")";
            }
        }
    }

    // sin^2(x), cos^2(y)
    if (/^(sin|cos|tan|ctg)\^2\([^)]+\)$/.test(str)) {
        const m = str.match(/^(sin|cos|tan|ctg)\^2\(([^)]+)\)$/);
        return "|" + m[1] + "(" + m[2] + ")|";
    }

    // sin^3(x) и тд с любыми числовыми степенями
    const trigPow = /^(sin|cos|tan|ctg)\^([\d.]+)\(([^)]+)\)$/;
    const m2 = str.match(trigPow);
    if (m2) {
        const func = m2[1];
        const p = parseFloat(m2[2]);
        const arg = m2[3];
        const half = p / 2;
        if (Number.isInteger(half)) {
            return "|" + func + "(" + arg + ")|^" + half;
        } else {
            const intP = Math.floor(half);
            if (intP >= 1) {
                return "|" + func + "(" + arg + ")|^" + intP + "·√(" + func + "(" + arg + "))";
            } else {
                return "√(" + str + ")";
            }
        }
    }

    // sin(x) без степени
    if (/^(sin|cos|tan|ctg)\([^)]+\)$/.test(str)) {
        return "√(" + str + ")";
    }

    // log2^2(x)
    if (/^log\d+\^2\([^)]+\)$/.test(str)) {
        const m = str.match(/^log(\d+)\^2\(([^)]+)\)$/);
        return "|log" + m[1] + "(" + m[2] + ")|";
    }

    // log2^3(x) и тд с любыми числовыми степенями
    const logPow = /^log(\d+)\^([\d.]+)\(([^)]+)\)$/;
    const m3 = str.match(logPow);
    if (m3) {
        const base = m3[1];
        const p = parseFloat(m3[2]);
        const arg = m3[3];
        const half = p / 2;
        if (Number.isInteger(half)) {
            return "|log" + base + "(" + arg + ")|^" + half;
        } else {
            const intP = Math.floor(half);
            if (intP >= 1) {
                return "|log" + base + "(" + arg + ")|^" + intP + "·√(log" + base + "(" + arg + "))";
            } else {
                return "√(" + str + ")";
            }
        }
    }

    // log2(x) без степени
    if (/^log\d+\([^)]+\)$/.test(str)) {
        return "√(" + str + ")";
    }

    // ln^2(x)
    if (/^ln\^2\([^)]+\)$/.test(str)) {
        const m = str.match(/^ln\^2\(([^)]+)\)$/);
        return "|ln(" + m[1] + ")|";
    }

    // ln^3(x) и тд с любыми числовыми степенями
    const lnPow = /^ln\^([\d.]+)\(([^)]+)\)$/;
    const m4 = str.match(lnPow);
    if (m4) {
        const p = parseFloat(m4[1]);
        const arg = m4[2];
        const half = p / 2;
        if (Number.isInteger(half)) {
            return "|ln(" + arg + ")|^" + half;
        } else {
            const intP = Math.floor(half);
            if (intP >= 1) {
                return "|ln(" + arg + ")|^" + intP + "·√(ln(" + arg + "))";
            } else {
                return "√(" + str + ")";
            }
        }
    }

    // ln(x) без степени
    if (/^ln\([^)]+\)$/.test(str)) {
        return "√(" + str + ")";
    }

    return null;
}

// основная функция обработки
function processInput(val, acc) {
    val = val.trim();

    // проверки
    if (val === "") {
        return {
            numeric: "Ошибка: введите выражение / Error: enter an expression",
            analytic: ""
        };
    }

    if (hasInvalidCharacters(val)) {
        return {
            numeric: "Ошибка: недопустимые символы в выражении / Error: invalid characters in the expression",
            analytic: ""
        };
    }

    if (!checkBrackets(val)) {
        return {
            numeric: "Ошибка: неправильно расставлены скобки / Error: mismatched parentheses",
            analytic: ""
        };
    }

    if (hasEmptyBrackets(val)) {
        return {
            numeric: "Ошибка: пустые скобки в выражении / Error: empty parentheses in the expression",
            analytic: ""
        };
    }

    if (!checkFunctionFormat(val)) {
        return {
            numeric: "Ошибка: неправильный формат функции / Error: invalid function format",
            analytic: ""
        };
    }

    if (hasInvalidOperators(val)) {
        return {
            numeric: "Ошибка: неправильная последовательность операторов / Error: invalid operator sequence",
            analytic: ""
        };
    }

    if (checkDivisionByZero(val)) {
        return {
            numeric: "Ошибка: деление на ноль / Error: division by zero",
            analytic: ""
        };
    }

    const original = val;
    val = replacePi(val);

    
    if (/\bi\b|\di|i\d/.test(val)) {
        const complexResult = evaluateComplexExpression(val, acc);
        if (complexResult !== null) {
            return {
                numeric: complexResult,
                analytic: ""
            };
        }
    }

    // проверка на символьные
    if (hasVariables(original)) {
        const symb = checkSymbolic(original);
        if (symb) {
            return {
                numeric: symb,
                analytic: ""
            };
        }
        // проверка на невалидные выражения
        const cleaned = original
            .replace(/sin|cos|tan|ctg|log|ln|Pi/g, '')
            .replace(/[0-9+\-*/()^.\s]/g, '');
        const allowed = /^[xyabi]*$/;
        if (cleaned.length > 0 && !allowed.test(cleaned)) {
            return {
                numeric: "Ошибка: недопустимые символы в выражении / Error: invalid characters in the expression",
                analytic: ""
            };
        }
        // если не подошло под паттерны - просто корень
        return {
            numeric: "√(" + original + ")",
            analytic: ""
        };
    }

    // комплексные числа типа 2+3i (только если есть мнимая часть)
    const complex = parseComplexNumber(val);
    if (complex !== null && Math.abs(complex.im) > 1e-10) {
        const roots = complexSqrt(complex.re, complex.im);
        const r1 = roots[0].toString(acc);
        const r2 = roots[1].toString(acc);

        return {
            numeric: r1 + ", " + r2,
            analytic: ""
        };
    }

    // тригонометрия
    const trigPat = /(sin|cos|tan|ctg)(\^([\d.]+))?\(([^)]+)\)/g;
    let processed = val;

    processed = processed.replace(trigPat, function(match, func, powerPart, power, angle) {
        power = power ? parseFloat(power) : 1;

        let angleVal;
        try {
            angleVal = evaluateExpression(angle.replace(/\^/g, '**'));
            if (angleVal === null || isNaN(angleVal) || !isFinite(angleVal)) {
                return match;
            }
        } catch (e) {
            return match;
        }

        const result = calculateTrig(func, angleVal, power);
        if (result === 'undefined') {
            return 'UNDEF_TRIG';
        }
        if (result === null || isNaN(result) || !isFinite(result)) {
            return match;
        }
        return result.toString();
    });

    // логарифмы
    const logPat = /ln(\^([\d.]+))?\(([^)]+)\)|log(\d+)(\^([\d.]+))?\(([^)]+)\)/g;

    processed = processed.replace(logPat, function(match, lnPow1, lnPow2, lnVal, base, logPow1, logPow2, logVal) {
        if (match.startsWith('ln')) {
            const pow = lnPow2 ? parseFloat(lnPow2) : 1;
            const v = evaluateExpression(lnVal.replace(/\^/g, '**'));

            if (v === null || isNaN(v) || !isFinite(v)) {
                return match;
            }

            const result = calculateLog('e', v, pow);
            if (result === null || isNaN(result) || !isFinite(result)) {
                return match;
            }
            return result.toString();
        } else {
            const pow = logPow2 ? parseFloat(logPow2) : 1;
            const v = evaluateExpression(logVal.replace(/\^/g, '**'));
            base = parseInt(base);

            if (v === null || isNaN(v) || !isFinite(v) || base <= 0 || base === 1) {
                return match;
            }

            const result = calculateLog(base, v, pow);
            if (result === null || isNaN(result) || !isFinite(result)) {
                return match;
            }
            return result.toString();
        }
    });

    // вычисляем
    try {
        const num = evaluateExpression(processed);

        if (num === null || isNaN(num)) {
            return {
                numeric: "Ошибка: не удалось вычислить выражение / Error: unable to evaluate the expression",
                analytic: ""
            };
        }

        if (!isFinite(num)) {
            return {
                numeric: "Ошибка: результат слишком большой (бесконечность) / Error: the result is too large (infinity)",
                analytic: ""
            };
        }

        // проверка на несуществующую тригонометрию
        if (processed.includes('UNDEF_TRIG')) {
            return {
                numeric: "Ошибка: такого тангенса или котангенса не существует / Error: this tangent or cotangent is undefined",
                analytic: ""
            };
        }

        // корень из нуля
        if (num === 0) {
            return {
                numeric: "0",
                analytic: "0"
            };
        }

        // положительные числа
        if (num > 0) {
            const root = Math.sqrt(num);

            if (isNaN(root) || !isFinite(root)) {
                return {
                    numeric: "Ошибка: не удалось вычислить корень / Error: unable to calculate the root",
                    analytic: ""
                };
            }

            const numVal = formatNumber(root, acc);

            // целый корень
            if (Number.isInteger(root)) {
                return {
                    numeric: numVal.toString(),
                    analytic: ""
                };
            }

            // нецелый - аналитическая форма
            let analVal = "";
            if (Number.isInteger(num) && num < 1000000) {
                analVal = analyticSqrt(num);
            }

            return {
                numeric: numVal.toString(),
                analytic: analVal
            };
        }

        // отрицательные числа
        if (num < 0) {
            const pos = Math.abs(num);
            const imgRoot = Math.sqrt(pos);
            const numVal = formatNumber(imgRoot, acc);

            let analVal = "";
            if (Number.isInteger(pos) && pos < 1000000) {
                analVal = analyticSqrtNegative(num);
            }

            // упрощаем 1i -> i
            const coef = parseFloat(numVal);
            let result1, result2;
            if (Math.abs(coef - 1) < 1e-10) {
                result1 = "i";
                result2 = "-i";
            } else {
                result1 = numVal + "i";
                result2 = "-" + numVal + "i";
            }

            return {
                numeric: result1 + ", " + result2,
                analytic: analVal ? analVal + ", -" + analVal : ""
            };
        }

    } catch (e) {
        return {
            numeric: "Ошибка: не удалось обработать выражение / Error: unable to process the expression",
            analytic: ""
        };
    }
}

// обработчик кнопки
calculateButton.addEventListener("click", function () {
    const inputValue = input.value.trim();
    let accuracy = Number(accuracyInput.value);

    if (inputValue === "") {
        numericResult.textContent = "Введите выражение / Enter an expression";
        analyticResult.textContent = "";
        return;
    }

    if (Number.isNaN(accuracy) || accuracy < 0) {
        accuracy = 0;
    }
    if (accuracy > 150) {
        accuracy = 150;
    }

    const result = processInput(inputValue, accuracy);

    numericResult.innerHTML = result.numeric;
    analyticResult.innerHTML = result.analytic;
});
