<template>
    <div class="lpMobileRouteShell">
        <div class="lpMobileRouteShellHeader">
            <router-link to="/" class="lpHref">
                Back
            </router-link>
            <h1>{{ title }}</h1>
        </div>
        <div class="lpMobileRouteShellContent">
            <mobileTabs :active="activeTab" />
            <slot />
        </div>
    </div>
</template>

<script>
import mobileTabs from './mobile-tabs.vue';

export default {
    name: 'MobileRouteShell',
    components: {
        mobileTabs,
    },
    props: {
        title: {
            type: String,
            required: true,
        },
        activeTab: {
            type: String,
            required: true,
            validator(value) {
                return ['lists', 'gear', 'trips'].indexOf(value) > -1;
            },
        },
    },
};
</script>

<style lang="scss">
@import "../css/_globals";

.lpMobileRouteShell {
    background: #555;
    color: #fff;
    min-height: 100vh;
}

.lpMobileRouteShellHeader {
    align-items: center;
    display: flex;
    gap: 10px;
    padding: 15px;
}

.lpMobileRouteShellHeader h1 {
    font-size: 18px;
    margin: 0;
}

.lpMobileRouteShellContent {
    padding: 0 15px 30px;
}

@media (max-width: 900px) and (orientation: landscape) {
    .lpMobileRouteShellContent {
        padding: 0 8px 20px;
    }
}
</style>
