module.exports = (function () {
    function parseLbsOz(input) {
        if (typeof input === 'number') {
            return input;
        }
        if (input === null || typeof input === 'undefined') {
            return NaN;
        }

        const raw = String(input).trim().toLowerCase();
        if (!raw) {
            return NaN;
        }

        let pounds = 0;
        let ounces = 0;
        const lbMatch = raw.match(/(-?\d+(\.\d+)?)\s*lb/);
        const ozMatch = raw.match(/(-?\d+(\.\d+)?)\s*oz/);

        if (lbMatch) {
            pounds = parseFloat(lbMatch[1]);
        }
        if (ozMatch) {
            ounces = parseFloat(ozMatch[1]);
        }

        if (!lbMatch && !ozMatch) {
            const colonParts = raw.split(':');
            if (colonParts.length === 2) {
                pounds = parseFloat(colonParts[0]);
                ounces = parseFloat(colonParts[1]);
            } else {
                const asNumber = parseFloat(raw);
                if (isNaN(asNumber)) {
                    return NaN;
                }
                pounds = asNumber;
            }
        }

        if (isNaN(pounds) || isNaN(ounces)) {
            return NaN;
        }

        return pounds + (ounces / 16);
    }

    function WeightToMg(value, unit) {
        if (unit == 'g') {
            return value * 1000;
        } if (unit == 'kg') {
            return value * 1000000;
        } if (unit == 'oz') {
            return value * 28349.5;
        } if (unit == 'lbs-oz') {
            const pounds = parseLbsOz(value);
            if (isNaN(pounds)) {
                return undefined;
            }
            return pounds * 453592;
        } if (unit == 'lb') {
            return value * 453592;
        }
    }

    function MgToWeight(value, unit, display) {
        if (typeof display === 'undefined') display = false;
        if (unit == 'g') {
            return Math.round(100 * value / 1000.0) / 100;
        } if (unit == 'kg') {
            return Math.round(100 * value / 1000000.0, 2) / 100;
        } if (unit == 'oz') {
            return Math.round(100 * value / 28349.5, 2) / 100;
        } if (unit == 'lbs-oz') {
            const poundsFloat = value / 453592.0;
            const pounds = Math.floor(poundsFloat);
            let ounces = Math.round((poundsFloat - pounds) * 16 * 100) / 100;
            if (ounces >= 16) {
                ounces = 0;
                return `${pounds + 1} lb 0 oz`;
            }
            const ounceText = (ounces % 1 === 0) ? ounces.toString() : ounces.toFixed(2);
            return `${pounds} lb ${ounceText} oz`;
        } if (unit == 'lb') {
            if (display) {
                let out = '';
                const poundsFloat = value / 453592.0;
                const pounds = Math.floor(poundsFloat);
                const oz = Math.round((poundsFloat % 1) * 16 * 100) / 100;
                if (pounds) {
                    out += 'lb';
                    if (pounds > 1) out += 's';
                }
            } else {
                return Math.round(100 * value / 453592.0, 2) / 100;
            }
        }
    }

    function MgToWeightNumber(value, unit) {
        if (unit === 'lbs-oz') {
            return value / 453592.0;
        }
        return MgToWeight(value, unit);
    }

    function ParseWeightInput(value, unit) {
        if (unit === 'lbs-oz') {
            return parseLbsOz(value);
        }
        return parseFloat(value, 10);
    }

    return {
        WeightToMg,
        MgToWeight,
        MgToWeightNumber,
        ParseWeightInput,
    };
}());
