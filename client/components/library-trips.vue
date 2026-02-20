<style lang="scss">
@import "../css/_globals";

#tripContainer {
    flex: 0 0 auto;
}

.tripContainerHeader {
    display: flex;
    justify-content: space-between;
}

.lpTripList {
    border-top: 1px dotted #999;
    display: flex;
    list-style: none;
    margin: 0 10px;
    padding: 6px 0;

    &:first-child {
        border-top: none;
        padding-top: 10px;
    }
}

.lpTripLink {
    color: #fff;
    cursor: pointer;
    flex: 1 1 auto;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:hover {
        text-decoration: underline;
    }
}

.lpTripRole {
    color: #bbb;
    font-size: 12px;
    margin-left: 8px;
}
</style>

<template>
    <section id="tripContainer">
        <div class="tripContainerHeader">
            <h2>Trips</h2>
            <a class="lpAdd" @click="newTrip"><i class="lpSprite lpSpriteAdd" />Add new trip</a>
        </div>
        <ul>
            <li v-for="trip in trips" :key="trip.id" class="lpTripList">
                <span class="lpTripLink" @click="openTrip(trip)">{{ trip.name }}</span>
                <span class="lpTripRole">{{ trip.role }}</span>
            </li>
        </ul>
    </section>
</template>

<script>
import { createTrip, loadTrips } from '../api/mobile-api';

export default {
    name: 'LibraryTrips',
    props: {
        mobileTrips: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            trips: [],
        };
    },
    mounted() {
        this.refreshTrips();
    },
    methods: {
        refreshTrips() {
            loadTrips()
                .then((trips) => {
                    this.trips = trips;
                })
                .catch(() => {
                    this.trips = [];
                });
        },
        openTrip(trip) {
            this.$router.push(`/trips/${trip.id}`);
        },
        newTrip() {
            const name = window.prompt('Trip name');
            if (!name) return;
            createTrip(name)
                .then((trip) => {
                    this.trips.unshift(trip);
                    this.openTrip(trip);
                });
        },
    },
};
</script>
