<style lang="scss">
@import "../css/_globals";

#header {
    align-items: baseline;
    display: flex;
    gap: 4px;
    margin: 0 -20px 20px; /* lpList padding */
    min-height: 60px;
    position: relative;
}

#hamburger {
    cursor: pointer;
    display: inline-block;
    opacity: 0.6;
    transition: transform $transitionDurationSlow;

    &:hover {
        opacity: 1;
    }

    .lpHasSidebar & {
        transform: rotate(90deg);
    }
}

#lpListName {
    font-size: 24px;
    font-weight: 600;
    min-width: 0;
    padding: 12px 15px;
}

.headerItem {
    flex: 0 0 auto;
    min-height: 100%;
    padding: 14px 12px;
    position: relative;

    &:first-child {
        padding-left: 20px;
    }

    .lpPopover {
        &:hover .lpTarget {
            color: $blue1;
        }
    }

    .lpTarget {
        font-weight: 600;
        padding: 14px 12px;
    }

    &#lpListName {
        flex: 1 0 auto;
    }

    &.hasPopover {
        padding: 0;
    }

    &.signInRegisterButtons {
        height: auto;
        padding: 0 16px;
    }
}

@media (max-width: 900px) {
    #header {
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        margin: 0 -15px 15px;
        min-height: auto;
    }

    #lpListName {
        flex: 1 1 auto;
        font-size: 20px;
        min-width: min(200px, 100%);
        padding: 12px;
    }

    .headerItem {
        padding: 12px;
    }

    #share,
    #settings {
        .lpTarget {
            min-height: 44px;
            white-space: nowrap;
        }
    }

    #main #sidebar {
        display: none;
    }
}
</style>

<template>
    <div v-if="isLoaded" id="main" :class="{lpHasSidebar: library.showSidebar}">
        <sidebar :show-gear="true" />
        <div class="lpList lpTransition">
            <mobileTabs v-if="showCompactTabs" active="list" />
            <div id="header" class="clearfix">
                <span v-if="!showCompactTabs" class="headerItem">
                    <a id="hamburger" class="lpTransition" @click="toggleSidebar"><i class="lpSprite lpHamburger" /></a>
                </span>
                <input id="lpListName" :value="list.name" type="text" class="lpListName lpSilent headerItem" value="New List" placeholder="List Name" autocomplete="off" name="lastpass-disable-search" @input="updateListName">
                <share />
                <listSettings />
                <accountDropdown v-if="isSignedIn" />
                <span v-else class="headerItem signInRegisterButtons">
                    <router-link to="/register" class="lpButton lpSmall">Register</router-link>
                    or
                    <router-link to="/signin" class="lpButton lpSmall">Sign In</router-link>
                </span>
                <span class="clearfix" />
            </div>

            <list />

            <div id="lpFooter">
                <div class="lpSiteBy">
                    Site by <a class="lpHref" href="https://www.galenmaly.com/" target="_blank" rel="noopener noreferrer">Galen Maly</a>
                    and <a class="lpHref" href="https://github.com/galenmaly/lighterpack/graphs/contributors" target="_blank" rel="noopener noreferrer">friends</a>.
                </div>
                <div class="lpContact">
                    <a class="lpHref" href="https://github.com/galenmaly/lighterpack" target="_blank" rel="noopener noreferrer">Copyleft</a> LighterPack 2019
                    -
                    <a class="lpHref" href="mailto:info@lighterpack.com">Contact</a>
                </div>
            </div>
        </div>

        <globalAlerts />
        <speedbump />
        <copyList />
        <importCSV />
        <itemImage />
        <itemViewImage />
        <itemLink />
        <help />
        <account />
        <accountDelete />
    </div>
</template>

<script>
import globalAlerts from '../components/global-alerts.vue';
import sidebar from '../components/sidebar.vue';
import share from '../components/share.vue';
import listSettings from '../components/list-settings.vue';
import accountDropdown from '../components/account-dropdown.vue';
import forgotPassword from './forgot-password.vue';
import account from '../components/account.vue';
import accountDelete from '../components/account-delete.vue';
import help from '../components/help.vue';
import list from '../components/list.vue';

import itemImage from '../components/item-image.vue';
import itemViewImage from '../components/item-view-image.vue';
import itemLink from '../components/item-link.vue';
import importCSV from '../components/import-csv.vue';
import copyList from '../components/copy-list.vue';
import speedbump from '../components/speedbump.vue';
import mobileTabs from '../components/mobile-tabs.vue';
import { getResponsiveState, subscribeResponsiveState } from '../utils/responsive';

export default {
    name: 'Dashboard',
    components: {
        sidebar,
        share,
        listSettings,
        accountDropdown,
        forgotPassword,
        account,
        accountDelete,
        help,
        list,
        itemLink,
        copyList,
        importCSV,
        itemImage,
        itemViewImage,
        speedbump,
        globalAlerts,
        mobileTabs,
    },
    mixins: [],
    data() {
        return {
            isLoaded: false,
            responsive: getResponsiveState(),
            unsubscribeResponsive: null,
        };
    },
    computed: {
        library() {
            return this.$store.state.library;
        },
        list() {
            return this.library.getListById(this.library.defaultListId);
        },
        isSignedIn() {
            return this.$store.state.loggedIn;
        },
        showCompactTabs() {
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
    methods: {
        toggleSidebar() {
            this.$store.commit('toggleSidebar');
        },
        updateListName(evt) {
            this.$store.commit('updateListName', { id: this.list.id, name: evt.target.value });
        },
    },
};
</script>
