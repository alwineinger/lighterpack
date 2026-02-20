const express = require('express');
const generate = require('nanoid/generate');
const mongojs = require('mongojs');
const config = require('config');

const dataTypes = require('../client/dataTypes.js');
const { authenticateUser } = require('./auth.js');
const { logWithRequest } = require('./log.js');

const Library = dataTypes.Library;

const router = express.Router();
const db = mongojs(config.get('databaseUrl'), ['users', 'trips']);

function apiError(res, status, code, message, details) {
    return res.status(status).json({
        error: {
            code,
            message,
            details: details || null,
        },
    });
}

function ensureLibraryMetadata(user) {
    if (!user.libraryMeta) {
        user.libraryMeta = {
            updatedAt: new Date().toISOString(),
            deletedPacks: [],
        };
    }
    if (!Array.isArray(user.libraryMeta.deletedPacks)) {
        user.libraryMeta.deletedPacks = [];
    }
}

function withAuthenticatedUser(req, res, handler) {
    return authenticateUser(req, res, (_req, _res, user) => {
        ensureLibraryMetadata(user);
        return handler(user);
    });
}

function parseObjectId(value) {
    try {
        return mongojs.ObjectId(value);
    } catch (err) {
        return null;
    }
}

function trimLower(value) {
    return String(value || '').toLowerCase().trim();
}

function normalizeTripRole(role) {
    if (role === 'viewer') return 'viewer';
    return 'editor';
}

function canManageTrip(trip, user) {
    return trip.ownerUserId === user._id.toString();
}

function userTripRole(trip, user) {
    if (trip.ownerUserId === user._id.toString()) {
        return 'owner';
    }
    const member = (trip.members || []).find((candidate) => candidate.userId === user._id.toString());
    return member ? member.role : null;
}

function buildTripSummary(trip, user) {
    return {
        id: trip._id.toString(),
        name: trip.name,
        role: userTripRole(trip, user),
        ownerUserId: trip.ownerUserId,
        updatedAt: trip.updatedAt,
    };
}

function getUserById(userId, callback) {
    db.users.find({ _id: parseObjectId(userId) }, (err, users) => {
        if (err) return callback(err);
        callback(null, users[0] || null);
    });
}

function getSharedListForMember(member, callback) {
    if (!member || !member.userId || !member.listId) {
        return callback(null, null);
    }
    getUserById(member.userId, (err, memberUser) => {
        if (err || !memberUser) {
            return callback(err, null);
        }
        const library = loadLibraryForUser(memberUser);
        const list = library.getListById(member.listId);
        if (!list) {
            return callback(null, null);
        }
        return callback(null, { memberUser, library, list });
    });
}

function loadLibraryForUser(user) {
    const library = new Library();
    library.load(user.library || new Library().save());
    return library;
}

function saveLibraryForUser(user, library, callback) {
    user.library = library.save();
    user.libraryMeta.updatedAt = new Date().toISOString();
    db.users.save(user, callback);
}

router.get('/api/v1/session', (req, res) => {
    withAuthenticatedUser(req, res, (user) => res.status(200).json({
        data: {
            username: user.username,
            syncToken: user.syncToken || 0,
            library: user.library || new Library().save(),
            updatedAt: user.libraryMeta.updatedAt,
            deletedPacks: user.libraryMeta.deletedPacks,
        },
    }));
});

router.get('/api/v1/packs', (req, res) => {
    withAuthenticatedUser(req, res, (user) => {
        const library = loadLibraryForUser(user);
        const packs = library.lists.map((list) => ({
            id: list.id,
            name: list.name,
            description: list.description,
            externalId: list.externalId || null,
            updatedAt: list.updatedAt || user.libraryMeta.updatedAt,
        }));

        return res.status(200).json({
            data: packs,
            meta: {
                page: 1,
                pageSize: packs.length,
                total: packs.length,
                deletedPacks: user.libraryMeta.deletedPacks,
            },
        });
    });
});

router.post('/api/v1/packs/:packId/share', (req, res) => {
    withAuthenticatedUser(req, res, (user) => {
        const packId = parseInt(req.params.packId, 10);
        if (Number.isNaN(packId)) {
            return apiError(res, 400, 'INVALID_PACK_ID', 'Pack id must be an integer.');
        }

        const library = loadLibraryForUser(user);
        const list = library.getListById(packId);

        if (!list) {
            return apiError(res, 404, 'PACK_NOT_FOUND', 'Pack not found.');
        }

        if (list.externalId) {
            return res.status(200).json({ data: { externalId: list.externalId } });
        }

        const id = generate('1234567890abcdefghijklmnopqrstuvwxyz', 6);
        db.users.find({ 'library.lists.externalId': id }, (err, users) => {
            if (err) {
                logWithRequest(req, { message: 'api external id lookup error', err });
                return apiError(res, 500, 'INTERNAL_ERROR', 'Unable to create share id.');
            }

            if (users.length) {
                return apiError(res, 409, 'SHARE_ID_COLLISION', 'Please retry creating share id.');
            }

            list.externalId = id;
            list.updatedAt = new Date().toISOString();

            if (!Array.isArray(user.externalIds)) {
                user.externalIds = [];
            }
            user.externalIds.push(id);

            return saveLibraryForUser(user, library, () => res.status(201).json({ data: { externalId: id } }));
        });
    });
});

router.put('/api/v1/library', (req, res) => {
    withAuthenticatedUser(req, res, (user) => {
        if (typeof req.body.syncToken === 'undefined') {
            return apiError(res, 400, 'MISSING_SYNC_TOKEN', 'syncToken is required.');
        }

        if (req.body.syncToken !== user.syncToken) {
            return apiError(res, 409, 'STALE_SYNC_TOKEN', 'Your local data is out of date. Refresh and retry.');
        }

        const inputLibrary = req.body.library;
        if (!inputLibrary || typeof inputLibrary !== 'object') {
            return apiError(res, 400, 'INVALID_LIBRARY', 'library payload must be an object.');
        }

        const library = new Library();
        try {
            library.load(inputLibrary);
        } catch (err) {
            logWithRequest(req, { message: 'api library parse error', err: err.message });
            return apiError(res, 400, 'INVALID_LIBRARY', 'Unable to parse library payload.');
        }

        user.syncToken = (user.syncToken || 0) + 1;

        return saveLibraryForUser(user, library, () => res.status(200).json({
            data: {
                syncToken: user.syncToken,
                updatedAt: user.libraryMeta.updatedAt,
            },
        }));
    });
});

router.get('/api/v1/trips', (req, res) => {
    withAuthenticatedUser(req, res, (user) => {
        db.trips.find({
            $or: [
                { ownerUserId: user._id.toString() },
                { 'members.userId': user._id.toString() },
                { 'invitations.email': trimLower(user.email) },
            ],
        }, (err, trips) => {
            if (err) {
                return apiError(res, 500, 'INTERNAL_ERROR', 'Unable to load trips.');
            }
            const out = (trips || []).map((trip) => buildTripSummary(trip, user));
            return res.status(200).json({ data: out });
        });
    });
});

router.post('/api/v1/trips', (req, res) => {
    withAuthenticatedUser(req, res, (user) => {
        const name = String(req.body.name || '').trim();
        if (!name) {
            return apiError(res, 400, 'INVALID_TRIP_NAME', 'Trip name is required.');
        }
        const trip = {
            name,
            ownerUserId: user._id.toString(),
            members: [{
                userId: user._id.toString(),
                username: user.username,
                email: trimLower(user.email),
                role: 'owner',
                listId: user.library && user.library.defaultListId,
                visibility: 'full',
            }],
            invitations: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        db.trips.save(trip, (err, saved) => {
            if (err) {
                return apiError(res, 500, 'INTERNAL_ERROR', 'Unable to create trip.');
            }
            return res.status(201).json({ data: buildTripSummary(saved, user) });
        });
    });
});

router.post('/api/v1/trips/:tripId/invitations', (req, res) => {
    withAuthenticatedUser(req, res, (user) => {
        const tripObjectId = parseObjectId(req.params.tripId);
        if (!tripObjectId) {
            return apiError(res, 400, 'INVALID_TRIP_ID', 'Trip id is invalid.');
        }
        db.trips.find({ _id: tripObjectId }, (err, trips) => {
            if (err || !trips.length) {
                return apiError(res, 404, 'TRIP_NOT_FOUND', 'Trip not found.');
            }
            const trip = trips[0];
            if (!canManageTrip(trip, user)) {
                return apiError(res, 403, 'FORBIDDEN', 'Only owner can invite users.');
            }
            const email = trimLower(req.body.email);
            if (!email) {
                return apiError(res, 400, 'INVALID_EMAIL', 'Email is required.');
            }
            const role = normalizeTripRole(req.body.role);
            const invite = {
                token: generate('1234567890abcdefghijklmnopqrstuvwxyz', 24),
                email,
                role,
                createdAt: new Date().toISOString(),
            };
            trip.invitations = trip.invitations || [];
            trip.invitations.push(invite);
            trip.updatedAt = new Date().toISOString();
            db.trips.save(trip, (saveErr) => {
                if (saveErr) {
                    return apiError(res, 500, 'INTERNAL_ERROR', 'Unable to save invitation.');
                }
                return res.status(201).json({ data: invite });
            });
        });
    });
});

router.post('/api/v1/trips/:tripId/accept', (req, res) => {
    withAuthenticatedUser(req, res, (user) => {
        const tripObjectId = parseObjectId(req.params.tripId);
        if (!tripObjectId) {
            return apiError(res, 400, 'INVALID_TRIP_ID', 'Trip id is invalid.');
        }
        db.trips.find({ _id: tripObjectId }, (err, trips) => {
            if (err || !trips.length) {
                return apiError(res, 404, 'TRIP_NOT_FOUND', 'Trip not found.');
            }
            const trip = trips[0];
            const inviteToken = String(req.body.inviteToken || '').trim();
            const invitation = (trip.invitations || []).find((invite) => invite.token === inviteToken && invite.email === trimLower(user.email));
            if (!invitation) {
                return apiError(res, 404, 'INVITE_NOT_FOUND', 'Invitation not found.');
            }
            const library = loadLibraryForUser(user);
            const listId = parseInt(req.body.listId, 10);
            const list = library.getListById(listId);
            if (!list) {
                return apiError(res, 400, 'INVALID_LIST', 'Selected list does not exist.');
            }
            trip.members = trip.members || [];
            trip.members = trip.members.filter((member) => member.userId !== user._id.toString());
            trip.members.push({
                userId: user._id.toString(),
                username: user.username,
                email: trimLower(user.email),
                role: invitation.role,
                listId,
                visibility: req.body.visibility === 'summary' ? 'summary' : 'full',
            });
            trip.invitations = trip.invitations.filter((invite) => invite.token !== inviteToken);
            trip.updatedAt = new Date().toISOString();
            db.trips.save(trip, (saveErr) => {
                if (saveErr) {
                    return apiError(res, 500, 'INTERNAL_ERROR', 'Unable to accept invitation.');
                }
                return res.status(200).json({ data: { accepted: true } });
            });
        });
    });
});

router.put('/api/v1/trips/:tripId/member-list', (req, res) => {
    withAuthenticatedUser(req, res, (user) => {
        const tripObjectId = parseObjectId(req.params.tripId);
        if (!tripObjectId) {
            return apiError(res, 400, 'INVALID_TRIP_ID', 'Trip id is invalid.');
        }

        db.trips.find({ _id: tripObjectId }, (err, trips) => {
            if (err || !trips.length) {
                return apiError(res, 404, 'TRIP_NOT_FOUND', 'Trip not found.');
            }

            const trip = trips[0];
            const memberIndex = (trip.members || []).findIndex((member) => member.userId === user._id.toString());
            if (memberIndex === -1) {
                return apiError(res, 403, 'FORBIDDEN', 'No access to update this trip membership.');
            }

            const library = loadLibraryForUser(user);
            const listId = parseInt(req.body.listId, 10);
            const list = library.getListById(listId);
            if (!list) {
                return apiError(res, 400, 'INVALID_LIST', 'Selected list does not exist.');
            }

            trip.members[memberIndex] = {
                ...trip.members[memberIndex],
                listId,
            };

            trip.updatedAt = new Date().toISOString();
            db.trips.save(trip, (saveErr) => {
                if (saveErr) {
                    return apiError(res, 500, 'INTERNAL_ERROR', 'Unable to update shared list.');
                }
                return res.status(200).json({ data: { listId } });
            });
        });
    });
});

router.get('/api/v1/trips/:tripId', (req, res) => {
    withAuthenticatedUser(req, res, (user) => {
        const tripObjectId = parseObjectId(req.params.tripId);
        if (!tripObjectId) {
            return apiError(res, 400, 'INVALID_TRIP_ID', 'Trip id is invalid.');
        }
        db.trips.find({ _id: tripObjectId }, (err, trips) => {
            if (err || !trips.length) {
                return apiError(res, 404, 'TRIP_NOT_FOUND', 'Trip not found.');
            }
            const trip = trips[0];
            const role = userTripRole(trip, user);
            const pendingInvitation = (trip.invitations || []).find((invite) => invite.email === trimLower(user.email));
            if (!role && !pendingInvitation) {
                return apiError(res, 403, 'FORBIDDEN', 'No access to this trip.');
            }

            const members = [];
            const groupGearByUser = [];
            let pending = trip.members ? trip.members.length : 0;
            if (!pending) {
                return res.status(200).json({
                    data: {
                        id: trip._id.toString(),
                        name: trip.name,
                        canManage: canManageTrip(trip, user),
                        currentUserMember: (trip.members || []).find((member) => member.userId === user._id.toString()) || null,
                        pendingInvitation,
                        members,
                        totalUnit: 'oz',
                        groupGearByUser,
                    },
                });
            }

            trip.members.forEach((member) => {
                getSharedListForMember(member, (memberErr, payload) => {
                    pending -= 1;
                    if (!memberErr && payload) {
                        const { library, list } = payload;
                        list.calculateTotals();
                        members.push({
                            userId: member.userId,
                            username: member.username,
                            email: member.email,
                            role: member.role,
                            visibility: member.visibility,
                            listName: list.name,
                            totalWeight: list.totalWeight,
                        });

                        const groupItems = [];
                        list.categoryIds.forEach((categoryId) => {
                            const category = library.getCategoryById(categoryId);
                            if (!category) return;
                            category.categoryItems.forEach((categoryItem) => {
                                if (!categoryItem.group) return;
                                const item = library.getItemById(categoryItem.itemId);
                                if (!item) return;
                                groupItems.push({
                                    itemId: item.id,
                                    categoryId: category.id,
                                    name: member.visibility === 'summary' ? 'Hidden item' : item.name,
                                    categoryName: category.name,
                                    qty: categoryItem.qty,
                                    weightMg: item.weight * categoryItem.qty,
                                });
                            });
                        });
                        const totalWeightMg = groupItems.reduce((sum, item) => sum + item.weightMg, 0);
                        groupGearByUser.push({
                            userKey: member.userId,
                            label: member.username || member.email,
                            items: groupItems.sort((a, b) => b.weightMg - a.weightMg).map((item) => ({ ...item, weightDisplay: (item.weightMg / 28349.5).toFixed(2) })),
                            totalWeightMg,
                            totalWeightDisplay: (totalWeightMg / 28349.5).toFixed(2),
                        });
                    }
                    if (!pending) {
                        groupGearByUser.sort((a, b) => b.totalWeightMg - a.totalWeightMg);
                        return res.status(200).json({
                            data: {
                                id: trip._id.toString(),
                                name: trip.name,
                                canManage: canManageTrip(trip, user),
                                currentUserMember: (trip.members || []).find((member) => member.userId === user._id.toString()) || null,
                                pendingInvitation,
                                members,
                                totalUnit: 'oz',
                                groupGearByUser,
                            },
                        });
                    }
                });
            });
        });
    });
});

module.exports = router;
