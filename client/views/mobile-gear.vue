<style lang="scss">
@import "../css/_globals";

#mobileGear {
    background: #555;
    color: #fff;
    min-height: 100vh;
}

#mobileGearHeader {
    align-items: center;
    display: flex;
    gap: 10px;
    padding: 15px;
}

#mobileGearHeader h1 {
    font-size: 18px;
    margin: 0;
}

#mobileGearContent {
    padding: 0 15px 30px;
}

@media (max-width: 900px) and (orientation: landscape) {
    #mobileGearContent {
        padding: 0 8px 20px;
    }
}
</style>

<template>
    <div v-if="isLoaded" id="mobileGear">
        <div id="mobileGearHeader">
            <router-link to="/" class="lpHref">
                Back
            </router-link>
            <h1>Gear</h1>
        </div>
        <div id="mobileGearContent">
            <mobileTabs active="gear" />
            <libraryItems :mobile-gear="showMobileVariant" />
        </div>
    </div>
</template>

<script>
import libraryItems from '../components/library-items.vue';
import mobileTabs from '../components/mobile-tabs.vue';
import { getResponsiveState, subscribeResponsiveState } from '../utils/responsive';

export default {
    name: 'MobileGear',
    components: {
        libraryItems,
        mobileTabs,
    },
    data() {
        return {
            isLoaded: false,
            responsive: getResponsiveState(),
            unsubscribeResponsive: null,
        };
    },
    computed: {
        showMobileVariant() {
            return this.responsive.isCompactViewport || this.responsive.isCoarsePointer;
        },
    },
    beforeMount() {
        if (!this.$store.state.library) {
            this.$router.push('/welcome');
        } else {
            this.isLoaded = true;
        }
    },
    mounted() {
        this.unsubscribeResponsive = subscribeResponsiveState();
    },
    beforeDestroy() {
        if (this.unsubscribeResponsive) {
            this.unsubscribeResponsive();
            this.unsubscribeResponsive = null;
        }
    },
};
</script>
