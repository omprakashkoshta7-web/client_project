const designService = require('../services/design.service');
const { sendSuccess, sendCreated } = require('../../../../shared/utils/response');

const saveDesign = async (req, res, next) => {
    try {
        const data = await designService.saveDesign(req.headers['x-user-id'], req.body);
        return sendCreated(res, data, 'Design saved');
    } catch (err) {
        next(err);
    }
};

const updateDesign = async (req, res, next) => {
    try {
        const data = await designService.updateDesign(
            req.headers['x-user-id'],
            req.params.id,
            req.body
        );
        return sendSuccess(res, data, 'Design updated');
    } catch (err) {
        next(err);
    }
};


const getDesign = async (req, res, next) => {
    try {
        const data = await designService.getDesignById(req.headers['x-user-id'], req.params.id);
        return sendSuccess(res, data);
    } catch (err) {
        next(err);
    }
};

const getMyDesigns = async (req, res, next) => {
    try {
        const data = await designService.getUserDesigns(
            req.headers['x-user-id'],
            {
                productId: req.query.productId,
                finalized: req.query.finalized,
                savedOnly: req.query.savedOnly,
            }
        );
        return sendSuccess(res, data);
    } catch (err) {
        next(err);
    }
};

const markApproved = async (req, res, next) => {
    try {
        const data = await designService.markDesignApproved(
            req.headers['x-user-id'],
            req.params.id,
            req.body.orderId
        );
        return sendSuccess(res, data, 'Design approved');
    } catch (err) {
        next(err);
    }
};

const getTemplates = async (req, res, next) => {
    try {
        const data = await designService.getTemplates(req.query);
        return sendSuccess(res, data);
    } catch (err) {
        next(err);
    }
};

const getPremiumTemplates = async (req, res, next) => {
    try {
        const data = await designService.getPremiumTemplates(
            req.query.productId,
            req.query.category
        );
        return sendSuccess(res, data);
    } catch (err) {
        next(err);
    }
};

const createBlankDesign = async (req, res, next) => {
    try {
        const data = await designService.createBlankDesign(req.headers['x-user-id'], req.body);
        return sendCreated(res, data, 'Blank canvas created');
    } catch (err) {
        next(err);
    }
};

const createFromTemplate = async (req, res, next) => {
    try {
        const data = await designService.createFromTemplate(req.headers['x-user-id'], req.body);
        return sendCreated(res, data, 'Design created from template');
    } catch (err) {
        next(err);
    }
};

// Frame management controllers
const addFrame = async (req, res, next) => {
    try {
        const data = await designService.addFrame(
            req.headers['x-user-id'],
            req.params.designId,
            req.body
        );
        return sendCreated(res, data, 'Frame added successfully');
    } catch (err) {
        next(err);
    }
};

const getFrames = async (req, res, next) => {
    try {
        const data = await designService.getFrames(
            req.headers['x-user-id'],
            req.params.designId
        );
        return sendSuccess(res, data);
    } catch (err) {
        next(err);
    }
};

const updateFrame = async (req, res, next) => {
    try {
        const data = await designService.updateFrame(
            req.headers['x-user-id'],
            req.params.designId,
            req.params.frameId,
            req.body
        );
        return sendSuccess(res, data, 'Frame updated successfully');
    } catch (err) {
        next(err);
    }
};

const deleteFrame = async (req, res, next) => {
    try {
        const data = await designService.deleteFrame(
            req.headers['x-user-id'],
            req.params.designId,
            req.params.frameId
        );
        return sendSuccess(res, data, 'Frame deleted successfully');
    } catch (err) {
        next(err);
    }
};

const reorderFrames = async (req, res, next) => {
    try {
        const data = await designService.reorderFrames(
            req.headers['x-user-id'],
            req.params.designId,
            req.body.frameIds
        );
        return sendSuccess(res, data, 'Frames reordered successfully');
    } catch (err) {
        next(err);
    }
};

const getProductFrames = async (req, res, next) => {
    try {
        const frames = await designService.getProductFrames(req.params.productId);
        return sendSuccess(res, frames);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    saveDesign,
    updateDesign,
    getDesign,
    getMyDesigns,
    getTemplates,
    getPremiumTemplates,
    createBlankDesign,
    createFromTemplate,
    markApproved,
    addFrame,
    getFrames,
    updateFrame,
    deleteFrame,
    reorderFrames,
    getProductFrames,
};
