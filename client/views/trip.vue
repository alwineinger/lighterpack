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

        <div class="lpTripSectionHeader lpTripSharedListsSection">
            <h2>Shared lists</h2>
            <div v-if="currentUserListChoices.length" class="lpTripListSelector">
                <label for="trip-shared-list">Your shared list:</label>
                <select id="trip-shared-list" :value="selectedSharedListId" @change="onSharedListChange">
                    <option v-for="list in currentUserListChoices" :key="list.id" :value="list.id">
                        {{ list.name }}
                    </option>
                </select>
                <label for="trip-shared-visibility">Share level:</label>
                <select id="trip-shared-visibility" :value="selectedVisibility" @change="onVisibilityChange">
                    <option value="summary">
                        Summary
                    </option>
                    <option value="full">
                        All items
                    </option>
                </select>
            </div>
        </div>

        <div class="lpTripSectionHeader">
            <h2>Shared content</h2>
        </div>
        <div v-for="member in sortedMembers" :key="member.userId || member.email" class="lpTripGroupPanel">
            <h3>{{ member.username || member.email }} — {{ member.listName || 'No shared list' }} ({{ member.visibility }})</h3>
            <div v-if="member.sharedContent && member.sharedContent.categories && member.sharedContent.categories.length" class="lpTripSharedSummary">
                <ul class="lpTotals lpTable lpDataTable">
                    <li class="lpRow lpHeader">
                        <span class="lpCell">&nbsp;</span>
                        <span class="lpCell">Category</span>
                        <span class="lpCell">Weight</span>
                    </li>
                    <li v-for="category in member.sharedContent.categories" :key="category.categoryId" class="lpTotalCategory lpRow">
                        <span class="lpCell lpLegendCell">
                            <span class="lpLegend" :style="{ 'background-color': category.categoryColor || '#999' }" />
                        </span>
                        <span class="lpCell">
                            {{ category.categoryName }}
                        </span>
                        <span class="lpCell lpNumber">
                            <span class="lpDisplaySubtotal">{{ category.totalWeightMg | displayWeight(library.totalUnit) }}</span>
                            <span class="lpSubtotalUnit">{{ library.totalUnit }}</span>
                        </span>
                    </li>
                    <li class="lpRow lpFooter lpTotal">
                        <span class="lpCell" />
                        <span class="lpCell lpSubtotal" :title="getSharedTotalItemCount(member) + ' items'">Total</span>
                        <span class="lpCell lpNumber lpSubtotal" :title="getSharedTotalItemCount(member) + ' items'">
                            <span class="lpDisplaySubtotal">{{ getSharedTotalWeight(member) | displayWeight(library.totalUnit) }}</span>
                            <span class="lpSubtotalUnit">{{ library.totalUnit }}</span>
                        </span>
                    </li>
                </ul>
            </div>
            <div v-if="isFullSharedContent(member)">
                <div v-for="category in member.sharedContent.categories" :key="'items-' + category.categoryId" class="lpTripSharedCategoryItems">
                    <h4>
                        {{ category.categoryName }} — {{ category.totalWeightMg | displayWeight(library.totalUnit) }} {{ library.totalUnit }}
                    </h4>
                    <ul v-if="category.items && category.items.length">
                        <li v-for="item in category.items" :key="item.itemId + '-' + item.categoryId + '-' + item.name">
                            {{ item.name }} × {{ item.qty }} — {{ item.weightMg | displayWeight(library.totalUnit) }} {{ library.totalUnit }}
                        </li>
                    </ul>
                    <p v-else>
                        No items in this category.
                    </p>
                </div>
            </div>
            <p v-else-if="!member.sharedContent || !member.sharedContent.categories || !member.sharedContent.categories.length">
                No shared items yet.
            </p>
        </div>
        <ul>
            <li v-for="member in trip.members" :key="member.userId || member.email">
                <strong>{{ member.username || member.email }}</strong> — {{ member.role }}
                <span v-if="member.listName"> • {{ member.listName }} ({{ member.visibility }})</span>
            </li>
        </ul>
    </div>
</template>

<script>
import {
    acceptTripInvitation, inviteTripUser, loadTrip, updateTripMemberList,
} from '../api/mobile-api';
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
            selectedSharedListId: null,
            selectedVisibility: 'full',
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

        currentUserListChoices() {
            const availableLists = this.$store.state.library.lists || [];
            return availableLists.map((list) => {
                const trimmedName = list.name && list.name.trim();
                return {
                    id: list.id,
                    name: trimmedName || `Untitled list #${list.id}`,
                };
            });
        },
        sortedMembers() {
            return ((this.trip && this.trip.members) || []).slice().sort((a, b) => {
                const aName = (a.username || a.email || '').toLowerCase();
                const bName = (b.username || b.email || '').toLowerCase();
                return aName.localeCompare(bName);
            });
        },
    },
    watch: {
        sortedGroups: {
            handler() {
                this.$nextTick(this.updateChart);
            },
            deep: true,
        },
        '$store.state.syncToken': function () {
            this.refresh();
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
                this.selectedSharedListId = trip.currentUserMember ? trip.currentUserMember.listId : null;
                this.selectedVisibility = trip.currentUserMember ? trip.currentUserMember.visibility : 'full';
                this.$nextTick(this.updateChart);
                const pendingInvite = trip.pendingInvitation;
                if (pendingInvite) {
                    const availableLists = this.$store.state.library.lists || [];
                    const listChoices = availableLists.map((list) => {
                        const name = list.name && list.name.trim() ? list.name.trim() : `Untitled list #${list.id}`;
                        return {
                            id: list.id,
                            name,
                        };
                    });

                    if (!listChoices.length) {
                        return;
                    }

                    const defaultListId = this.$store.state.library.defaultListId;
                    const defaultList = listChoices.find((list) => list.id === defaultListId) || listChoices[0];
                    const listNameRaw = window.prompt(
                        `Select a list to share with this trip:\n${listChoices.map((list) => `• ${list.name}`).join('\n')}`,
                        defaultList.name,
                    );

                    if (!listNameRaw) {
                        return;
                    }

                    const selectedList = listChoices.find((list) => list.name.toLowerCase() === listNameRaw.trim().toLowerCase());
                    if (!selectedList) {
                        return;
                    }

                    const visibility = window.confirm('Share full details? Click Cancel for category + total only.') ? 'full' : 'summary';
                    acceptTripInvitation(trip.id, {
                        inviteToken: pendingInvite.token,
                        listId: selectedList.id,
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

        updateSharedSettings(payload) {
            if (!this.trip) {
                return Promise.resolve();
            }
            return updateTripMemberList(this.trip.id, payload).then(() => {
                this.selectedSharedListId = payload.listId;
                this.selectedVisibility = payload.visibility;
                this.refresh();
            });
        },
        onSharedListChange(event) {
            const listId = parseInt(event.target.value, 10);
            if (Number.isNaN(listId) || listId === this.selectedSharedListId || !this.trip) {
                return;
            }
            this.updateSharedSettings({
                listId,
                visibility: this.selectedVisibility,
            });
        },
        onVisibilityChange(event) {
            const visibility = event.target.value === 'summary' ? 'summary' : 'full';
            if (visibility === this.selectedVisibility || !this.trip || !this.selectedSharedListId) {
                return;
            }
            this.updateSharedSettings({
                listId: this.selectedSharedListId,
                visibility,
            });
        },
        getSharedTotalWeight(member) {
            const totals = member && member.sharedContent && member.sharedContent.totals;
            return totals ? totals.totalWeightMg : 0;
        },
        getSharedTotalItemCount(member) {
            const totals = member && member.sharedContent && member.sharedContent.totals;
            return totals ? totals.totalItemCount : 0;
        },
        isFullSharedContent(member) {
            return !!(member && member.sharedContent && member.sharedContent.mode === 'full' && member.sharedContent.categories && member.sharedContent.categories.length);
        },

        setTotalUnit(unit) {
            this.$store.commit('setTotalUnit', unit);
        },
        getChartData() {
            const chartData = {
                total: this.totalGroupWeightMg,
                points: {},
            };

            this.sortedGroups.forEach((group) => {
                const userPoint = {
                    id: group.userKey,
                    name: group.label,
                    total: group.totalWeightMg,
                    points: {},
                    parent: chartData,
                };

                group.items.forEach((item, index) => {
                    const key = `${item.itemId}-${item.categoryId}-${index}`;
                    userPoint.points[key] = {
                        id: key,
                        name: `${item.name} (${item.categoryName})`,
                        total: item.weightMg,
                        percent: group.totalWeightMg ? item.weightMg / group.totalWeightMg : 0,
                        parent: userPoint,
                    };
                });

                chartData.points[group.userKey] = {
                    ...userPoint,
                    percent: this.totalGroupWeightMg ? group.totalWeightMg / this.totalGroupWeightMg : 0,
                };
            });

            return chartData;
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

.lpTripSectionHeader {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: space-between;
}

.lpTripSharedListsSection {
    margin-top: 24px;
}

.lpTripListSelector {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.lpTripSharedSummary {
    margin-bottom: 12px;
}

.lpTripSharedCategoryItems {
    margin-top: 10px;

    h4 {
        margin: 0 0 6px;
    }

    ul {
        margin: 0;
        padding-left: 20px;
    }
}
</style>
