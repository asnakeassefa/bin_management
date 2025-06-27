import { User, UserBin } from "../models/index.js";
import { Op } from "sequelize";
import { addDays, format } from "date-fns";
import {
  successResponse,
  errorResponse,
  createdResponse,
  notFoundResponse,
  badRequestResponse,
} from "../utils/responseHandler.js";
import { findNextNonHolidayDate } from "../utils/holidayUtils.js";

// Add a new bin for user
export async function addUserBin(req, res) {
  const {
    binType,
    bodyColor,
    headColor,
    lastCollectionDate,
    collectionInterval,
    notifyDaysBefore,
  } = req.body;

  const userId = req.user.id;

  try {
    // Validate bin type
    if (!["recycle", "garden", "general"].includes(binType)) {
      return badRequestResponse(
        res,
        "Invalid bin type. Must be one of: recycle, garden, general"
      );
    }

    // Check if user already has this bin type
    const existingBin = await UserBin.findOne({
      where: {
        userId,
        binType,
      },
    });
    if (existingBin) {
      return badRequestResponse(res, `User already has a ${binType} bin`);
    }

    // Validate last collection date
    if (!lastCollectionDate || isNaN(new Date(lastCollectionDate))) {
      return badRequestResponse(res, "Invalid last collection date");
    }

    // Validate collection interval
    if (
      !collectionInterval ||
      isNaN(collectionInterval) ||
      collectionInterval <= 0
    ) {
      return badRequestResponse(
        res,
        "Collection interval must be a positive number"
      );
    }

    // Validate colors
    if (
      !/^#[0-9A-F]{6}$/i.test(bodyColor) ||
      !/^#[0-9A-F]{6}$/i.test(headColor)
    ) {
      return badRequestResponse(
        res,
        "Body and head colors must be valid hex color codes"
      );
    }

    // Check if last collection date is in the future
    if (new Date(lastCollectionDate) > new Date()) {
      return badRequestResponse(
        res,
        "Last collection date cannot be in the future"
      );
    }

    // Check if collection interval is valid
    if (collectionInterval <= 0) {
      return badRequestResponse(
        res,
        "Collection interval must be a positive number"
      );
    }

    // check that the last collection date is not 30 days in the past
    const thirtyDaysAgo = addDays(new Date(), -30);
    if (new Date(lastCollectionDate) < thirtyDaysAgo) {
      return badRequestResponse(
        res,
        "Last collection date cannot be more than 30 days in the past"
      );
    }

    // check if last collection date + collection interval is not in the past
    const lastCollectionWithInterval = addDays(
      new Date(lastCollectionDate),
      collectionInterval
    );
    if (lastCollectionWithInterval < new Date()) {
      return badRequestResponse(
        res,
        "Last collection date plus collection interval cannot be in the past"
      );
    }

    // Calculate next collection date, skipping holidays
    const initialNextDate = addDays(
      new Date(lastCollectionDate),
      collectionInterval
    );
    const nextCollectionDate = await findNextNonHolidayDate(
      initialNextDate,
      req.user.country
    );

    // Create user bin
    const userBin = await UserBin.create({
      userId,
      binType,
      bodyColor,
      headColor,
      lastCollectionDate,
      collectionInterval,
      nextCollectionDate,
      notifyDaysBefore: notifyDaysBefore || 1,
    });

    return createdResponse(res, userBin);
  } catch (error) {
    return errorResponse(res, error.message);
  }
}
// Update bin collection schedule
export async function updateBinSchedule(req, res) {
  const { id } = req.params;
  const { lastCollectionDate, collectionInterval } = req.body;
  const userId = req.user.id;

  try {
    const userBin = await UserBin.findOne({
      where: { id, userId },
    });

    if (!userBin) {
      return notFoundResponse(res, "Bin not found");
    }

    // Validate last collection date
    if (!lastCollectionDate || isNaN(new Date(lastCollectionDate))) {
      return badRequestResponse(res, "Invalid last collection date");
    }

    // Validate collection interval
    if (
      !collectionInterval ||
      isNaN(collectionInterval) ||
      collectionInterval <= 0
    ) {
      return badRequestResponse(
        res,
        "Collection interval must be a positive number"
      );
    }

    // Check if last collection date is in the future
    if (new Date(lastCollectionDate) > new Date()) {
      return badRequestResponse(
        res,
        "Last collection date cannot be in the future"
      );
    }

    // Check if collection interval is valid
    if (collectionInterval <= 0) {
      return badRequestResponse(
        res,
        "Collection interval must be a positive number"
      );
    }

    // check that the last collection date is not 30 days in the past
    const thirtyDaysAgo = addDays(new Date(), -30);
    if (new Date(lastCollectionDate) < thirtyDaysAgo) {
      return badRequestResponse(
        res,
        "Last collection date cannot be more than 30 days in the past"
      );
    }

    // check if the last collection date + collection interval is not in the past
    const lastCollectionWithInterval = addDays(
      new Date(lastCollectionDate),
      collectionInterval
    );
    if (lastCollectionWithInterval < new Date()) {
      return badRequestResponse(
        res,
        "Last collection date plus collection interval cannot be in the past"
      );
    }
    // Update collection schedule
    const initialNextDate = addDays(
      new Date(lastCollectionDate),
      collectionInterval
    );
    const nextCollectionDate = await findNextNonHolidayDate(
      initialNextDate,
      req.user.country
    );

    const updates = {
      lastCollectionDate,
      collectionInterval,
      nextCollectionDate,
    };

    await userBin.update(updates);

    return successResponse(res, userBin);
  } catch (error) {
    return errorResponse(res, error.message);
  }
}
// Update bin appearance
export async function updateBinAppearance(req, res) {
  const { id } = req.params;
  const { bodyColor, headColor } = req.body;
  const userId = req.user.id;

  try {
    const userBin = await UserBin.findOne({
      where: { id, userId },
    });

    if (!userBin) {
      return notFoundResponse(res, "Bin not found");
    }

    // check they are not number and are valid hex colors
    if (
      !/^#[0-9A-F]{6}$/i.test(bodyColor) ||
      !/^#[0-9A-F]{6}$/i.test(headColor)
    ) {
      return badRequestResponse(
        res,
        "Body and head colors must be valid hex color codes"
      );
    }

    await userBin.update({ bodyColor, headColor });
    return successResponse(res, userBin);
  } catch (error) {
    return errorResponse(res, error.message);
  }
}
// Get user's bins
export async function getUserBins(req, res) {
  const userId = req.user.id;

  try {
    const userBins = await UserBin.findAll({
      where: { userId },
      order: [["nextCollectionDate", "ASC"]],
    });

    return successResponse(res, userBins);
  } catch (error) {
    return errorResponse(res, error.message);
  }
}
// Get upcoming collections
export async function getUpcomingCollections(req, res) {
  const userId = req.user.id;
  const { days = 7 } = req.query;

  try {
    const endDate = addDays(new Date(), parseInt(days));

    const upcomingCollections = await UserBin.findAll({
      where: {
        userId,
        nextCollectionDate: {
          [Op.between]: [new Date(), endDate],
        },
      },
      order: [["nextCollectionDate", "ASC"]],
    });

    // Format the response
    const formattedCollections = upcomingCollections.map((bin) => ({
      binType: bin.binType,
      nextCollectionDate: format(bin.nextCollectionDate, "yyyy-MM-dd"),
      daysUntil: Math.ceil(
        (bin.nextCollectionDate - new Date()) / (1000 * 60 * 60 * 24)
      ),
      bodyColor: bin.bodyColor,
      headColor: bin.headColor,
    }));

    return successResponse(res, formattedCollections);
  } catch (error) {
    return errorResponse(res, error.message);
  }
}
