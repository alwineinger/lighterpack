const express = require('express');
const generate = require('nanoid/generate');
const mongojs = require('mongojs');
const config = require('config');

const dataTypes = require('../client/dataTypes.js');
const { authenticateUser } = require('./auth.js');
const { logWithRequest } = require('./log.js');

const Library = dataTypes.Library;

const router = express.Router();
const db = mongojs(config.get('databaseUrl'), ['users']);

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

module.exports = router;
