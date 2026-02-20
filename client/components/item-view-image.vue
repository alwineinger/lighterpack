<style lang="scss">

#lpImageDialog {
    max-width: min(640px, 100%);

    img {
        display: block;
        height: auto;
        max-height: 70vh;
        max-width: 100%;
    }

    .imageUploadDescription {
        margin-bottom: 19px;
    }
}

</style>

<template>
    <modal id="lpImageDialog" :shown="shown" @hide="shown = false">
        <img :src="imageUrl">
    </modal>
</template>

<script>
import modal from './modal.vue';

export default {
    name: 'ItemViewImage',
    components: {
        modal,
    },
    data() {
        return {
            imageUrl: '',
            shown: false,
        };
    },
    mounted() {
        bus.$on('viewItemImage', (imageUrl) => {
            this.shown = true;
            this.imageUrl = imageUrl;
        });
    },
};
</script>
