<style lang="scss">
@import "../css/_globals";

.lpMobileTabs {
    display: flex;
    gap: 8px;
    margin: 0 0 12px;
    min-width: 0;
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

.lpMobileTabButtonList {
    max-width: 44vw;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.lpMobileTabButton.isActive {
    background: $blue1;
    border-color: $blue1;
    color: #fff;
}
</style>

<template>
    <div class="lpMobileTabs" aria-label="Primary mobile sections">
        <span v-if="active === 'list'" class="lpMobileTabButton lpMobileTabButtonList isActive" :title="currentListLabel">{{ currentListLabel }}</span>
        <router-link v-else class="lpMobileTabButton lpMobileTabButtonList" to="/" :title="currentListLabel">
            {{ currentListLabel }}
        </router-link>

        <span v-if="active === 'lists'" class="lpMobileTabButton isActive">Lists</span>
        <router-link v-else class="lpMobileTabButton" to="/lists">
            Lists
        </router-link>

        <span v-if="active === 'gear'" class="lpMobileTabButton isActive">Gear</span>
        <router-link v-else class="lpMobileTabButton" to="/gear">
            Gear
        </router-link>

        <span v-if="active === 'trips'" class="lpMobileTabButton isActive">Trips</span>
        <router-link v-else class="lpMobileTabButton" to="/trips">
            Trips
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
                return ['list', 'lists', 'gear', 'trips'].indexOf(value) > -1;
            },
        },
    },
    computed: {
        currentListLabel() {
            const library = this.$store.state.library;
            if (!library) {
                return 'List';
            }

            const activeList = library.getListById(library.defaultListId);
            return activeList && activeList.name ? activeList.name : 'List';
        },
    },
};
</script>
