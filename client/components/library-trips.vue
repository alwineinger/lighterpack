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

    &.lpActive {
        .lpTripLink {
            color: $yellow1;
            font-weight: bold;
        }
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
            <li v-for="trip in trips" :key="trip.id" class="lpTripList" :class="{lpActive: isActiveTrip(trip)}">
                <router-link class="lpTripLink" :to="tripRoute(trip)">{{ trip.name }}</router-link>
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
        tripRoute(trip) {
            return `/trips/${trip.id}`;
        },
        isActiveTrip(trip) {
            return this.$route.path === this.tripRoute(trip);
        },
        refreshTrips() {
            loadTrips()
                .then((trips) => {
                    this.trips = Array.isArray(trips) ? trips : [];
                })
                .catch(() => {
                    this.trips = [];
                });
        },
        newTrip() {
            const name = window.prompt('Trip name');
            if (!name) return;
            createTrip(name)
                .then((trip) => {
                    this.trips.unshift(trip);
                    this.$router.push(this.tripRoute(trip));
                });
        },
    },
};
</script>
