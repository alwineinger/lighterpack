import dashboard from './views/dashboard.vue';
import welcome from './views/welcome.vue';
import signin from './views/signin.vue';
import register from './views/register.vue';
import forgotPassword from './views/forgot-password.vue';
import moderation from './views/moderation.vue';
import mobileLists from './views/mobile-lists.vue';
import mobileGear from './views/mobile-gear.vue';
import mobileTrips from './views/mobile-trips.vue';
import trip from './views/trip.vue';

export default [
    { path: '/', component: dashboard },
    { path: '/welcome', component: welcome },
    { path: '/signin', component: signin },
    { path: '/signin/reset-password', component: signin },
    { path: '/signin/forgot-username', component: signin },
    { path: '/register', component: register },
    { path: '/forgot-password', component: forgotPassword },
    { path: '/lists', component: mobileLists },
    { path: '/gear', component: mobileGear },
    { path: '/trips', component: mobileTrips },
    { path: '/trips/:tripId', component: trip },
    { path: '/moderation', component: moderation },
    { path: '*', component: dashboard },
];
