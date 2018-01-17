
function getOperator(blockType) {
    if (blockType == BlockTypes.Equals) {
        return (a, b) => a == b;
    } else if (blockType == BlockTypes.Add) {
        return (a, b) => a + b;
    } else if (blockType == BlockTypes.Subtract) {
        return (a, b) => a - b;
    } else if (blockType == BlockTypes.Multiply) {
        return (a, b) => a * b;
    } else if (blockType == BlockTypes.Divide) {
        return (a, b) => a / b;
    } else if (blockType == BlockTypes.Exponent) {
        return (a, b) => Math.pow(a, b);
    }
}