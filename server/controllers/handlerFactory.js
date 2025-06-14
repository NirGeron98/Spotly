const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const APIFeatures = require("./../utils/apiFeatures");
const mongoose = require("mongoose");
const { filterObj } = require("./../utils/filterObj");

exports.deleteOne = (Model, options = {}) =>
  catchAsync(async (req, res, next) => {
    // Pre-operation hook
    if (options.beforeDelete) {
      await options.beforeDelete(req);
    }

    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    // Post-operation hook
    if (options.afterDelete) {
      await options.afterDelete(doc, req);
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

exports.updateOne = (Model, options = {}) =>
  catchAsync(async (req, res, next) => {
    // Pre-operation hook
    if (options.beforeUpdate) {
      await options.beforeUpdate(req);
    }

    // Filter allowed fields if specified
    const data = options.allowedFields
      ? filterObj(req.body, ...options.allowedFields)
      : req.body;

    const doc = await Model.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    // Post-operation hook
    if (options.afterUpdate) {
      await options.afterUpdate(doc, req);
    }

    // Apply custom response transform if provided
    const responseData = options.transform ? options.transform(doc) : doc;

    res.status(200).json({
      status: "success",
      data: {
        data: responseData,
      },
    });
  });

exports.createOne = (Model, options = {}) =>
  catchAsync(async (req, res, next) => {
    // Pre-operation hook
    if (options.beforeCreate) {
      await options.beforeCreate(req);
    }

    // Filter allowed fields if specified
    const data = options.allowedFields
      ? filterObj(req.body, ...options.allowedFields)
      : req.body;

    let doc;

    // Use transaction if specified
    if (options.withTransaction) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        doc = await Model.create([data], { session });

        // Additional transaction operations
        if (options.transactionOperations) {
          await options.transactionOperations(doc[0], session);
        }

        await session.commitTransaction();
        doc = doc[0];
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    } else {
      doc = await Model.create(data);
    }

    // Post-operation hook
    if (options.afterCreate) {
      await options.afterCreate(doc, req);
    }

    // Apply custom response transform if provided
    const responseData = options.transform ? options.transform(doc) : doc;

    res.status(201).json({
      status: "success",
      data: {
        data: responseData,
      },
    });
  });

exports.getOne = (Model, options = {}) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    // Handle population options
    if (options.popOptions) {
      if (Array.isArray(options.popOptions)) {
        options.popOptions.forEach((option) => {
          query = query.populate(option);
        });
      } else {
        query = query.populate(options.popOptions);
      }
    }

    const doc = await query;

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    // Apply custom transform if provided
    const responseData = options.transform ? options.transform(doc) : doc;

    res.status(200).json({
      status: "success",
      data: {
        data: responseData,
      },
    });
  });

  exports.getAll = (Model, options = {}) =>
    catchAsync(async (req, res, next) => {
      // Build base query
      let baseQuery = Model.find();
      
      // Apply active/inactive filter before APIFeatures
      if (options.filterBuilder) {
        const customFilter = options.filterBuilder(req);
        if (Object.keys(customFilter).length > 0) {
          baseQuery = Model.find(customFilter);
        }
      }
  
      // Pre-query hook
      if (options.beforeQuery) {
        await options.beforeQuery(req, baseQuery.getFilter());
      }
  
      // Create query with features - but APIFeatures will only apply additional filters
      const features = new APIFeatures(baseQuery, req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
  
      // Execute query
      const docs = await features.query;
  
      // Post-query hook
      if (options.afterQuery) {
        await options.afterQuery(docs, req);
      }
  
      // Apply custom transform if provided
      const responseData = options.transform ? docs.map(options.transform) : docs;
  
      // SEND RESPONSE
      res.status(200).json({
        status: "success",
        results: docs.length,
        data: {
          data: responseData,
        },
      });
    });