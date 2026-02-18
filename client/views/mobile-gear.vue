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
</style>

<template>
    <div v-if="isLoaded" id="mobileGear">
        <div id="mobileGearHeader">
            <router-link to="/" class="lpHref">Back</router-link>
            <h1>Gear</h1>
        </div>
        <div id="mobileGearContent">
            <div class="lpMobileTabs">
                <router-link class="lpMobileTabButton" to="/">List</router-link>
                <router-link class="lpMobileTabButton" to="/lists">Lists</router-link>
                <span class="lpMobileTabButton isActive">Gear</span>
            </div>
            <libraryItems :mobile-gear="true" />
        </div>
    </div>
</template>

<script>
import libraryItems from '../components/library-items.vue';

export default {
    name: 'MobileGear',
    components: {
        libraryItems,
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
