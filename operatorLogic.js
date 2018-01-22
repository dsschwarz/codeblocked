
function getOperator(blockType) {
    if (blockType == Operators.Equals) {
        return (a, b) => a == b;
    } else if (blockType == Operators.GreaterThan) {
        return (a, b) => a > b;
    } else if (blockType == Operators.LessThan) {
        return (a, b) => a < b;
    } else if (blockType == Operators.Add) {
        return (a, b) => a + b;
    } else if (blockType == Operators.Subtract) {
        return (a, b) => a - b;
    } else if (blockType == Operators.Multiply) {
        return (a, b) => a * b;
    } else if (blockType == Operators.Divide) {
        return (a, b) => a / b;
    } else if (blockType == Operators.Exponent) {
        return (a, b) => Math.pow(a, b);
    }
}