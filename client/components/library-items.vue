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
    display: inline-flex;
    margin-right: 6px;
}

.lpLibrarySelect input[type="checkbox"] {
    transform: translateY(2px);
}

.lpLibraryItem {
    border-top: 1px dotted #999;
    list-style: none;
    margin: 0 10px 5px;
    min-height: 43px;
    overflow: hidden;
    padding: 5px 5px 0 15px;
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
        float: left;
        margin: 0;
        max-width: 190px;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .lpWeight {
        float: right;
        width: auto;
    }

    .lpDescription {
        clear: both;
        color: #ccc;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 235px;
    }

    .lpHandle {
        height: 80px;
        left: 0;
        position: absolute;
        top: 5px;
    }

    .lpRemove {
        bottom: 0;
        position: absolute;
        right: 14px;
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
        width: 235px;
    }
}

.lpLibraryItem.isMobileGear {
    margin: 0 0 10px;
    padding: 10px;
    width: 100%;
    box-sizing: border-box;
}

.lpLibraryItem.isMobileGear .lpName,
.lpLibraryItem.isMobileGear .lpDescription {
    float: none;
    max-width: none;
    width: auto;
}

.lpLibraryItem.isMobileGear .lpWeight {
    float: none;
    margin-top: 2px;
}

@media (max-width: 900px) {
    #library {
        max-height: 55vh;
    }

    #libraryContainer.lpMobileGearView #library {
        max-height: none;
    }

    .lpLibraryItem {
        margin: 0 0 8px;
        padding-left: 10px;
    }
}
</style>

<template>
    <section id="libraryContainer" :class="{lpMobileGearView: mobileGear}">
        <h2>Gear</h2>
        <div id="libraryToolbar">
            <input id="librarySearch" v-model="searchText" type="text" placeholder="search items">
            <div v-if="!mobileGear" class="lpBulkAddBar">
                <label class="lpBulkToggle">
                    <input type="checkbox" v-model="bulkSelectEnabled">
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
                <button
                    class="lpButton lpSmall"
                    type="button"
                    :disabled="filteredItems.length === 0"
                    @click="addAllVisibleToCategory"
                >
                    Add all visible ({{ filteredItems.length }})
                </button>
            </div>
        </div>
        <ul id="library">
            <li v-for="item in filteredItems" class="lpLibraryItem" :class="{isMobileGear: mobileGear}" :data-item-id="item.id">
                <label v-if="!mobileGear && bulkSelectEnabled" class="lpLibrarySelect">
                    <input
                        type="checkbox"
                        :value="item.id"
                        v-model="selectedItemIds"
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
                <a class="lpRemove lpRemoveLibraryItem speedbump" title="Delete this item permanently" @click="removeItem(item)"><i class="lpSprite lpSpriteRemove" /></a>
                <div v-if="!mobileGear && !item.inCurrentList" class="lpHandle lpLibraryItemHandle" title="Reorder this item" />
            </li>
        </ul>
    </section>
</template>

<script>
import utilsMixin from '../mixins/utils-mixin.js';

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
            isMobile: false,
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
                filteredItems = this.library.items.map(item => Vue.util.extend({}, item));
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
                return filteredItems.filter(listItem => !listItem.inCurrentList);
            }

            return filteredItems;
        },
        list() {
            return this.library.getListById(this.library.defaultListId);
        },
        categories() {
            return this.list.categoryIds.map(id => this.library.getCategoryById(id));
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
    },
    mounted() {
        if (!this.mobileGear) {
            this.handleItemDrag();
        }
        this.updateIsMobile();
        this.ensureBulkCategory();
        window.addEventListener('resize', this.updateIsMobile);
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.updateIsMobile);
    },
    methods: {
        updateIsMobile() {
            this.isMobile = window.matchMedia('(max-width: 900px)').matches;
            if (this.isMobile && !this.mobileGear && !this.bulkSelectEnabled) {
                this.bulkSelectEnabled = true;
            }
        },
        ensureBulkCategory() {
            if (!this.bulkCategoryId && this.categories.length) {
                this.bulkCategoryId = this.categories[0].id;
            }
        },
        selectAllVisible() {
            const itemsToSelect = this.filteredItems
                .filter(item => !item.inCurrentList)
                .map(item => item.id);
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
