const hashCode = function(value) {
    let hash = 0x5555555a;

    if (value.length == 0) return hash;

    for (let i = 0; i < value.length; i++) {
        let char = value.charCodeAt(i);
        hash = ((hash << 5)  - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);

};

module.exports = hashCode;