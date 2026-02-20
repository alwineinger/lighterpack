<template>
    <mobileRouteShell v-if="isLoaded" title="Lists" active-tab="lists">
        <libraryLists :mobile-lists="showMobileVariant" />
    </mobileRouteShell>
</template>

<script>
import libraryLists from '../components/library-lists.vue';
import mobileRouteShell from '../components/mobile-route-shell.vue';
import { getResponsiveState, subscribeResponsiveState } from '../utils/responsive';

export default {
    name: 'MobileLists',
    components: {
        libraryLists,
        mobileRouteShell,
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
