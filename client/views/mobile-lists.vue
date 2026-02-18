<style lang="scss">
@import "../css/_globals";

#mobileLists {
    background: #555;
    color: #fff;
    min-height: 100vh;
}

#mobileListsHeader {
    align-items: center;
    display: flex;
    gap: 10px;
    padding: 15px;
}

#mobileListsHeader h1 {
    font-size: 18px;
    margin: 0;
}

#mobileListsContent {
    padding: 0 15px 30px;
}

@media (max-width: 900px) and (orientation: landscape) {
    #mobileListsContent {
        padding: 0 8px 20px;
    }
}
</style>

<template>
    <div v-if="isLoaded" id="mobileLists">
        <div id="mobileListsHeader">
            <router-link to="/" class="lpHref">
                Back
            </router-link>
            <h1>Lists</h1>
        </div>
        <div id="mobileListsContent">
            <mobileTabs active="lists" />
            <libraryLists :mobile-lists="showMobileVariant" />
        </div>
    </div>
</template>

<script>
import libraryLists from '../components/library-lists.vue';
import mobileTabs from '../components/mobile-tabs.vue';
import { getResponsiveState, subscribeResponsiveState } from '../utils/responsive';

export default {
    name: 'MobileLists',
    components: {
        libraryLists,
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
