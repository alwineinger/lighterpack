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
        <div v-for="group in trip.groupGearByUser" :key="group.userKey" class="lpTripGroupPanel">
            <h3>{{ group.label }} — {{ group.totalWeightDisplay }} {{ trip.totalUnit }}</h3>
            <ul>
                <li v-for="item in group.items" :key="item.itemId + '-' + item.categoryId">
                    {{ item.name }} ({{ item.categoryName }}) × {{ item.qty }} — {{ item.weightDisplay }} {{ trip.totalUnit }}
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import { acceptTripInvitation, inviteTripUser, loadTrip } from '../api/mobile-api';

export default {
    name: 'TripView',
    data() {
        return {
            trip: null,
            invite: {
                email: '',
                role: 'editor',
            },
        };
    },
    mounted() {
        this.refresh();
    },
    methods: {
        refresh() {
            loadTrip(this.$route.params.tripId).then((trip) => {
                this.trip = trip;
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

.lpTripInvite {
    display: flex;
    gap: 8px;
    margin: 10px 0 20px;
}
</style>
