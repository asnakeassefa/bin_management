import { User, UserBin } from "../models/index.js";
import { Op } from "sequelize";
import { addDays, format } from "date-fns";

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
      return res.status(400).json({
        status: "error",
        message: "Invalid bin type. Must be one of: recycle, garden, general",
      });
    }

    // Check if user already has this bin type
    const existingBin = await UserBin.findOne({
      where: {
        userId,
        binType,
      },
    });
    if (existingBin) {
      return res.status(400).json({
        status: "error",
        message: `User already has a ${binType} bin`,
      });
    }
    // Validate last collection date
    if (!lastCollectionDate || isNaN(new Date(lastCollectionDate))) {
      return res.status(400).json({
        status: "error",
        message: "Invalid last collection date",
      });
    }
    // Validate collection interval
    if (
      !collectionInterval ||
      isNaN(collectionInterval) ||
      collectionInterval <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "Collection interval must be a positive number",
      });
    }
    // Validate notify days before
    if (notifyDaysBefore && (isNaN(notifyDaysBefore) || notifyDaysBefore < 0)) {
      return res.status(400).json({
        status: "error",
        message: "Notify days before must be a non-negative number",
      });
    }
    // Validate colors
    if (
      !/^#[0-9A-F]{6}$/i.test(bodyColor) ||
      !/^#[0-9A-F]{6}$/i.test(headColor)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Body and head colors must be valid hex color codes",
      });
    }
    // Check if last collection date is in the future
    if (new Date(lastCollectionDate) > new Date()) {
      return res.status(400).json({
        status: "error",
        message: "Last collection date cannot be in the future",
      });
    }
    // Check if collection interval is valid
    if (collectionInterval <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Collection interval must be a positive number",
      });
    }
    // check that the last collection date is not 30 days in the past
    const thirtyDaysAgo = addDays(new Date(), -30);
    if (new Date(lastCollectionDate) < thirtyDaysAgo) {
      return res.status(400).json({
        status: "error",
        message: "Last collection date cannot be more than 30 days in the past",
      });
    }

    // check if last collection date + collection interval is not in the past
    const lastCollectionWithInterval = addDays(
      new Date(lastCollectionDate),
      collectionInterval
    );
    if (lastCollectionWithInterval < new Date()) {
      return res.status(400).json({
        status: "error",
        message:
          "Last collection date plus collection interval cannot be in the past",
      });
    }
    // Check if notify days before is valid
    if (notifyDaysBefore && notifyDaysBefore < 0) {
      return res.status(400).json({
        status: "error",
        message: "Notify days before must be a non-negative number",
      });
    }
    // Check if last collection date is before today
    if (new Date(lastCollectionDate) < new Date()) {
      return res.status(400).json({
        status: "error",
        message: "Last collection date cannot be in the past",
      });
    }

    // Calculate next collection date
    const nextCollectionDate = addDays(
      new Date(lastCollectionDate),
      collectionInterval
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

    res.status(201).json({
      status: "success",
      data: userBin,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
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
      return res.status(404).json({
        status: "error",
        message: "Bin not found",
      });
    }
    // Validate last collection date
    if (!lastCollectionDate || isNaN(new Date(lastCollectionDate))) {
      return res.status(400).json({
        status: "error",
        message: "Invalid last collection date",
      });
    }

    // Validate collection interval
    if (
      !collectionInterval ||
      isNaN(collectionInterval) ||
      collectionInterval <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "Collection interval must be a positive number",
      });
    }
    // Check if last collection date is in the future
    if (new Date(lastCollectionDate) > new Date()) {
      return res.status(400).json({
        status: "error",
        message: "Last collection date cannot be in the future",
      });
    }
    // Check if collection interval is valid
    if (collectionInterval <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Collection interval must be a positive number",
      });
    }
    // check that the last collection date is not 30 days in the past
    const thirtyDaysAgo = addDays(new Date(), -30);
    if (new Date(lastCollectionDate) < thirtyDaysAgo) {
      return res.status(400).json({
        status: "error",
        message: "Last collection date cannot be more than 30 days in the past",
      });
    }
    // check if the last collection date + collection interval is not in the past
    const lastCollectionWithInterval = addDays(
      new Date(lastCollectionDate),
      collectionInterval
    );
    if (lastCollectionWithInterval < new Date()) {
      return res.status(400).json({
        status: "error",
        message:
          "Last collection date plus collection interval cannot be in the past",
      });
    }

    // Check if last collection date is before next collection date
    if (new Date(lastCollectionDate) >= new Date(userBin.nextCollectionDate)) {
      return res.status(400).json({
        status: "error",
        message:
          "Last collection date must be before the current next collection date",
      });
    }
    // Check if collection interval is less than the difference between last and next collection dates
    const currentNextCollectionDate = new Date(userBin.nextCollectionDate);

    const daysDifference = Math.ceil(
      (currentNextCollectionDate - new Date(lastCollectionDate)) /
        (1000 * 60 * 60 * 24)
    );
    if (collectionInterval < daysDifference) {
      return res.status(400).json({
        status: "error",
        message:
          "Collection interval must be greater than or equal to the difference between last and next collection dates",
      });
    }

    // Update collection schedule
    const updates = {
      lastCollectionDate,
      collectionInterval,
      nextCollectionDate: addDays(
        new Date(lastCollectionDate),
        collectionInterval
      ),
    };

    await userBin.update(updates);

    res.json({
      status: "success",
      data: userBin,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
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
      return res.status(404).json({
        status: "error",
        message: "Bin not found",
      });
    }
    // check they are not number and are valid hex colors
    if (
      !/^#[0-9A-F]{6}$/i.test(bodyColor) ||
      !/^#[0-9A-F]{6}$/i.test(headColor)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Body and head colors must be valid hex color codes",
      });
    }
    await userBin.update({ bodyColor, headColor });
    res.json({
      status: "success",
      data: userBin,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
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

    res.json({
      status: "success",
      data: userBins,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
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

    res.json({
      status: "success",
      data: formattedCollections,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}
