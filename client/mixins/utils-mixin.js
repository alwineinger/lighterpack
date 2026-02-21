const weightUtils = require('../utils/weight.js');

const utilsMixin = {
    data() {
        return {

        };
    },
    methods: {
    },
    filters: {
        displayWeight(mg, unit) {
            return weightUtils.MgToWeight(mg, unit) || 0;
        },
        displayUnit(unit) {
            return unit === 'lbs-oz' ? '' : unit;
        },
        displayPrice(price, symbol) {
            let amount = '0.00';
            if (typeof price === 'number') {
                amount = price.toFixed(2);
            }
            return symbol + amount;
        },
    },
};

module.exports = utilsMixin;
