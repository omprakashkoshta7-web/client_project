const VendorOrg = require('../models/vendor-org.model');
const Store = require('../models/store.model');
const VendorStaff = require('../models/vendor-staff.model');


const getOrCreateOrg = async (userId) => {
    let org = await VendorOrg.findOne({ userId, deletedAt: null });
    if (!org) {
        org = await VendorOrg.create({ userId, businessName: 'My Business' });
    }
    return org;
};

const updateOrg = async (userId, data) => {
    const org = await VendorOrg.findOneAndUpdate({ userId, deletedAt: null }, data, {
        new: true,
        upsert: true,
        runValidators: true,
    });
    return org;
};


const getStores = async (vendorId) => {
    return Store.find({ vendorId, deletedAt: null }).sort({ createdAt: -1 });
};

const getStoreById = async (vendorId, storeId) => {
    const store = await Store.findOne({ _id: storeId, vendorId, deletedAt: null });
    if (!store) {
        const err = new Error('Store not found');
        err.statusCode = 404;
        throw err;
    }
    return store;
};

const createStore = async (vendorId, userId, data) => {
    const payload = {
        ...data,
        vendorId,
        userId,
        internalCode: data.internalCode || `${vendorId}-${Date.now()}`,
    };
    if (data.capacity?.dailyLimit && !data.capacity?.maxOrdersPerDay) {
        payload.capacity = {
            ...data.capacity,
            maxOrdersPerDay: data.capacity.dailyLimit,
        };
    }
    return Store.create(payload);
};

const updateStore = async (vendorId, storeId, data) => {
    const store = await Store.findOneAndUpdate({ _id: storeId, vendorId, deletedAt: null }, data, {
        new: true,
        runValidators: true,
    });
    if (!store) {
        const err = new Error('Store not found');
        err.statusCode = 404;
        throw err;
    }
    return store;
};

const updateStoreStatus = async (vendorId, storeId, isActive) => {
    return updateStore(vendorId, storeId, { isActive });
};

const updateStoreCapacity = async (vendorId, storeId, capacity) => {
    return updateStore(vendorId, storeId, { capacity });
};

const updateStoreAvailability = async (vendorId, storeId, isAvailable) => {
    return updateStore(vendorId, storeId, {
        isAvailable,
        availabilityReason: isAvailable ? '' : 'Marked unavailable by vendor',
    });
};


const getStaff = async (vendorId) => {
    return VendorStaff.find({ vendorId, deletedAt: null }).sort({ createdAt: -1 });
};

const createStaff = async (vendorId, data) => {
    return VendorStaff.create({
        ...data,
        vendorId,
        assignedStoreIds: data.assignedStoreIds || (data.storeId ? [data.storeId] : []),
        isFinancialAccessEnabled: false,
    });
};

const updateStaff = async (vendorId, staffId, data) => {
    const staff = await VendorStaff.findOneAndUpdate(
        { _id: staffId, vendorId, deletedAt: null },
        data,
        { new: true, runValidators: true }
    );
    if (!staff) {
        const err = new Error('Staff member not found');
        err.statusCode = 404;
        throw err;
    }
    return staff;
};

const updateStaffStatus = async (vendorId, staffId, isActive) => {
    return updateStaff(vendorId, staffId, { isActive });
};

const assignStaffStores = async (vendorId, staffId, assignedStoreIds) => {
    return updateStaff(vendorId, staffId, {
        assignedStoreIds,
        storeId: assignedStoreIds?.[0] || '',
    });
};


const getNearbyStores = async (userLat, userLng, radiusKm = 10, limit = 20, pincode = null) => {
    console.log('getNearbyStores service called with:', { userLat, userLng, radiusKm, limit, pincode });
    
    const normalizedLimit = Math.max(1, Number(limit) || 20);
    const normalizedRadiusKm = Math.max(1, Number(radiusKm) || 10);
    const radiusMeters = normalizedRadiusKm * 1000;
    const hasGeoCoordinates = Number.isFinite(userLat) && Number.isFinite(userLng);
    const hasPincode = pincode && String(pincode).trim().length > 0;

    console.log('Processed params:', { hasGeoCoordinates, hasPincode, normalizedLimit, normalizedRadiusKm });

    const baseMatch = {
        isActive: true,
        isAvailable: true,
        deletedAt: null,
    };

    // Add pincode filter if provided
    if (hasPincode) {
        baseMatch['address.pincode'] = String(pincode).trim();
        console.log('Added pincode filter:', baseMatch['address.pincode']);
    }

    console.log('Base match criteria:', baseMatch);

    const pipeline = [];

    if (hasGeoCoordinates && !hasPincode) {
        // Use geospatial search only if no pincode is specified
        pipeline.push({
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [userLng, userLat], // Note: MongoDB uses [lng, lat]
                },
                distanceField: 'distance',
                maxDistance: radiusMeters,
                spherical: true,
                query: {
                    ...baseMatch,
                    'location.lat': { $exists: true },
                    'location.lng': { $exists: true },
                },
            },
        });
    } else {
        // Use regular match for pincode search or when no coordinates
        pipeline.push({
            $match: baseMatch,
        });
        
        // Add distance calculation if coordinates are available (for sorting)
        if (hasGeoCoordinates) {
            pipeline.push({
                $addFields: {
                    distance: {
                        $cond: {
                            if: {
                                $and: [
                                    { $ne: ['$location.lat', null] },
                                    { $ne: ['$location.lng', null] }
                                ]
                            },
                            then: {
                                $multiply: [
                                    {
                                        $sqrt: {
                                            $add: [
                                                {
                                                    $pow: [
                                                        {
                                                            $multiply: [
                                                                { $subtract: ['$location.lat', userLat] },
                                                                111320
                                                            ]
                                                        },
                                                        2
                                                    ]
                                                },
                                                {
                                                    $pow: [
                                                        {
                                                            $multiply: [
                                                                { $subtract: ['$location.lng', userLng] },
                                                                { $multiply: [111320, { $cos: { $multiply: [userLat, Math.PI / 180] } }] }
                                                            ]
                                                        },
                                                        2
                                                    ]
                                                }
                                            ]
                                        }
                                    },
                                    1
                                ]
                            },
                            else: null
                        }
                    }
                }
            });
        }
    }

    pipeline.push(
        {
            $lookup: {
                from: 'vendororgs',
                localField: 'vendorId',
                foreignField: 'userId',
                as: 'vendorOrg',
            },
        },
        {
            $unwind: '$vendorOrg',
        },
        {
            $match: {
                'vendorOrg.isApproved': true,
                'vendorOrg.isSuspended': { $ne: true },
            },
        },
        {
            $project: {
                _id: 1,
                name: 1,
                address: 1,
                location: 1,
                workingHours: 1,
                supportedFlows: 1,
                capacity: 1,
                isActive: 1,
                isAvailable: 1,
                distance: hasGeoCoordinates ? '$distance' : null,
                createdAt: 1,
            },
        },
        {
            $sort: hasGeoCoordinates ? { distance: 1 } : { createdAt: -1 },
        },
        {
            $limit: normalizedLimit,
        },
    );

    const stores = await Store.aggregate(pipeline);

    console.log('Pipeline executed:', JSON.stringify(pipeline, null, 2));
    console.log('Found stores:', stores.length, stores);

    return {
        stores,
        totalFound: stores.length,
        searchLocation: hasGeoCoordinates ? { lat: userLat, lng: userLng } : null,
        searchRadius: normalizedRadiusKm,
        searchPincode: hasPincode ? String(pincode).trim() : null,
    };
};

// ─── Analytics ────────────────────────────────────────────

const getPerformance = async (vendorId) => {
    // Basic performance stats — can be enriched later with order-service data
    const [totalStores, activeStores, totalStaff] = await Promise.all([
        Store.countDocuments({ vendorId, deletedAt: null }),
        Store.countDocuments({ vendorId, isActive: true, deletedAt: null }),
        VendorStaff.countDocuments({ vendorId, isActive: true, deletedAt: null }),
    ]);

    const capacitySnapshot = await Store.find({ vendorId, deletedAt: null })
        .select('name capacity isAvailable availabilityReason')
        .lean();

    return { totalStores, activeStores, totalStaff, capacitySnapshot };
};

module.exports = {
    getOrCreateOrg,
    updateOrg,
    getStores,
    getStoreById,
    createStore,
    updateStore,
    updateStoreStatus,
    updateStoreCapacity,
    updateStoreAvailability,
    getNearbyStores,
    getStaff,
    createStaff,
    updateStaff,
    updateStaffStatus,
    assignStaffStores,
    getPerformance,
};
