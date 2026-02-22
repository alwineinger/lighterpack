<style lang="scss">
@import "../css/_globals";

.lpGlobalAlerts {
    background: $yellow1;
    border: 1px solid $darkYellow;
    border-radius: 0 0 10px 10px;
    border-top: none;
    left: 50%;
    margin: 0;
    padding: 0;
    position: fixed;
    text-align: center;
    top: 0;
    transform: translateX(-50%);
    width: 50%;
    z-index: $aboveDialog;
}

.lpGlobalAlert {
    border-bottom: 1px solid $darkYellow;
    list-style-type: none;
    margin: 0;
    padding: $spacingMedium;
    position: relative;

    &:last-child {
        border-bottom: none;
    }
}

.lpGlobalAlertClose {
    background: none;
    border: none;
    color: $darkYellow;
    cursor: pointer;
    font-size: 14px;
    padding: 0;
    position: absolute;
    right: 10px;
    top: 8px;
}
</style>

<template>
    <ul v-if="alerts && alerts.length" class="lpGlobalAlerts">
        <li v-for="(alert, index) in alerts" class="lpGlobalAlert">
            {{ alert.message }}
            <button class="lpGlobalAlertClose" type="button" @click="dismiss(index)">×</button>
        </li>
    </ul>
</template>

<script>

export default {
    name: 'GlobalAlerts',
    computed: {
        alerts() {
            return this.$store.state.globalAlerts;
        },
    },
    methods: {
        dismiss(index) {
            this.$store.state.globalAlerts.splice(index, 1);
        },
    },
};
</script>
