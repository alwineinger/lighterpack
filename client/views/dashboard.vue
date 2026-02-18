<style lang="scss">
@import "../css/_globals";

#header {
    align-items: baseline;
    display: flex;
    height: 60px;
    margin: 0 -20px 20px; /* lpList padding */
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
    padding: 12px 15px;
}

.headerItem {
    flex: 0 0 auto;
    height: 100%;
    padding: 17px 16px;
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
        padding: 17px 16px 15px;
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

.lpMobileTabs {
    display: none;
}

@media (max-width: 900px) {
    #header {
        flex-wrap: wrap;
        height: auto;
        margin: 0 -15px 15px;
    }

    #lpListName {
        flex: 1 1 auto;
        min-width: 180px;
    }

    .headerItem {
        padding: 12px;
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
    }

    .lpMobileTabButton.isActive {
        background: $blue1;
        border-color: $blue1;
        color: #fff;
    }

    #main.lpIsMobile #sidebar {
        left: 0;
        margin-left: 0;
        padding-left: $spacingLarge;
        width: 100%;
    }

    #main.lpIsMobile.lpMobileModeList #sidebar {
        opacity: 0;
        pointer-events: none;
    }

    #main.lpIsMobile.lpMobileModeLists #sidebar,
    #main.lpIsMobile.lpMobileModeGear #sidebar {
        opacity: 1;
        pointer-events: auto;
    }
}
</style>

<template>
    <div
        v-if="isLoaded"
        id="main"
        :class="{
            lpHasSidebar: showSidebar,
            lpIsMobile: isMobile,
            lpMobileModeList: mobileMode === 'list',
            lpMobileModeLists: mobileMode === 'lists',
            lpMobileModeGear: mobileMode === 'gear',
        }"
    >
        <sidebar :is-mobile="isMobile" :mobile-mode="mobileMode" />
        <div class="lpList lpTransition">
            <div class="lpMobileTabs">
                <button class="lpMobileTabButton" :class="{isActive: mobileMode === 'list'}" @click="setMobileMode('list')">
                    List
                </button>
                <button class="lpMobileTabButton" :class="{isActive: mobileMode === 'lists'}" @click="setMobileMode('lists')">
                    Lists
                </button>
                <button class="lpMobileTabButton" :class="{isActive: mobileMode === 'gear'}" @click="setMobileMode('gear')">
                    Gear
                </button>
            </div>
            <div id="header" class="clearfix">
                <span class="headerItem">
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
    },
    mixins: [],
    data() {
        return {
            isLoaded: false,
            isMobile: false,
            mobileMode: 'list',
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
        showSidebar() {
            if (this.isMobile) {
                return this.mobileMode !== 'list';
            }
            return this.library.showSidebar;
        },
    },
    beforeMount() {
        if (!this.$store.state.library) {
            router.push('/welcome');
        } else {
            this.isLoaded = true;
        }
    },
    mounted() {
        this.updateIsMobile();
        window.addEventListener('resize', this.updateIsMobile);
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.updateIsMobile);
    },
    methods: {
        toggleSidebar() {
            if (this.isMobile) {
                this.mobileMode = (this.mobileMode === 'list') ? 'lists' : 'list';
                return;
            }
            this.$store.commit('toggleSidebar');
        },
        setMobileMode(mode) {
            this.mobileMode = mode;
        },
        updateIsMobile() {
            this.isMobile = window.matchMedia('(max-width: 900px)').matches;
            if (!this.isMobile) {
                this.mobileMode = 'list';
            }
        },
        updateListName(evt) {
            this.$store.commit('updateListName', { id: this.list.id, name: evt.target.value });
        },
    },
};
</script>
