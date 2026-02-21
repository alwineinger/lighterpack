<template>
    <div v-if="trip" id="main" :class="{lpHasSidebar: library.showSidebar}">
        <sidebar :show-gear="false" />
        <div class="lpList lpTransition lpTripView">
            <div class="lpTripHeader">
                <a id="hamburger" class="lpTransition" @click="toggleSidebar">
                    <i class="lpSprite lpHamburger" />
                </a>
                <div class="lpTripTitleWrap">
                    <h1>{{ trip.name }}</h1>
                    <button v-if="canRenameTrip" class="lpButton lpSmall" @click="startEditingTripName">
                        Rename trip
                    </button>
                </div>
            </div>

        <modal id="renameTripDialog" :shown="isRenameTripDialogShown" @hide="cancelEditingTripName">
            <h2>Rename trip</h2>
            <input
                ref="renameTripInput"
                v-model="tripNameDraft"
                type="text"
                class="lpTripRenameInput"
                maxlength="100"
                @keyup.enter="saveTripName"
            >
            <div class="lpTripRenameActions">
                <button class="lpButton lpSmall" @click="saveTripName">
                    Save
                </button>
                <button class="lpButton lpSmall" @click="cancelEditingTripName">
                    Cancel
                </button>
            </div>
        </modal>

        <div class="lpTripNotes">
            <div class="lpTripSectionHeader">
                <h2>Trip Notes</h2>
                <button v-if="canEditTripNotes && !isEditingTripNotes" class="lpButton lpSmall" @click="startEditingTripNotes">
                    Edit notes
                </button>
            </div>
            <div v-if="isEditingTripNotes">
                <p>
                    <a href="https://guides.github.com/features/mastering-markdown/" target="_blank" class="lpHref">Markdown</a> supported.
                </p>
                <textarea
                    v-model="tripNotesDraft"
                    class="lpTripNotesInput"
                    placeholder="Add trip notes, reminders, or itinerary details"
                />
                <div class="lpTripNotesActions">
                    <button class="lpButton lpSmall" @click="saveTripNotes">
                        Save notes
                    </button>
                    <button class="lpButton lpSmall" @click="cancelEditingTripNotes">
                        Cancel
                    </button>
                </div>
            </div>
            <div v-else-if="hasTripNotes" class="lpTripNotesContent" v-html="renderedTripNotes" />
            <p v-else class="lpTripNotesEmpty">
                No trip notes yet.
            </p>
        </div>

        <h2>Group Gear</h2>
        <div class="lpListSummary lpTripSummary">
            <div class="lpChartContainer">
                <canvas ref="chartCanvas" class="lpChart" height="260" width="260" />
            </div>
            <div class="lpTotalsContainer">
                <ul class="lpTotals lpTable lpDataTable">
                    <li class="lpRow lpHeader">
                        <span class="lpCell">&nbsp;</span>
                        <span class="lpCell">User</span>
                        <span class="lpCell">Weight</span>
                    </li>
                    <li v-for="group in sortedGroups" :key="group.userKey" class="lpRow lpTotalCategory">
                        <span class="lpCell lpLegendCell">
                            <colorPicker :color="groupColorHex(group)" @colorChange="updateGroupColor(group, $event)" />
                        </span>
                        <span class="lpCell">{{ group.label }}</span>
                        <span class="lpCell lpNumber">
                            {{ group.totalWeightMg | displayWeight(library.totalUnit) }} {{ library.totalUnit | displayUnit }}
                        </span>
                    </li>
                    <li class="lpRow lpFooter lpTotal">
                        <span class="lpCell" />
                        <span class="lpCell lpSubtotal">Total</span>
                        <span class="lpCell lpNumber lpSubtotal">
                            {{ totalGroupWeightMg | displayWeight(library.totalUnit) }}
                            <unitSelect class="lpTotalUnitSelect" :unit="library.totalUnit" :on-change="setTotalUnit" />
                        </span>
                    </li>
                </ul>
                <p class="lpTripChartHint">
                    Click a list slice to break out individual group items.
                </p>
            </div>
        </div>

        <div v-for="group in groupGearByUserView" :key="group.userKey" class="lpTripGroupPanel">
            <h3>{{ group.label }} — {{ group.totalWeightMg | displayWeight(library.totalUnit) }} {{ library.totalUnit | displayUnit }}</h3>
            <ul>
                <li v-for="item in group.items" :key="item.itemId + '-' + item.categoryId">
                    {{ item.name }} ({{ item.categoryName }}) × {{ item.qty }} — {{ item.weightMg | displayWeight(library.totalUnit) }} {{ library.totalUnit | displayUnit }}
                </li>
            </ul>
        </div>

        <div class="lpTripSectionHeader lpTripSharedListsSection">
            <h2>Shared lists</h2>
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
            <div v-if="currentUserListChoices.length" class="lpTripListSelector">
                <div v-for="sharedList in currentUserSharedLists" :key="'my-shared-list-' + sharedList.listId" class="lpTripSharedListRow">
                    <label>Your list:</label>
                    <select :value="sharedList.listId" @change="onSharedListChange(sharedList.listId, $event)">
                        <option v-for="list in currentUserListChoices" :key="list.id" :value="list.id">
                            {{ list.name }}
                        </option>
                    </select>
                    <label>Share level:</label>
                    <select :value="sharedList.visibility" @change="onVisibilityChange(sharedList.listId, $event)">
                        <option value="summary">
                            Summary
                        </option>
                        <option value="full">
                            All items
                        </option>
                    </select>
                    <button class="lpButton lpSmall" @click="removeSharedList(sharedList.listId)">
                        Remove
                    </button>
                </div>
                <button v-if="availableListOptionsForShare.length" class="lpButton lpSmall" @click="addSharedList">
                    Add list
                </button>
            </div>
        </div>

        <div class="lpTripSectionHeader">
            <h2>Shared content</h2>
        </div>
        <div v-for="member in sortedMembers" :key="member.userId || member.email" class="lpTripGroupPanel">
            <h3>{{ member.username || member.email }}</h3>
            <div
                v-for="sharedList in member.sharedLists || []"
                :key="(member.userId || member.email) + '-shared-' + sharedList.listId"
                class="lpTripMemberSharedList"
            >
                <h4>{{ sharedList.listName || 'No shared list' }} ({{ sharedList.visibility }})</h4>
                <div v-if="sharedList.sharedContent && sharedList.sharedContent.categories && sharedList.sharedContent.categories.length" class="lpTripSharedSummary">
                    <ul class="lpTotals lpTable lpDataTable">
                        <li class="lpRow lpHeader">
                            <span class="lpCell">&nbsp;</span>
                            <span class="lpCell">Category</span>
                            <span class="lpCell">Weight</span>
                        </li>
                        <li v-for="category in sharedList.sharedContent.categories" :key="category.categoryId" class="lpTotalCategory lpRow">
                            <span class="lpCell lpLegendCell">
                                <span class="lpLegend" :style="{ 'background-color': category.categoryColor || '#999' }" />
                            </span>
                            <span class="lpCell">
                                {{ category.categoryName }}
                            </span>
                            <span class="lpCell lpNumber">
                                <span class="lpDisplaySubtotal">{{ category.totalWeightMg | displayWeight(library.totalUnit) }}</span>
                                <span class="lpSubtotalUnit">{{ library.totalUnit | displayUnit }}</span>
                            </span>
                        </li>
                        <li class="lpRow lpFooter lpTotal">
                            <span class="lpCell" />
                            <span class="lpCell lpSubtotal" :title="getSharedTotalItemCount(sharedList) + ' items'">Total</span>
                            <span class="lpCell lpNumber lpSubtotal" :title="getSharedTotalItemCount(sharedList) + ' items'">
                                <span class="lpDisplaySubtotal">{{ getSharedTotalWeight(sharedList) | displayWeight(library.totalUnit) }}</span>
                                <span class="lpSubtotalUnit">{{ library.totalUnit | displayUnit }}</span>
                            </span>
                        </li>
                        <li v-if="getSharedConsumableWeight(sharedList) > 0" data-weight-type="consumable" class="lpRow lpFooter lpBreakdown lpConsumableWeight">
                            <span class="lpCell" />
                            <span class="lpCell lpSubtotal">Consumable</span>
                            <span class="lpCell lpNumber lpSubtotal">
                                <span class="lpDisplaySubtotal">{{ getSharedConsumableWeight(sharedList) | displayWeight(library.totalUnit) }}</span>
                                <span class="lpSubtotalUnit">{{ library.totalUnit | displayUnit }}</span>
                            </span>
                        </li>
                        <li v-if="getSharedWornWeight(sharedList) > 0" data-weight-type="worn" class="lpRow lpFooter lpBreakdown lpWornWeight">
                            <span class="lpCell" />
                            <span class="lpCell lpSubtotal">Worn</span>
                            <span class="lpCell lpNumber lpSubtotal">
                                <span class="lpDisplaySubtotal">{{ getSharedWornWeight(sharedList) | displayWeight(library.totalUnit) }}</span>
                                <span class="lpSubtotalUnit">{{ library.totalUnit | displayUnit }}</span>
                            </span>
                        </li>
                        <li v-if="getSharedBaseWeight(sharedList) !== getSharedTotalWeight(sharedList)" data-weight-type="base" class="lpRow lpFooter lpBreakdown lpPackWeight">
                            <span class="lpCell" />
                            <span class="lpCell lpSubtotal">Base Weight</span>
                            <span class="lpCell lpNumber lpSubtotal">
                                <span class="lpDisplaySubtotal">{{ getSharedBaseWeight(sharedList) | displayWeight(library.totalUnit) }}</span>
                                <span class="lpSubtotalUnit">{{ library.totalUnit | displayUnit }}</span>
                            </span>
                        </li>
                    </ul>
                </div>
                <div v-if="isFullSharedContent(sharedList)">
                    <div v-for="category in sharedList.sharedContent.categories" :key="'items-' + category.categoryId" class="lpTripSharedCategoryItems">
                        <h4>
                            {{ category.categoryName }} — {{ category.totalWeightMg | displayWeight(library.totalUnit) }} {{ library.totalUnit | displayUnit }}
                        </h4>
                        <ul v-if="category.items && category.items.length">
                            <li v-for="item in category.items" :key="item.itemId + '-' + item.categoryId + '-' + item.name">
                                {{ item.name }} × {{ item.qty }} — {{ item.weightMg | displayWeight(library.totalUnit) }} {{ library.totalUnit | displayUnit }}
                            </li>
                        </ul>
                        <p v-else>
                            No items in this category.
                        </p>
                    </div>
                </div>
                <p v-else-if="!sharedList.sharedContent || !sharedList.sharedContent.categories || !sharedList.sharedContent.categories.length">
                    No shared items yet.
                </p>
            </div>
            <p v-if="!(member.sharedLists || []).length">
                No shared lists yet.
            </p>
        </div>
            <ul>
                <li v-for="member in trip.members" :key="member.userId || member.email">
                    <strong>{{ member.username || member.email }}</strong> — {{ member.role }}
                    <span v-for="sharedList in member.sharedLists || []" :key="(member.userId || member.email) + '-list-' + sharedList.listId"> • {{ sharedList.listName }} ({{ sharedList.visibility }})</span>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import {
    acceptTripInvitation, inviteTripUser, loadTrip, updateTripMemberList, updateTripName, updateTripNotes,
} from '../api/mobile-api';
import colorPicker from '../components/colorpicker.vue';
import modal from '../components/modal.vue';
import sidebar from '../components/sidebar.vue';
import unitSelect from '../components/unit-select.vue';

const markdown = require('markdown').markdown;

const pies = require('../pies.js');
const colorUtils = require('../utils/color.js');
const utilsMixin = require('../mixins/utils-mixin.js');

export default {
    name: 'TripView',
    components: {
        colorPicker,
        modal,
        sidebar,
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
            isEditingTripNotes: false,
            tripNotesDraft: '',
            tripNameDraft: '',
            isRenameTripDialogShown: false,
            isRenamingTrip: false,
            groupColorsByKey: {},
        };
    },
    computed: {
        library() {
            return this.$store.state.library;
        },
        sortedGroups() {
            return this.groupGearByUserView.slice().sort((a, b) => b.totalWeightMg - a.totalWeightMg);
        },
        groupGearByUserView() {
            if (!this.trip) {
                return [];
            }

            const groups = (this.trip.groupGearByUser || []).slice();
            const localGroups = this.buildCurrentUserLocalGroups();
            if (!localGroups.length) {
                return groups;
            }

            localGroups.forEach((localGroup) => {
                const existingIndex = groups.findIndex((group) => group.userKey === localGroup.userKey);
                if (existingIndex === -1) {
                    groups.push(localGroup);
                } else {
                    groups.splice(existingIndex, 1, localGroup);
                }
            });

            return groups;
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
        currentUserSharedLists() {
            if (!this.trip || !this.trip.currentUserMember || !this.trip.currentUserMember.sharedLists) {
                return [];
            }
            return this.trip.currentUserMember.sharedLists;
        },
        availableListOptionsForShare() {
            const selectedIds = this.currentUserSharedLists.map((sharedList) => sharedList.listId);
            return this.currentUserListChoices.filter((list) => selectedIds.indexOf(list.id) === -1);
        },
        sortedMembers() {
            return ((this.trip && this.trip.members) || []).slice().sort((a, b) => {
                const aName = (a.username || a.email || '').toLowerCase();
                const bName = (b.username || b.email || '').toLowerCase();
                return aName.localeCompare(bName);
            });
        },
        canEditTripNotes() {
            if (!this.trip || !this.trip.currentUserMember) {
                return false;
            }
            return ['owner', 'editor'].indexOf(this.trip.currentUserMember.role) > -1;
        },
        canRenameTrip() {
            return !!(this.trip && this.trip.currentUserMember && this.trip.currentUserMember.role === 'owner');
        },
        hasTripNotes() {
            return !!(this.trip && this.trip.notes && this.trip.notes.trim());
        },
        renderedTripNotes() {
            if (!this.trip || !this.trip.notes) {
                return '';
            }
            return markdown.toHTML(this.trip.notes);
        },
    },
    watch: {
        '$route.params.tripId': function () {
            this.refresh();
        },
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
        toggleSidebar() {
            this.$store.commit('toggleSidebar');
        },
        buildCurrentUserLocalGroups() {
            if (!this.trip || !this.trip.currentUserMember || !this.trip.currentUserMember.userId) {
                return [];
            }

            const library = this.$store.state.library;
            const sharedLists = this.currentUserSharedLists;
            if (!library || !sharedLists.length) {
                return [];
            }

            const memberName = this.trip.currentUserMember.username || this.trip.currentUserMember.email || 'You';

            return sharedLists.map((sharedList) => {
                const list = library.getListById(sharedList.listId);
                if (!list) {
                    return null;
                }

                const groupItems = [];
                list.categoryIds.forEach((categoryId) => {
                    const category = library.getCategoryById(categoryId);
                    if (!category) {
                        return;
                    }

                    category.categoryItems.forEach((categoryItem) => {
                        if (!categoryItem.group) {
                            return;
                        }

                        const item = library.getItemById(categoryItem.itemId);
                        if (!item) {
                            return;
                        }

                        groupItems.push({
                            itemId: item.id,
                            categoryId: category.id,
                            listId: sharedList.listId,
                            name: item.name,
                            categoryName: category.name,
                            qty: categoryItem.qty,
                            weightMg: item.weight * categoryItem.qty,
                        });
                    });
                });

                const totalWeightMg = groupItems.reduce((sum, item) => sum + item.weightMg, 0);
                const existingGroup = (this.trip.groupGearByUser || []).find((group) => group.userKey === `${this.trip.currentUserMember.userId}:${sharedList.listId}`);
                const listName = sharedList.listName || list.name || `List #${sharedList.listId}`;

                return {
                    userKey: `${this.trip.currentUserMember.userId}:${sharedList.listId}`,
                    userId: this.trip.currentUserMember.userId,
                    listId: sharedList.listId,
                    label: existingGroup && existingGroup.label ? existingGroup.label : `${listName} (${memberName})`,
                    items: groupItems.sort((a, b) => b.weightMg - a.weightMg),
                    totalWeightMg,
                };
            }).filter((group) => !!group);
        },
        refresh() {
            loadTrip(this.$route.params.tripId).then((trip) => {
                this.trip = trip;
                this.tripNotesDraft = trip.notes || '';
                this.isEditingTripNotes = false;
                this.isRenamingTrip = false;
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
        startEditingTripNotes() {
            if (!this.trip) {
                return;
            }
            this.tripNotesDraft = this.trip.notes || '';
            this.isEditingTripNotes = true;
        },
        cancelEditingTripNotes() {
            this.tripNotesDraft = this.trip && this.trip.notes ? this.trip.notes : '';
            this.isEditingTripNotes = false;
        },
        saveTripNotes() {
            if (!this.trip || !this.canEditTripNotes) {
                return;
            }
            updateTripNotes(this.trip.id, this.tripNotesDraft).then((response) => {
                this.trip.notes = response.notes || '';
                this.tripNotesDraft = this.trip.notes;
                this.isEditingTripNotes = false;
            });
        },
        startEditingTripName() {
            if (!this.trip || !this.canRenameTrip || this.isRenamingTrip) {
                return;
            }

            this.tripNameDraft = this.trip.name || '';
            this.isRenameTripDialogShown = true;
            this.$nextTick(() => {
                if (this.$refs.renameTripInput) {
                    this.$refs.renameTripInput.focus();
                    this.$refs.renameTripInput.select();
                }
            });
        },
        cancelEditingTripName() {
            this.tripNameDraft = this.trip && this.trip.name ? this.trip.name : '';
            this.isRenameTripDialogShown = false;
        },
        saveTripName() {
            if (!this.trip || !this.canRenameTrip || this.isRenamingTrip) {
                return;
            }

            const currentName = this.trip.name || '';
            const trimmedName = this.tripNameDraft.trim();
            if (!trimmedName || trimmedName === currentName) {
                this.cancelEditingTripName();
                return;
            }

            this.isRenamingTrip = true;
            updateTripName(this.trip.id, trimmedName).then((response) => {
                this.trip.name = response.name || trimmedName;
                this.cancelEditingTripName();
            }).finally(() => {
                this.isRenamingTrip = false;
            });
        },

        updateSharedSettings(payload) {
            if (!this.trip) {
                return Promise.resolve();
            }
            return updateTripMemberList(this.trip.id, payload).then(() => this.refresh());
        },
        onSharedListChange(currentListId, event) {
            const listId = parseInt(event.target.value, 10);
            if (Number.isNaN(listId) || listId === currentListId || !this.trip) {
                return;
            }
            const existing = this.currentUserSharedLists.find((sharedList) => sharedList.listId === currentListId);
            this.updateSharedSettings({
                previousListId: currentListId,
                listId,
                visibility: existing ? existing.visibility : 'full',
                remove: false,
            });
        },
        onVisibilityChange(listId, event) {
            const visibility = event.target.value === 'summary' ? 'summary' : 'full';
            const existing = this.currentUserSharedLists.find((sharedList) => sharedList.listId === listId);
            if (!existing || visibility === existing.visibility || !this.trip) {
                return;
            }
            this.updateSharedSettings({
                listId,
                visibility,
                remove: false,
            });
        },
        addSharedList() {
            if (!this.availableListOptionsForShare.length) {
                return;
            }
            this.updateSharedSettings({
                listId: this.availableListOptionsForShare[0].id,
                visibility: 'full',
                remove: false,
            });
        },
        removeSharedList(listId) {
            if (this.currentUserSharedLists.length <= 1) {
                return;
            }
            this.updateSharedSettings({
                listId,
                visibility: 'full',
                remove: true,
            });
        },
        getSharedTotalWeight(sharedList) {
            const totals = sharedList && sharedList.sharedContent && sharedList.sharedContent.totals;
            return totals ? totals.totalWeightMg : 0;
        },
        getSharedConsumableWeight(sharedList) {
            const totals = sharedList && sharedList.sharedContent && sharedList.sharedContent.totals;
            return totals ? totals.totalConsumableWeightMg : 0;
        },
        getSharedWornWeight(sharedList) {
            const totals = sharedList && sharedList.sharedContent && sharedList.sharedContent.totals;
            return totals ? totals.totalWornWeightMg : 0;
        },
        getSharedBaseWeight(sharedList) {
            const totals = sharedList && sharedList.sharedContent && sharedList.sharedContent.totals;
            return totals ? totals.totalBaseWeightMg : 0;
        },
        getSharedTotalItemCount(sharedList) {
            const totals = sharedList && sharedList.sharedContent && sharedList.sharedContent.totals;
            return totals ? totals.totalItemCount : 0;
        },
        isFullSharedContent(sharedList) {
            return !!(sharedList && sharedList.sharedContent && sharedList.sharedContent.mode === 'full' && sharedList.sharedContent.categories && sharedList.sharedContent.categories.length);
        },

        setTotalUnit(unit) {
            this.$store.commit('setTotalUnit', unit);
        },
        getChartData() {
            const chartData = {
                total: this.totalGroupWeightMg,
                points: {},
            };

            this.sortedGroups.forEach((group, index) => {
                const userPoint = {
                    id: group.userKey,
                    name: group.label,
                    total: group.totalWeightMg,
                    color: colorUtils.hexToRgb(this.groupColorHex(group, index)),
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
        groupColorHex(group, index) {
            if (this.groupColorsByKey[group.userKey]) {
                return this.groupColorsByKey[group.userKey];
            }

            const fallbackColor = colorUtils.getColor(typeof index === 'number' ? index : this.sortedGroups.findIndex((entry) => entry.userKey === group.userKey));
            const fallbackHex = colorUtils.rgbToHex(fallbackColor);
            this.$set(this.groupColorsByKey, group.userKey, fallbackHex);
            return fallbackHex;
        },
        updateGroupColor(group, color) {
            this.$set(this.groupColorsByKey, group.userKey, color);
            this.updateChart();
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

.lpTripTitleWrap {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.lpTripGroupPanel {
    border: 1px solid #ccc;
    margin-bottom: 12px;
    padding: 10px;
}

.lpTripSummary {
    margin-bottom: 20px;
}

.lpTripNotes {
    border: 1px solid #ccc;
    margin: 12px 0 20px;
    padding: 10px;
}

.lpTripNotesInput {
    min-height: 120px;
    width: 100%;
}

.lpTripNotesActions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
}

.lpTripNotesEmpty {
    color: #666;
    margin: 0;
}

.lpTripNotesContent {
    overflow-wrap: anywhere;

    :first-child {
        margin-top: 0;
    }

    :last-child {
        margin-bottom: 0;
    }
}

.lpTripRenameInput {
    width: 100%;
}

.lpTripRenameActions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
}

.lpTripChartHint {
    color: #666;
    font-size: 13px;
    margin-top: 10px;
}

.lpTripInvite {
    display: flex;
    gap: 8px;
    margin: 0;
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
    align-items: flex-start;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    gap: 8px;
}

.lpTripSharedListRow {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.lpTripMemberSharedList {
    margin-bottom: 10px;
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
