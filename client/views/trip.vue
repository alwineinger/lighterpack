<template>
    <div v-if="trip" class="lpTripView">
        <div class="lpTripHeader">
            <router-link class="lpHref" to="/">
                Back to list
            </router-link>
            <h1>{{ trip.name }}</h1>
        </div>

        <div v-if="trip.canManage" class="lpTripInvite">
            <input v-model="invite.email" type="email" placeholder="Invite email">
            <select v-model="invite.role">
                <option value="editor">
                    Editor
                </option>
                <option value="viewer">
                    Viewer
                </option>
            </select>
            <button class="lpButton lpSmall" @click="sendInvite">
                Invite
            </button>
        </div>

        <h2>Shared lists</h2>
        <ul>
            <li v-for="member in trip.members" :key="member.userId || member.email">
                <strong>{{ member.username || member.email }}</strong> — {{ member.role }}
                <span v-if="member.listName"> • {{ member.listName }} ({{ member.visibility }})</span>
            </li>
        </ul>

        <h2>Group Gear</h2>
        <div class="lpListSummary lpTripSummary">
            <div class="lpChartContainer">
                <canvas ref="chartCanvas" class="lpChart" height="260" width="260" />
            </div>
            <div class="lpTotalsContainer">
                <ul class="lpTotals lpTable lpDataTable">
                    <li class="lpRow lpHeader">
                        <span class="lpCell">User</span>
                        <span class="lpCell">Weight</span>
                    </li>
                    <li v-for="group in sortedGroups" :key="group.userKey" class="lpRow lpTotalCategory">
                        <span class="lpCell">{{ group.label }}</span>
                        <span class="lpCell lpNumber">
                            {{ group.totalWeightMg | displayWeight(library.totalUnit) }} {{ library.totalUnit }}
                        </span>
                    </li>
                    <li class="lpRow lpFooter lpTotal">
                        <span class="lpCell lpSubtotal">Total</span>
                        <span class="lpCell lpNumber lpSubtotal">
                            {{ totalGroupWeightMg | displayWeight(library.totalUnit) }}
                            <unitSelect class="lpTotalUnitSelect" :unit="library.totalUnit" :on-change="setTotalUnit" />
                        </span>
                    </li>
                </ul>
                <p class="lpTripChartHint">
                    Click a user slice to break out individual group items.
                </p>
            </div>
        </div>
        <div v-for="group in trip.groupGearByUser" :key="group.userKey" class="lpTripGroupPanel">
            <h3>{{ group.label }} — {{ group.totalWeightMg | displayWeight(library.totalUnit) }} {{ library.totalUnit }}</h3>
            <ul>
                <li v-for="item in group.items" :key="item.itemId + '-' + item.categoryId">
                    {{ item.name }} ({{ item.categoryName }}) × {{ item.qty }} — {{ item.weightMg | displayWeight(library.totalUnit) }} {{ library.totalUnit }}
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import { acceptTripInvitation, inviteTripUser, loadTrip } from '../api/mobile-api';
import unitSelect from '../components/unit-select.vue';

const pies = require('../pies.js');
const utilsMixin = require('../mixins/utils-mixin.js');

export default {
    name: 'TripView',
    components: {
        unitSelect,
    },
    mixins: [utilsMixin],
    data() {
        return {
            trip: null,
            chart: null,
            chartSize: 260,
            invite: {
                email: '',
                role: 'editor',
            },
        };
    },
    computed: {
        library() {
            return this.$store.state.library;
        },
        sortedGroups() {
            return ((this.trip && this.trip.groupGearByUser) || []).slice().sort((a, b) => b.totalWeightMg - a.totalWeightMg);
        },
        totalGroupWeightMg() {
            return this.sortedGroups.reduce((sum, group) => sum + group.totalWeightMg, 0);
        },
    },
    watch: {
        sortedGroups: {
            handler() {
                this.$nextTick(this.updateChart);
            },
            deep: true,
        },
    },
    mounted() {
        this.refresh();
        window.addEventListener('resize', this.updateChart);
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.updateChart);
    },
    methods: {
        refresh() {
            loadTrip(this.$route.params.tripId).then((trip) => {
                this.trip = trip;
                this.$nextTick(this.updateChart);
                const pendingInvite = trip.pendingInvitation;
                if (pendingInvite) {
                    const listIdRaw = window.prompt('Select list id to share with this trip', this.$store.state.library.defaultListId);
                    if (!listIdRaw) {
                        return;
                    }
                    const visibility = window.confirm('Share full details? Click Cancel for category + total only.') ? 'full' : 'summary';
                    acceptTripInvitation(trip.id, {
                        inviteToken: pendingInvite.token,
                        listId: parseInt(listIdRaw, 10),
                        visibility,
                    }).then(() => this.refresh());
                }
            });
        },
        sendInvite() {
            if (!this.invite.email) {
                return;
            }
            inviteTripUser(this.trip.id, this.invite).then(() => {
                this.invite.email = '';
                this.invite.role = 'editor';
                this.refresh();
            });
        },
        setTotalUnit(unit) {
            this.$store.commit('setTotalUnit', unit);
        },
        getChartData() {
            const points = {};

            this.sortedGroups.forEach((group) => {
                const userPoint = {
                    id: group.userKey,
                    name: group.label,
                    total: group.totalWeightMg,
                    points: {},
                };

                group.items.forEach((item) => {
                    const key = `${item.itemId}-${item.categoryId}`;
                    userPoint.points[key] = {
                        id: key,
                        name: `${item.name} (${item.categoryName})`,
                        total: item.weightMg,
                        percent: group.totalWeightMg ? item.weightMg / group.totalWeightMg : 0,
                    };
                });

                points[group.userKey] = {
                    ...userPoint,
                    percent: this.totalGroupWeightMg ? group.totalWeightMg / this.totalGroupWeightMg : 0,
                };
            });

            return {
                total: this.totalGroupWeightMg,
                points,
            };
        },
        updateChart() {
            const canvas = this.$refs.chartCanvas;
            if (!canvas || !this.trip) {
                return;
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

            const chartData = this.getChartData();
            if (!chartData.total) {
                return;
            }

            if (this.chart) {
                this.chart.update({ processedData: chartData });
            } else {
                this.chart = pies({ processedData: chartData, container: canvas });
            }
        },
    },
};
</script>

<style lang="scss">
.lpTripView {
    padding: 20px;
}

.lpTripHeader {
    align-items: center;
    display: flex;
    gap: 12px;
}

.lpTripGroupPanel {
    border: 1px solid #ccc;
    margin-bottom: 12px;
    padding: 10px;
}

.lpTripSummary {
    margin-bottom: 20px;
}

.lpTripChartHint {
    color: #666;
    font-size: 13px;
    margin-top: 10px;
}

.lpTripInvite {
    display: flex;
    gap: 8px;
    margin: 10px 0 20px;
}
</style>
