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

.lpMobileTabs {
    display: flex;
    gap: 8px;
    margin: 0 0 12px;
}

.lpMobileTabButton {
    background: #f3f3f3;
    border: 1px solid #ccc;
    border-radius: 18px;
    color: #333;
    cursor: pointer;
    font-size: 13px;
    padding: 8px 12px;
    text-decoration: none;
}

.lpMobileTabButton.isActive {
    background: $blue1;
    border-color: $blue1;
    color: #fff;
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
            <router-link to="/" class="lpHref">Back</router-link>
            <h1>Lists</h1>
        </div>
        <div id="mobileListsContent">
            <div class="lpMobileTabs">
                <router-link class="lpMobileTabButton" to="/">List</router-link>
                <span class="lpMobileTabButton isActive">Lists</span>
                <router-link class="lpMobileTabButton" to="/gear">Gear</router-link>
            </div>
            <libraryLists :mobile-lists="true" />
        </div>
    </div>
</template>

<script>
import libraryLists from '../components/library-lists.vue';

export default {
    name: 'MobileLists',
    components: {
        libraryLists,
    },
    data() {
        return {
            isLoaded: false,
            isMobile: false,
        };
    },
    beforeMount() {
        this.isMobile = window.matchMedia('(max-width: 900px)').matches;
        if (!this.isMobile) {
            router.push('/');
            return;
        }
        if (!this.$store.state.library) {
            router.push('/welcome');
        } else {
            this.isLoaded = true;
        }
    },
};
</script>
