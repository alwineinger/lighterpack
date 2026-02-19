<style lang="scss">

#libraryContainer {
    display: flex;
    flex: 2 0 30vh;
    flex-direction: column;
}

#library {
    flex: 1 0 25vh;
    overflow-y: scroll;
}

#libraryContainer.lpMobileGearView {
    display: block;
}

#libraryContainer.lpMobileGearView #library {
    max-height: none;
    overflow-y: visible;
}

#libraryToolbar {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 12px;
}

#librarySearch {
    background: #666;
    border: 1px solid #888;
    color: #fff;
    padding: 3px 6px;
}

.lpBulkAddBar {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.lpBulkAddBar select {
    background: #666;
    border: 1px solid #888;
    color: #fff;
    padding: 4px 6px;
}

.lpBulkAddBar .lpButton {
    padding: 6px 10px;
}

.lpBulkToggle {
    align-items: center;
    display: inline-flex;
    gap: 6px;
}

.lpLibrarySelect {
    align-self: start;
    display: inline-flex;
    grid-area: select;
    margin-right: 6px;
}

.lpLibrarySelect input[type="checkbox"] {
    transform: translateY(2px);
}

.lpLibraryItem {
    align-items: center;
    border-top: 1px dotted #999;
    column-gap: 8px;
    display: grid;
    grid-template-areas:
        "select name weight actions"
        "select description description actions";
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    list-style: none;
    margin: 0 10px 5px;
    min-height: 54px;
    overflow: hidden;
    padding: 8px 8px 8px 10px;
    position: relative;

    &:first-child {
        border-top: none;
        padding-top: 10px;
    }

    &:last-child {
        border-bottom: none;
    }

    &.gu-mirror {
        background: #606060;
        border: 1px solid #999;
        color: #fff;
    }

    .lpName {
        grid-area: name;
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .lpWeight {
        grid-area: weight;
        justify-self: end;
        white-space: nowrap;
        width: auto;
    }

    .lpDescription {
        color: #ccc;
        display: block;
        grid-area: description;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .lpLibraryActions {
        align-items: center;
        display: inline-flex;
        gap: 8px;
        grid-area: actions;
        justify-self: end;
    }

    .lpHandle,
    .lpRemove,
    .lpAdd {
        position: static;
    }

    .lpHandle {
        align-self: stretch;
        height: auto;
    }

    #library.lpSearching & {
        display: none;
    }

    #library.lpSearching &.lpHit {
        display: block;
    }

    #main > & {
        background: #666;
        color: #fff;
        padding: 10px;
        width: auto;
    }
}

.lpLibraryItem.isMobileGear {
    box-sizing: border-box;
    grid-template-areas:
        "name weight"
        "description description"
        "actions actions";
    grid-template-columns: minmax(0, 1fr) auto;
    margin: 0 0 10px;
    padding: 10px;
    width: 100%;
}

.lpLibraryItem.isMobileGear .lpName,
.lpLibraryItem.isMobileGear .lpDescription {
    max-width: none;
    white-space: normal;
    width: auto;
}

.lpLibraryItem.isMobileGear .lpWeight {
    margin-top: 2px;
}

.lpLibraryItem.isMobileGear .lpRemove,
.lpLibraryItem.isMobileGear .lpHandle,
.lpLibraryItem.isMobileGear .lpLibraryActions {
    justify-self: start;
}

@media (max-width: 900px) {
    #library {
        max-height: 55vh;
    }

    #libraryContainer.lpMobileGearView #library {
        max-height: none;
    }

    .lpLibraryItem {
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 10px;
        margin: 0 0 8px;
        padding: 10px;

        .lpDescription {
            white-space: normal;
        }
    }
}
</style>

<template>
    <section id="libraryContainer" :class="{lpMobileGearView: mobileGear}">
        <h2>Gear</h2>
        <div id="libraryToolbar">
            <input id="librarySearch" v-model="searchText" type="text" placeholder="search items">
            <div v-if="supportsMultiSelect" class="lpBulkAddBar">
                <label class="lpBulkToggle">
                    <input v-model="bulkSelectEnabled" type="checkbox">
                    Select multiple
                </label>
                <button v-if="bulkSelectEnabled" class="lpButton lpSmall" type="button" @click="selectAllVisible">
                    Select all
                </button>
                <button v-if="bulkSelectEnabled" class="lpButton lpSmall" type="button" @click="clearSelection">
                    Clear
                </button>
                <select v-if="bulkSelectEnabled" v-model="bulkCategoryId">
                    <option v-for="category in categories" :key="category.id" :value="category.id">
                        {{ category.name || 'New category' }}
                    </option>
                </select>
                <button
                    v-if="bulkSelectEnabled"
                    class="lpButton lpSmall"
                    type="button"
                    :disabled="selectedItemIds.length === 0"
                    @click="addSelectedToCategory"
                >
                    Add selected ({{ selectedItemIds.length }})
                </button>
            </div>
            <div v-else class="lpBulkAddBar">
                <select v-model="bulkCategoryId">
                    <option v-for="category in categories" :key="category.id" :value="category.id">
                        {{ category.name || 'New category' }}
                    </option>
                </select>
            </div>
        </div>
        <ul id="library">
            <li v-for="item in filteredItems" :key="item.id" class="lpLibraryItem" :class="{isMobileGear: mobileGear}" :data-item-id="item.id">
                <label v-if="!mobileGear && bulkSelectEnabled" class="lpLibrarySelect">
                    <input
                        v-model="selectedItemIds"
                        type="checkbox"
                        :value="item.id"
                        :disabled="item.inCurrentList"
                    >
                </label>
                <a v-if="item.url" :href="item.url" target="_blank" class="lpName lpHref">{{ item.name }}</a>
                <span v-if="!item.url" class="lpName">{{ item.name }}</span>
                <span class="lpWeight">
                    {{ item.weight | displayWeight(item.authorUnit) }}
                    {{ item.authorUnit }}
                </span>
                <span class="lpDescription">
                    {{ item.description }}
                </span>
                <div class="lpLibraryActions">
                    <a
                        v-if="!item.inCurrentList"
                        class="lpAdd"
                        title="Add this item to your list"
                        @click="addItemToCategory(item.id)"
                    ><i class="lpSprite lpSpriteAdd" /></a>
                    <a class="lpRemove lpRemoveLibraryItem speedbump" title="Delete this item permanently" @click="removeItem(item)"><i class="lpSprite lpSpriteRemove" /></a>
                    <div v-if="!mobileGear && !item.inCurrentList" class="lpHandle lpLibraryItemHandle" title="Reorder this item" />
                </div>
            </li>
        </ul>
    </section>
</template>

<script>
import utilsMixin from '../mixins/utils-mixin.js';
import { getResponsiveState, subscribeResponsiveState } from '../utils/responsive';

const dragula = require('dragula');

export default {
    name: 'LibraryItem',
    mixins: [utilsMixin],
    props: {
        mobileGear: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            searchText: '',
            itemDragId: false,
            drake: null,
            bulkSelectEnabled: false,
            selectedItemIds: [],
            bulkCategoryId: null,
            responsive: getResponsiveState(),
            unsubscribeResponsive: null,
        };
    },
    computed: {
        library() {
            return this.$store.state.library;
        },
        filteredItems() {
            let i;
            let item;
            let filteredItems = [];
            if (!this.searchText) {
                filteredItems = this.library.items.map((item) => Vue.util.extend({}, item));
            } else {
                const lowerCaseSearchText = this.searchText.toLowerCase();

                for (i = 0; i < this.library.items.length; i++) {
                    item = this.library.items[i];
                    if (item.name.toLowerCase().indexOf(lowerCaseSearchText) > -1 || item.description.toLowerCase().indexOf(lowerCaseSearchText) > -1) {
                        filteredItems.push(Vue.util.extend({}, item));
                    }
                }
            }

            const currentListItems = new Set(this.library.getItemsInCurrentList());

            for (i = 0; i < filteredItems.length; i++) {
                item = filteredItems[i];
                if (currentListItems.has(item.id)) {
                    item.inCurrentList = true;
                }
            }

            if (this.mobileGear) {
                return filteredItems.filter((listItem) => !listItem.inCurrentList);
            }

            return filteredItems;
        },
        list() {
            return this.library.getListById(this.library.defaultListId);
        },
        categories() {
            return this.list.categoryIds.map((id) => this.library.getCategoryById(id));
        },
        supportsMultiSelect() {
            return !this.mobileGear && !this.responsive.isNarrowViewport;
        },
    },
    watch: {
        categories() {
            Vue.nextTick(() => {
                if (!this.mobileGear) {
                    this.handleItemDrag();
                }
            });
            this.ensureBulkCategory();
        },
        'responsive.isCompactViewport': function () {
            this.updateBulkSelectForViewport();
        },
        'responsive.isCoarsePointer': function () {
            this.updateBulkSelectForViewport();
        },
    },
    mounted() {
        if (!this.mobileGear) {
            this.handleItemDrag();
        }
        this.updateBulkSelectForViewport();
        this.ensureBulkCategory();
        this.unsubscribeResponsive = subscribeResponsiveState();
    },
    beforeDestroy() {
        if (this.unsubscribeResponsive) {
            this.unsubscribeResponsive();
            this.unsubscribeResponsive = null;
        }
    },
    methods: {
        updateBulkSelectForViewport() {
            if (!this.supportsMultiSelect) {
                this.bulkSelectEnabled = false;
                this.clearSelection();
            }
        },
        ensureBulkCategory() {
            if (!this.bulkCategoryId && this.categories.length) {
                this.bulkCategoryId = this.categories[0].id;
            }
        },
        selectAllVisible() {
            const itemsToSelect = this.filteredItems
                .filter((item) => !item.inCurrentList)
                .map((item) => item.id);
            this.selectedItemIds = itemsToSelect;
        },
        clearSelection() {
            this.selectedItemIds = [];
        },
        addSelectedToCategory() {
            if (!this.selectedItemIds.length) {
                return;
            }
            const dropCategory = this.library.getCategoryById(this.bulkCategoryId) || this.categories[0];
            if (!dropCategory) {
                return;
            }
            const currentListItemIds = new Set(this.library.getItemsInCurrentList());
            let dropIndex = dropCategory.categoryItems.length;
            this.selectedItemIds.forEach((itemId) => {
                if (currentListItemIds.has(itemId)) {
                    return;
                }
                this.$store.commit('addItemToCategory', { itemId, categoryId: dropCategory.id, dropIndex });
                dropIndex += 1;
            });
            this.clearSelection();
        },
        addAllVisibleToCategory() {
            if (!this.filteredItems.length) {
                return;
            }
            const dropCategory = this.library.getCategoryById(this.bulkCategoryId) || this.categories[0];
            if (!dropCategory) {
                return;
            }
            let dropIndex = dropCategory.categoryItems.length;
            this.filteredItems.forEach((listItem) => {
                this.$store.commit('addItemToCategory', { itemId: listItem.id, categoryId: dropCategory.id, dropIndex });
                dropIndex += 1;
            });
        },
        addItemToCategory(itemId) {
            const dropCategory = this.library.getCategoryById(this.bulkCategoryId) || this.categories[0];
            if (!dropCategory) {
                return;
            }

            const currentListItemIds = new Set(this.library.getItemsInCurrentList());
            if (currentListItemIds.has(itemId)) {
                return;
            }

            this.$store.commit('addItemToCategory', {
                itemId,
                categoryId: dropCategory.id,
                dropIndex: dropCategory.categoryItems.length,
            });
        },
        handleItemDrag() {
            if (this.drake) {
                this.drake.destroy();
            }

            const self = this;
            const $library = document.getElementById('library');
            const $categoryItems = Array.prototype.slice.call(document.getElementsByClassName('lpItems')); // list.vue
            const drake = dragula([$library].concat($categoryItems), {
                copy: true,
                moves($el, $source, $handle, $sibling) {
                    const items = self.library.getItemsInCurrentList();
                    if (items.indexOf(parseInt($el.dataset.itemId)) > -1) {
                        return false;
                    }
                    return $handle.classList.contains('lpLibraryItemHandle');
                },
                accepts($el, $target, $source, $sibling) {
                    if ($target.id === 'library' || !$sibling || $sibling.classList.contains('lpItemsHeader')) {
                        return false; // header and footer are technically part of this list - exclude them both.
                    }
                    return true;
                },
            });
            drake.on('drag', ($el, $target, $source, $sibling) => {
                this.itemDragId = parseInt($el.dataset.itemId); // fragile
            });
            drake.on('drop', ($el, $target, $source, $sibling) => {
                if (!$target || $target.id === 'library') {
                    return;
                }
                const categoryId = parseInt($target.parentElement.id); // fragile
                this.$store.commit('addItemToCategory', { itemId: this.itemDragId, categoryId, dropIndex: getElementIndex($el) - 1 });
                drake.cancel(true);
            });
            this.drake = drake;
        },
        removeItem(item) {
            const callback = function () {
                this.$store.commit('removeItem', item);
            };
            const speedbumpOptions = {
                body: 'Are you sure you want to delete this item? This cannot be undone.',
            };
            bus.$emit('initSpeedbump', callback, speedbumpOptions);
        },
    },
};
</script>
