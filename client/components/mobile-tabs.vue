<style lang="scss">
@import "../css/_globals";

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
    display: inline-flex;
    font-size: 13px;
    justify-content: center;
    min-height: 36px;
    min-width: 60px;
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
    <div class="lpMobileTabs" aria-label="Primary mobile sections">
        <span v-if="active === 'list'" class="lpMobileTabButton isActive">List</span>
        <router-link v-else class="lpMobileTabButton" to="/">
            List
        </router-link>

        <span v-if="active === 'lists'" class="lpMobileTabButton isActive">Lists</span>
        <router-link v-else class="lpMobileTabButton" to="/lists">
            Lists
        </router-link>

        <span v-if="active === 'gear'" class="lpMobileTabButton isActive">Gear</span>
        <router-link v-else class="lpMobileTabButton" to="/gear">
            Gear
        </router-link>
    </div>
</template>

<script>
export default {
    name: 'MobileTabs',
    props: {
        active: {
            type: String,
            required: true,
            validator(value) {
                return ['list', 'lists', 'gear'].indexOf(value) > -1;
            },
        },
    },
};
</script>
