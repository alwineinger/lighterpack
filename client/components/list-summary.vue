<style lang="scss">

.lpListSummary {
    align-items: flex-start;
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
}

.lpChartContainer {
    flex: 0 0 260px;
}

.lpChart {
    display: block;
    max-width: 100%;
}

.lpTotalsContainer {
    flex: 1 1 320px;
    min-width: 0;
}

.lpLegend {
    &:hover {
        border-color: #666;
        cursor: pointer;
    }
}

.lpTotalUnitSelect {
    margin-left: 3px;
}

@media (max-width: 900px) {
    .lpListSummary {
        flex-direction: column;
        gap: 15px;
    }

    .lpChartContainer {
        flex: 0 0 auto;
        margin: 0 auto;
        max-width: 320px;
        width: 100%;
    }

    .lpTotalsContainer {
        width: 100%;
    }
}

@media (max-width: 900px) and (orientation: landscape) {
    .lpListSummary {
        flex-direction: row;
        align-items: flex-start;
    }

    .lpChartContainer {
        max-width: 220px;
    }

    .lpTotalsContainer {
        flex: 1 1 auto;
    }
}
</style>

<template>
    <div v-if="showTotals || showChart" class="lpListSummary" :class="{lpChartOnly: !showTotals}">
        <div v-if="showChart" class="lpChartContainer">
            <canvas ref="chartCanvas" class="lpChart" height="260" width="260" />
        </div>
        <div v-if="showTotals" class="lpTotalsContainer">
            <ul class="lpTotals lpTable lpDataTable">
                <li class="lpRow lpHeader">
                    <span class="lpCell">&nbsp;</span>
                    <span class="lpCell">
                        Category
                    </span>
                    <span v-if="library.optionalFields['price']" class="lpCell">
                        Price
                    </span>
                    <span class="lpCell">
                        Weight
                    </span>
                </li>
                <li v-for="category in categories" :key="category.id" :class="{'hover': category.activeHover, 'lpTotalCategory lpRow': true}">
                    <span class="lpCell lpLegendCell">
                        <colorPicker v-if="category.displayColor" :color="colorToHex(category.displayColor)" @colorChange="updateColor(category, $event)" />
                    </span>
                    <span class="lpCell">
                        {{ category.name }}
                    </span>
                    <span v-if="library.optionalFields['price']" class="lpCell lpNumber">
                        {{ category.subtotalPrice | displayPrice(library.currencySymbol) }}
                    </span>
                    <span class="lpCell lpNumber">
                        <span class="lpDisplaySubtotal" :mg="category.subtotalWeight">{{ category.subtotalWeight | displayWeight(library.totalUnit) }}</span> <span class="lpSubtotalUnit">{{ library.totalUnit | displayUnit }}</span>
                    </span>
                </li>
                <li class="lpRow lpFooter lpTotal">
                    <span class="lpCell" />
                    <span class="lpCell lpSubtotal" :title="list.totalQty +' items'">
                        Total
                    </span>
                    <span v-if="library.optionalFields['price']" class="lpCell lpNumber lpSubtotal" :title="list.totalQty +' items'">
                        {{ list.totalPrice | displayPrice(library.currencySymbol) }}
                    </span>
                    <span class="lpCell lpNumber lpSubtotal" :title="list.totalQty +' items'">
                        <span class="lpDisplaySubtotal">{{ list.totalWeight | displayWeight(library.totalUnit) }}</span>
                        <unitSelect class="lpTotalUnitSelect" :unit="library.totalUnit" :on-change="setTotalUnit" />
                    </span>
                </li>
                <li v-if="consumableWeight > 0" data-weight-type="consumable" class="lpRow lpFooter lpBreakdown lpConsumableWeight">
                    <span class="lpCell" />
                    <span class="lpCell lpSubtotal">
                        Consumable
                    </span>
                    <span v-if="library.optionalFields['price']" class="lpCell" />
                    <span class="lpCell lpNumber lpSubtotal">
                        <span class="lpDisplaySubtotal" :mg="consumableWeight">{{ consumableWeight | displayWeight(library.totalUnit) }}</span> <span class="lpSubtotalUnit">{{ library.totalUnit | displayUnit }}</span>
                    </span>
                </li>
                <li v-if="wornWeight > 0" data-weight-type="worn" class="lpRow lpFooter lpBreakdown lpWornWeight">
                    <span class="lpCell" />
                    <span class="lpCell lpSubtotal">
                        Worn
                    </span>
                    <span v-if="library.optionalFields['price']" class="lpCell" />
                    <span class="lpCell lpNumber lpSubtotal">
                        <span class="lpDisplaySubtotal" :mg="wornWeight">{{ wornWeight | displayWeight(library.totalUnit) }}</span> <span class="lpSubtotalUnit">{{ library.totalUnit | displayUnit }}</span>
                    </span>
                </li>
                <li v-if="showBaseWeight" data-weight-type="base" class="lpRow lpFooter lpBreakdown lpPackWeight">
                    <span class="lpCell" />
                    <span class="lpCell lpSubtotal">
                        Base Weight
                    </span>
                    <span v-if="library.optionalFields['price']" class="lpCell" />
                    <span class="lpCell lpNumber lpSubtotal">
                        <span class="lpDisplaySubtotal" :mg="baseWeight">{{ baseWeight | displayWeight(library.totalUnit) }}</span> <span class="lpSubtotalUnit">{{ library.totalUnit | displayUnit }}</span>
                    </span>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import colorPicker from './colorpicker.vue';
import unitSelect from './unit-select.vue';

const pies = require('../pies.js');
const utilsMixin = require('../mixins/utils-mixin.js');
const colorUtils = require('../utils/color.js');

export default {
    name: 'ListSummary',
    components: {
        colorPicker,
        unitSelect,
    },
    mixins: [utilsMixin],
    props: {
        list: {
            type: Object,
            required: true,
        },
        showTotals: {
            type: Boolean,
            default: true,
        },
        showChart: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        return {
            chart: null,
            hoveredCategoryId: null,
            chartSize: 260,
        };
    },
    computed: {
        library() {
            return this.$store.state.library;
        },
        categories() {
            return this.list.categoryIds.map((id) => {
                const category = this.library.getCategoryById(id);
                category.activeHover = (this.hoveredCategoryId === category.id);
                return category;
            });
        },
        showBaseWeight() {
            return this.baseWeight !== this.list.totalWeight;
        },
        consumableWeight() {
            return this.categories.reduce((total, category) => total + (category.subtotalConsumableWeight || 0), 0);
        },
        wornWeight() {
            return this.categories.reduce((total, category) => total + (category.subtotalWornWeight || 0), 0);
        },
        baseWeight() {
            return this.list.totalWeight - (this.wornWeight + this.consumableWeight);
        },
    },
    watch: {
        '$store.state.library.defaultListId': 'updateChart',
        'list.totalWeight': 'updateChart',
        'list.categoryIds': 'updateChart',
    },
    mounted() {
        this.updateChart();
        window.addEventListener('resize', this.updateChart);
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.updateChart);
    },
    methods: {
        updateChart(type) {
            const canvas = this.$refs.chartCanvas;
            if (canvas) {
                if (!this.showChart) {
                    return null;
                }
                const maxWidth = 260;
                const minWidth = 180;
                const containerWidth = Math.floor(Math.min(maxWidth, Math.max(minWidth, this.$el.clientWidth * 0.9)));
                if (this.chartSize !== containerWidth) {
                    this.chartSize = containerWidth;
                    canvas.width = containerWidth;
                    canvas.height = containerWidth;
                    this.chart = null;
                }
            }
            const chartData = this.library.renderChart(type);

            if (chartData) {
                if (this.chart) {
                    this.chart.update({ processedData: chartData });
                } else if (this.$refs.chartCanvas) {
                    this.chart = pies({ processedData: chartData, container: this.$refs.chartCanvas, hoverCallback: this.chartHover });
                }
            }
            return chartData;
        },
        chartHover(chartItem) {
            if (chartItem && chartItem.id) {
                this.hoveredCategoryId = chartItem.id;
            } else {
                this.hoveredCategoryId = null;
            }
        },
        setTotalUnit(unit) {
            this.$store.commit('setTotalUnit', unit);
        },
        updateColor(category, color) {
            category.color = colorUtils.hexToRgb(color);
            category.displayColor = colorUtils.rgbToString(colorUtils.hexToRgb(color));
            this.$store.commit('updateCategoryColor', category);
            this.updateChart();
        },
        colorToHex(color) {
            return colorUtils.rgbToHex(colorUtils.stringToRgb(color));
        },
    },
};

</script>
